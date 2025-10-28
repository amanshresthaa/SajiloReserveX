# Implementation Plan: Assign Tables Duplicate Error Reset

## Objective

We will eliminate the `assign_tables_atomic_v2 assignment duplicate` failure so that multi-table bookings can be reprocessed without manually clearing state.

## Success Criteria

- [ ] Understand the current database/ledger state that triggers duplicate assignment errors
- [ ] Design a repeatable remediation path (automation or tooling) to reset state safely
- [ ] Validate that a retry after remediation succeeds without duplicate errors

## Architecture & Components

- `public.assign_tables_atomic_v2`: transactional allocator (handles inserts/updates into `booking_table_assignments`, `allocations`, and idempotency ledger).
- `booking_table_assignments`, `allocations`, `booking_assignment_idempotency`: relational tables whose rows must be consistent; lingering rows cause duplicate violations.
- Observability via `emitRpcConflict` and `assign_tables_atomic_v2` errors to trace offending booking/table ids.

## Data Flow & API Contracts

Endpoint: `rpc/assign_tables_atomic_v2`
Request shape matches existing allocator calls (see `server/capacity/tables.ts:1540-1548`).
Response: array of `{ table_id, start_at, end_at, merge_group_id }` per table on success.
Error of interest: `AssignTablesRpcError` with `message` = `assign_tables_atomic_v2 assignment duplicate for table <id>`.

## UI/UX States

- Not applicable

## Edge Cases

- Duplicate rows tied to a prior booking/table combination (legacy data before unique constraint).
- Concurrent booking assignment between conflict check and insert (requires retry after cleaning/rescheduling).
- Merge ledger/allocations referencing deleted bookkeeping rows.

## Testing Strategy

- Add targeted unit/integration coverage that simulates pre-existing conflicting rows to ensure our remediation guidance (cleanup + retry) is reflected in automated checks where feasible.
- Consider a Supabase regression test/canned script that detects duplicate `(booking_id, table_id)` or `(table_id, slot_id)` rows before migrations are applied.

## Rollout

- Provide SQL remediation steps and document them in `verification.md`.
- Coordinate with ops to execute cleanup in staging first; once verified, replicate in production during a scheduled window.
