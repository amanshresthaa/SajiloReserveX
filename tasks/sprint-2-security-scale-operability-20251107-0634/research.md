# Research: Sprint 2 - Security, Scale & Operability

## Requirements

- Functional:
  - Enforce tenant-level RLS on `customer`, `booking`, `holds`, `assignments`, `allocations`, and `outbox` tables using `current_setting('app.restaurant_id', true)`.
  - Ensure Supabase Edge Function (request middleware) sets the `app.restaurant_id` setting per request context.
  - Encrypt `customers.email` and `customers.phone` (likely via `pgcrypto`) while keeping normalized/searchable columns for lookup.
  - Mask PII in views for non-privileged roles; only privileged key roles can read decrypted data.
  - Add operational indexes and dedupe uniqueness constraints to `capacity_outbox` for dispatcher performance.
  - Build/extend dashboards & alerts for overlap constraints, outbox issues, policy drifts, assignment latency, and conflict rates.
  - Partition high-churn tables monthly (e.g., `booking_table_assignments`, `table_holds`, `analytics_events`, `observability_events`, `capacity_outbox`) with data migration.
  - Produce documentation/runbooks covering RLS, policy specs, outbox contracts, partition rotation, etc.
- Non-functional (a11y, perf, security, privacy, i18n):
  - RLS and encryption must prevent cross-tenant leakage and protect PII at rest.
  - Dispatcher scans on `capacity_outbox` must remain <10 ms at 100k rows.
  - Partitioning must reduce VACUUM/ANALYZE times and enable fast pruning.
  - Documentation must be comprehensive enough for on-call/SRE to act without tribal knowledge.

## Existing Patterns & Reuse

- `tasks/rls-tenant-scoping-audit-rpcs-20251102-1058` already catalogues RPC entry points that require tenant checks; reuse their findings for enforcement priorities.
- `supabase/schema.sql:6371-6808` shows existing RLS policies rely on `auth.uid()` membership checks, while service-role policies such as `"Service role can manage table assignments"` (`supabase/schema.sql:6489-6510`) simply return `USING (true)`—root cause of cross-tenant leakage when using the service key.
- Customers table currently stores plaintext `email`/`phone` with generated normalized columns (`supabase/schema.sql:3875-3900`) and `CHECK` constraints, so encryption must preserve the generated search columns or replace them with trigger-managed shadow fields.
- `supabase/migrations/20251102114500_capacity_outbox.sql` defines the outbox schema/indexes; we can extend this migration pattern for new concurrent composite/partial indexes.
- Partition/backfill helpers likely live under `supabase/utilities/` (needs inspection) and may include copy scripts reusable for monthly partitions.
- `SUPABASE_SCHEMA_EXPORT_GUIDE.md` & `SUPABASE_ORGANIZATION_COMPLETE.md` document DB topology/security, helpful for planning remote migrations.

## External Resources

- [PostgreSQL RLS docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) – ensure policy syntax and best practices.
- [pgcrypto module docs](https://www.postgresql.org/docs/current/pgcrypto.html) – encryption functions, key management guidance.
- [PostgreSQL table partitioning guide](https://www.postgresql.org/docs/current/ddl-partitioning.html) – reference for range partitioning and attach/detach workflow.

## Constraints & Risks

- Service-role queries currently bypass RLS entirely; enabling policies without first ensuring every code path sets `app.restaurant_id` would cause outages. Need staged rollout + fallbacks.
- Supabase policies must be rolled out carefully (NOT VALID / dry-run reads) to avoid production outages.
- Encryption requires key management; storing keys in Supabase secrets or Vault must be coordinated, and pgcrypto requires enabling extension + deterministic IV approach for lookups.
- Partition migration has downtime/backfill risk; need triggers or routing functions to maintain writes during copy.
- Dashboards/alerts rely on observability stack access (Grafana, SQL monitors); ensure credentials and automation.
- Work touches multiple epics; scope may be too large for a single task—might need sub-tasks per epic component.

## Open Questions (owner, due)

- Q: Where are encryption keys stored / managed (KMS, Vault, env secrets)?  
  A: TBD (Platform/Sec), need confirmation before designing pgcrypto usage.
- Q: Are there existing Supabase Edge Functions for tenant context we should extend?  
  A: TBD (Platform team) – inventory required.
- Q: Which dashboards framework is authoritative (Grafana vs. other)?  
  A: TBD (SRE) – confirm to avoid duplication.
- Q: For partitioning, which tables are prioritized and what is acceptable migration window?  
  A: TBD (DB Eng) – need metrics before plan.

## Recommended Direction (with rationale)

- Treat Sprint 2 scope as a program: break into sub-tasks per epic (F–I) while sharing a master plan here for traceability.
- RLS hardening: introduce helper function `public.current_restaurant_id()` (wrapping `current_setting`) plus `assert_restaurant_context()` to raise when missing; add service-role policies per table referencing that helper, and update Edge Function middleware to set the GUC on every request.
- PII encryption: add `email_encrypted`/`phone_encrypted` `bytea` columns, retain deterministic normalized columns maintained via trigger, and create `customers_secure_view` (masked) + `customers_private_view` (requires privileged role) so app continues to read from view while table stores ciphertext.
- Outbox indexes: new concurrent composite index `(status, next_attempt_at)` for dispatcher queries and partial unique index on `(event_type, COALESCE(dedupe_key,''), COALESCE(idempotency_key,''))` filtered to `status IN ('pending','processing')`; update dispatcher query to leverage it and enhance tests.
- Partitioning: script creation of partitioned parents + monthly partitions with attach/detach helpers and triggers; migrate existing data in batches using `INSERT ... SELECT ... WHERE created_at BETWEEN`.
- Observability/docs: codify dashboards (SQL or Grafana JSON) and runbooks in `docs/runbooks/`, ensuring each new control has troubleshooting steps.
- Use Supabase MCP for every migration (remote-only) and capture rollback steps inside `verification.md`. Document assumption/decision changes promptly.
