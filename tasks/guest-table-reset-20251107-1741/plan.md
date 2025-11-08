# Implementation Plan: Guest Booking Table Reset

## Objective

Ensure guest-facing booking updates and cancellations correctly release any existing table assignments and, when editing, trigger a fresh assignment via the capacity engine so tables do not remain locked to outdated slots.

## Success Criteria

- [ ] Editing a booking through `PUT /api/bookings/[id]` leaves no stale rows in `booking_table_assignments`; allocator is re-invoked (or booking marked pending) to secure a new table.
- [ ] Cancelling a booking through `DELETE /api/bookings/[id]` frees any assigned tables immediately.
- [ ] Lint passes (`pnpm lint`).

## Architecture & Components

- `server/bookings/tableResets.ts` (new helper module):
  - `clearBookingTableAssignments(bookingId, client)` – fetch IDs, call RPC once, swallow/log errors.
  - `requestBookingReassignment(booking)` – best-effort call into capacity update RPC when unified validation is disabled.
- `server/bookings.ts` exports helper(s) so both API routes can reuse them. Keep Supabase client injection-friendly to support unit tests.
- `src/app/api/bookings/[id]/route.ts`:
  - Legacy update path (non-unified) calls `clearBookingTableAssignments` prior to `updateBookingRecord` (since allocation references old times) and then `requestBookingReassignment` afterwards to flag allocator.
  - DELETE handler calls `clearBookingTableAssignments` immediately after `softCancelBooking` succeeds.

## Data Flow & API Contracts

- Helpers rely on Supabase service client with access to `booking_table_assignments` and RPC `unassign_tables_atomic`.
- Reassignment helper will call `updateBookingWithCapacityCheck` with latest booking payload; on failure it logs and sets booking status to `pending_allocation` (safe default) but does not reject the HTTP request.

## UI/UX States

- No direct UI changes. Guests continue to see success/failure responses as before.

## Edge Cases

- Booking already has zero assignments → helper exits quickly.
- RPC unavailable (older environment) → catch errors, log, and continue.
- Booking updated while unified validation flag ON → skip manual reassignment because validation service already routed through capacity.

## Testing Strategy

- Unit tests for helper(s) mocking Supabase client to verify RPC invocation and graceful failures.
- Rely on existing integration tests + linting for regression detection.

## Rollout

- No feature flag; ship as fix.
- Monitor `booking_table_assignments` for orphaned records via existing observability dashboards.
