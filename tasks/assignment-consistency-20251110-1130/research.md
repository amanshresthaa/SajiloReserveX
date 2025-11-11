# Research: Assignment Window Consistency

## Requirements

- Ensure table assignment confirmation keeps `booking_table_assignments`, `allocations`, and `booking_assignment_idempotency` in sync atomically so optimistic UI updates never drift from DB state.
- Handle retry/idempotent flows without double-writing or race windows.

## Observations

- `confirm_hold_assignment_tx` performs assignment creation but TypeScript `synchronizeAssignments` later patches windows via multiple PostgREST calls, leaving a race window and risking partial failures.
- Outbox events (`capacity.assignment.sync`) depend on JS updates succeeding, so failures silently drop signals.

## Recommended Direction

- Move the window synchronization into a Postgres function that runs in the same transaction scope and emits the relevant outbox event.
- Update `synchronizeAssignments` to invoke the RPC first, falling back to legacy JS patching only if the RPC is unavailable.
