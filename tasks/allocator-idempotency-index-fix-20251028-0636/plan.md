# Implementation Plan: Remove Idempotency Key Index Conflict

## Objective

We will adjust the booking table assignment uniqueness so multi-table allocator writes no longer raise duplicate errors.

## Success Criteria

- [x] Identify and document the conflicting index/constraint.
- [ ] Apply a migration that removes/redefines it without breaking existing protections.
- [ ] Allocator v2 multi-table confirmation succeeds in tests/local verification (manual or automated).

## Architecture & Components

- `public.booking_table_assignments`: currently constrained by `booking_table_assignments_booking_id_idempotency_key_key` (partial unique) and `booking_table_assignments_booking_table_key` (booking/table uniqueness).
- `public.booking_assignment_idempotency`: remains the authoritative record tying an idempotency key to a table set; no change required.
- Migration strategy: drop the partial unique index; ensure down-migration isn’t required (one-way change).

## Data Flow & API Contracts

Endpoint: `rpc/assign_tables_atomic_v2` (invoked by `/api/staff/manual/confirm`, `/api/staff/manual/hold` etc.)
Request: unchanged (booking id, table ids, idempotency key)
Response: unchanged; multi-table insert should no longer fail.
Errors: Expect removal of `assignment duplicate for table <id>` caused by index; other validation/conflict errors remain.

## UI/UX States

- No UI surface changes; staff flows should simply stop surfacing the duplicate conflict toast for multi-table confirmations.

## Edge Cases

- Bookings with manually inserted duplicate rows (legacy data) still handled by `booking_table_assignments_booking_table_key`.
- Deployments must ensure no concurrent migration relies on the dropped index.

## Testing Strategy

- Unit: ensure existing allocator repository tests continue passing.
- Integration: rerun manual confirm/auto assign tests to confirm no regression.
- E2E: optional (skip unless QA requests).
- Accessibility: N/A (no UI impact).

## Rollout

- No feature flag.
- Apply migration to remote via standard Supabase workflow.
- Monitor allocator conflict rate post-deploy; confirm duplicate errors disappear from telemetry.
