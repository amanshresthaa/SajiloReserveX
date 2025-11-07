# Implementation Checklist

## Setup

- [ ] Validate assumptions with Platform/DB Eng (tenant context source, encryption keys in Vault/KMS, observability owners).
- [ ] Inventory existing migrations/scripts for RLS, encryption, partitioning, and document in `research.md`.
- [ ] Prepare Supabase MCP connection + secrets for remote migrations (no local runs).
- [ ] Confirm feature flag states (`allocator.*`, `policy.*`) for safe rollouts.

## Core

- [x] Draft helper functions + RLS policies for service-role tables; add migration `20251107094000_tenant_rls_foundation.sql`.
- [ ] Update Supabase Edge Function / server middleware to set `app.restaurant_id` and add integration tests.
  - [x] Provide tenant-scoped service client helper + wire staff manual endpoints to it.
  - [x] Extend context propagation to staff auto quote/confirm routes.
  - [ ] Extend context propagation to ops APIs, bookings exports, and background jobs.
- [ ] Introduce encrypted/masked PII columns, triggers, and views; write staged backfill (batched updates) guarded by feature flag.
- [ ] Update app data layer to read from `customers_secure_view` by default and gate privileged access paths.
- [x] Apply `capacity_outbox` composite + partial indexes (CONCURRENTLY) and refactor dispatcher query/tests accordingly.
- [ ] Capture Grafana/SQL dashboards + alert definitions; wire synthetic incident scripts.
- [ ] Design & implement monthly partitioning (schema, triggers, migration/backfill scripts) for selected tables plus automation for rotation.

## UI/UX & Docs

- [ ] Document RLS model + tenant context flow in `docs/runbooks/rls.md`.
- [ ] Document PII encryption/masking behavior in `docs/runbooks/pii.md`.
- [ ] Document outbox contract + alerting, and partition maintenance runbooks.
- [ ] Capture dashboards/alerts setup with screenshots/JSON + include in docs.

## Verification

- [ ] Supabase MCP migration logs attached in `verification.md`.
- [ ] Security tests proving PII masking and role-based access.
- [ ] Performance benchmarks for dispatcher & VACUUM improvements.
- [ ] Chrome DevTools QA for impacted UI flows (bookings, holds) post-RLS rollout.
- [ ] Synthetic alert tests recorded (screenshots/logs).

## Notes

- Assumptions:
  - Encryption keys stored securely and accessible to migrations via env.
  - Grafana/alerting platform available for automation.
  - Existing service-role queries can tolerate RLS restrictions once `app.restaurant_id` is set.
- Deviations:
  - TBD once stakeholder feedback arrives.

## Batched Questions

- Pending confirmations listed in `research.md` open questions.
