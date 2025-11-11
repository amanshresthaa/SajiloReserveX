# Implementation Plan: Atomic Assignment Sync

1. Create `sync_confirmed_assignment_windows` SQL function to update `booking_table_assignments`, `allocations`, and `booking_assignment_idempotency` in one operation while enqueueing an outbox event.
2. Update `synchronizeAssignments` to call the new RPC whenever assignment windows need adjustment, logging and falling back to the previous multi-call behavior only if the RPC fails.
3. Keep existing behavior for mocked/test environments.
4. Run `pnpm lint` to ensure type/alignment.
