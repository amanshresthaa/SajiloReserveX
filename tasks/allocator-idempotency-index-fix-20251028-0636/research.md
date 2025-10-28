# Research: Remove Idempotency Key Index Conflict

## Existing Patterns & Reuse

- `supabase/migrations/20251019102432_consolidated_schema.sql:2739-2743` introduces a partial unique index `booking_table_assignments_booking_id_idempotency_key_key` enforcing `UNIQUE (booking_id, idempotency_key)` whenever the key is non-null.
- `public.assign_tables_atomic_v2` (latest body in `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:205-490`) writes one row per table with the same `p_idempotency_key`, expecting multiple rows per booking/key to coexist.
- The allocator ledger `booking_assignment_idempotency` already records `(booking_id, idempotency_key)` with the associated table set, providing the intended dedupe guarantee without constraining the assignments table itself.

## External Resources

- Supabase MCP queries (e.g., `SELECT indexname, indexdef …`) confirm the index definition in the live DB matches the migration.
- Error reproduction traces from `POST /api/staff/manual/confirm` show the allocator raising `assign_tables_atomic_v2 assignment duplicate ...` exactly when hitting this index.

## Constraints & Risks

- Dropping the unique index must not reintroduce duplicate `(booking_id, table_id)` rows—those remain protected by `booking_table_assignments_booking_table_key`.
- Need to consider reporting/analytics that might rely on unique `(booking_id, idempotency_key)` rows; verify no downstream logic assumes one-row-per-key.
- Migration sequencing: removing a unique index is irreversible without downtime; ensure roll-forward plan includes documenting the change.

## Open Questions (and answers if resolved)

- Q: Do any code paths rely on `booking_table_assignments.idempotency_key` uniqueness per booking?
  A: Searches show no server logic querying by both booking and idempotency key; dedupe uses the ledger table instead.
- Q: Should we retain some composite uniqueness?
  A: Including `table_id` (`UNIQUE (booking_id, table_id, idempotency_key)`) is redundant with existing booking/table uniqueness and still breaks multi-row inserts, so removing the partial index entirely is cleaner.

## Recommended Direction (with rationale)

- Ship a Supabase migration that drops `booking_table_assignments_booking_id_idempotency_key_key`. Rely on `booking_assignment_idempotency` for idempotency enforcement and existing booking/table uniqueness for integrity.
- After migration, re-run manual confirmation to verify multi-table bookings commit without duplicates; capture results in `verification.md`.
