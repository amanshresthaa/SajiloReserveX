# Implementation Plan: Sprint 2 Security & Operability

## Objective

We will deliver the Sprint 2 commitments for Epics F–I (tenant RLS & PII protection, outbox hardening, partitioning, documentation/runbooks) so that the platform blocks cross-tenant leakage, protects PII, keeps dispatcher scans fast, and equips on-call teams with actionable guidance.

## Success Criteria

- [ ] Cross-tenant reads/writes fail in staging & prod; requests scoped via `app.restaurant_id`.
- [ ] PII columns for customers remain encrypted/masked; normalized search continues to work; unprivileged roles cannot read raw data.
- [ ] `capacity_outbox` indexes keep dispatcher fetch <10 ms @100k rows; dedupe uniqueness enforced for pending/processing.
- [ ] Dashboards/alerts exist and fire on synthetic incidents for the listed scenarios.
- [ ] Monthly partitions live for targeted tables with migration plan documented.
- [ ] Docs/runbooks published covering policies, outbox, partition rotation, constraints handling.

## Architecture & Components

- **Database / RLS**
  - Add helper functions `public.current_restaurant_id()` and `public.require_restaurant_context()` that wrap `current_setting('app.restaurant_id', true)` and raise on missing context except for whitelisted internal roles.
  - Create/replace service-role policies for high-risk tables (`customers`, `bookings`, `booking_table_assignments`, `table_holds`, `table_hold_members`, `allocations`, `capacity_outbox`, `holds`, `outbox`) enforcing `restaurant_id = public.current_restaurant_id()`.
  - Introduce bypass role (`app_background`) granted only to jobs that can safely read/write across tenants, with explicit checks.
  - Supabase Edge Function middleware (`server/supabase.ts` + API handlers) sets the GUC via RPC (`select public.set_restaurant_context(<tenant>)`) per request.
- **PII Encryption**
  - Add `email_encrypted bytea`, `phone_encrypted bytea`, and masked columns (`email_masked`, `phone_masked`) to `public.customers`; keep normalized search columns but populate via trigger before encrypting.
  - Create deterministic encryption helpers using `pgcrypto` with configurable key via `current_setting('app.pii.key', false)` and initialization vector stored alongside ciphertext when necessary.
  - Expose two views:
    - `customers_secure_view` (default) returns masked emails/phones plus normalized columns.
    - `customers_private_view` decrypts values and is limited to privileged role/service role.
- **Outbox Hardening**
  - `CREATE INDEX CONCURRENTLY IF NOT EXISTS capacity_outbox_dispatch_idx ON public.capacity_outbox (status, next_attempt_at);`
  - `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS capacity_outbox_dedupe_active_idx ON public.capacity_outbox (event_type, COALESCE(dedupe_key,''), COALESCE(idempotency_key,'')) WHERE status IN ('pending','processing');`
  - Update dispatcher query (`server/outbox/dispatcher.ts`) to leverage composite predicate and include tenant scoping.
- **Dashboards & Alerts**
  - SQL queries or Grafana panels hitting metrics tables; alert rules defined in IaC or documented runbook.
- **Partitioning**
  - For each table: create partitioned parent (if not already), monthly child tables keyed by `booking_date` or `created_at`.
  - Trigger or RULE routes inserts; background job migrates historical data month-by-month; detach old heap once migrated.
- **Documentation**
  - Add to `docs/` (e.g., `docs/runbooks/rls.md`, `docs/runbooks/outbox.md`, etc.) referencing behaviors and recovery steps.

## Data Flow & API Contracts

- Edge Function / RPC path:
  1. API request authenticates and resolves tenant ID.
  2. Supabase Edge Function executes `select set_config('app.restaurant_id', <tenant>, true);`
  3. RPC / SQL uses `current_setting('app.restaurant_id', true)` within RLS policies to filter rows.
