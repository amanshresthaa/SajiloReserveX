# Research: Assign Tables Duplicate Error Reset

## Existing Patterns & Reuse

- Supabase function `public.assign_tables_atomic_v2` (latest body in `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql`) updates existing rows when it encounters `unique_violation` on `(booking_id, table_id)` via `booking_table_assignments_booking_table_key`.
- `booking_table_assignments` now also enforces uniqueness on `(table_id, slot_id)` (`supabase/migrations/20251027120000_add_unique_constraint_to_booking_table_assignments.sql`), which can surface as `unique_violation` during inserts/updates if another booking already owns the slot.
- Conflict detection prior to insert relies on `extractConflictsForTables`/`buildBusyMaps` in `server/capacity/tables.ts:1940-2043`; however, concurrent writes between the conflict check and the INSERT can still raise constraint errors.
- Telemetry for RPC failures is emitted via `emitRpcConflict` in `server/capacity/telemetry.ts`, making it easier to trace the failing booking/table IDs.

## External Resources

- `appendix.md` ("RPC v2 core checks") summarises the transactional order inside `assign_tables_atomic_v2`, including when advisory locks are taken and when merge allocations are written.
- Task `tasks/table-adjacency-bug-20251027-2058` documents earlier work to handle directed adjacency and duplicate reconciliation, providing historical context for similar errors.

## Constraints & Risks

- Duplicate rows in `booking_table_assignments` predating the unique constraints can still exist in legacy data; ON CONFLICT fallbacks will fail if the conflicting row is tied to a different booking.
- Removing rows manually must also clear related entries in `allocations` and `booking_assignment_idempotency` to avoid partial state that keeps causing conflicts.
- We must not run destructive SQL without coordination; remediation queries should be provided but executed manually against the remote Supabase instance per project policy.

## Open Questions (and answers if resolved)

- Q: When does `assign_tables_atomic_v2` re-raise `assignment duplicate` after the fallback UPDATE?
  A: Only when the conflicting row does not belong to the same booking—i.e., another booking already holds the `(booking_id, table_id)` pair (data corruption) or the `(table_id, slot_id)` unique constraint is violated by another booking between the conflict check and the INSERT.
- Q: Does the advisory lock prevent cross-booking conflicts?
  A: The lock is scoped to `(zone, service_date)` (`supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:201-205`); bookings in the same zone/date serialize, but manual edits outside the function can still introduce duplicates.

## Recommended Direction (with rationale)

- Inspect the booking/table referenced in the error to enumerate all rows in `booking_table_assignments`, `allocations`, and `booking_assignment_idempotency`—confirm whether stale data or another active booking owns the table.
- Provide a deterministic cleanup script that deletes the offending rows (and associated allocations/idempotency entries) so the retry starts from a clean slate while respecting remote-only execution rules.
- After remediation, re-run the assignment (manual or auto) and ensure telemetry shows a successful merge; capture the steps in `verification.md` to prove the reset path works.