- `confirm_hold_assignment_tx` RPC:
  - Endpoint: `POST /rpc/confirm_hold_assignment_tx`
  - Request: `{ booking_id, hold_ids[], idempotency_key, context }`
  - Response: assignment IDs, allocation IDs, ledger entries, outbox events.
  - Errors: `rls_violation` if tenant mismatch; `conflict_error` for overlap; `retryable` for transient failures.
- PII Access:
  - `customers_secure_view` returns masked fields for default role.
  - `customers_admin_view` requires privileged role, decrypts via `pgp_sym_decrypt`.

## UI/UX States

- Mostly backend/infra work; UI impact limited to ensuring no regressions. Manual QA still required for flows depending on bookings to ensure they behave under new policies.
- Potential admin dashboards for alerts (if UI updates occur) would need loading/error states (documented in downstream tasks if scope emerges).

## Edge Cases

- System jobs without tenant context (e.g., background sweeps) need bypass role or set `app.restaurant_id` to target tenant safely.
- Legacy rows missing normalized PII must be backfilled before enforcing non-null constraints.
- Partition swap/backfill must handle concurrent writes—likely via `INSERT ... ON CONFLICT DO NOTHING` or disable triggers temporarily.
- Outbox dedupe unique index must treat NULL keys consistently (hence COALESCE usage).

## Testing Strategy

- Unit: policy tests verifying `current_setting` scoping; encryption/decryption helper functions; normalized column derivations.
- Integration: Supabase tests ensuring cross-tenant queries fail; confirm RPC wrappers ensuring transactionality.
- Performance: Benchmark dispatcher query before/after indexes with 100k rows; measure with EXPLAIN ANALYZE.
- Security: Attempt to access PII as unprivileged role; ensure masked output.
- Migration dry run: apply DDL in staging via Supabase MCP; capture outputs in `verification.md`.

## Rollout

- Feature flag(s): ensure `allocator.tx_outbox.enabled` and other relevant flags remain controllable.
- RLS roll-out: enable policies in staging, run verification suite, then enable in prod behind read-only mode before allowing writes.
- PII roll-out: dual-write plaintext + cipher columns (trigger) while backfilling; swap views only after verification; retire plaintext access.
- Partition rollout: create new partitioned tables ahead of time, copy data, swap, then schedule monthly cron to create future partitions.
- Documentation: publish runbooks before production rollout; notify Platform + SRE.

## Detailed Workstreams (Epics)

1. **Epic F — RLS & PII**
   - Migration `20251107090000_rls_tenant_enforcement.sql`: helper functions, service-role policies, `set_restaurant_context` RPC, grants.
   - Migration `20251107100000_customers_encrypt_pii.sql`: new encrypted/masked columns, triggers, deterministic encryption helpers, staged backfill.
   - Application updates: Edge Function middleware sets `app.restaurant_id`; DAO layer selects from `customers_secure_view`; admin tooling uses private view when necessary.
   - Tests: cross-tenant attempts fail, PII masked for non-privileged roles, decrypt succeeds with privileged role only.
2. **Epic G — Outbox & Observability**
   - Migration `20251107103000_capacity_outbox_indexes.sql`: composite/partial indexes created concurrently, reindex script for safety.
   - Dispatcher update + unit/integration tests ensuring query uses new index and respects tenant scoping.
   - Dashboards & alerts encoded as SQL/Grafana JSON in `docs/runbooks/outbox.md`, with synthetic incident scripts for acceptance.
3. **Epic H — Partitioning & Maintenance**
   - Migrations to create partitioned parents plus future partitions for `booking_table_assignments`, `table_holds`, `analytics_events`, `observability_events`, `capacity_outbox`.
   - Trigger-based routing + background copy scripts (batched by month) to migrate historical data.
   - Runbook for monthly partition rotation & pruning; automation script committed under `scripts/partition-maintenance.ts`.
4. **Epic I — Documentation & Runbooks**
   - Produce `docs/runbooks/rls.md`, `docs/runbooks/pii.md`, `docs/runbooks/outbox.md`, `docs/runbooks/partitions.md`, `docs/runbooks/alerts.md`.
   - Each runbook captures detection signals, SQL checklists, rollback paths, and links to dashboards/alert IDs.
