# Research: Guest Booking Table Reset

## Requirements

- Functional:
  - When a guest edits an existing booking (web dashboard or authenticated route), any previously assigned tables must be cleared and capacity should be re-run so fresh assignments are applied for the new slot.
  - When a guest cancels a booking, tables that were assigned to that booking must be released immediately so they are available for other guests.
- Non-functional:
  - Continue to honor existing booking validation (operating hours, past bookings, etc.).
  - Avoid double-booking conflicts by delegating to the allocator/rpc helpers where possible.
  - Keep audit logs, notifications, and customer-facing responses unchanged.

## Existing Patterns & Reuse

- Guest edit route: `src/app/api/bookings/[id]/route.ts` uses `updateBookingRecord` or unified validation (capacity-backed) depending on flags.
- Guest cancel route: same file calls `softCancelBooking`, which currently only updates booking status and customer profile stats.
- Capacity module already exposes `unassignTableFromBooking`, `assignTableToBooking`, and `updateBookingWithCapacityCheck` plus RPC `unassign_tables_atomic`.
- Validation service (`BookingValidationService`) when invoked handles capacity enforcement, but guest edit route can bypass it (legacy path).

## External Resources

- `server/capacity/table-assignment/assignment.ts`: contains helper utilities to unassign/reassign table allocations atomically.
- `server/capacity/transaction.ts`: wraps RPC `update_booking_with_capacity_check` that realigns allocations when schedule shifts.

## Constraints & Risks

- Need to avoid calling allocator when feature flag already used unified validation (to prevent duplicate work) – detect path and only clear tables for legacy updates.
- Ensure new helper handles cases where a booking has zero assignments gracefully.
- Reassignment should be best-effort; failures must not block guest from editing, but should emit logs and leave booking in `pending_allocation` state so staff can fix manually.
- Cancellation path must not throw if release fails; treat as warning.

## Open Questions (owner, due)

- Are there scenarios where guest edits should retain current table? _Assume no per product request._

## Recommended Direction (with rationale)

- Add a reusable helper (e.g., `resetBookingTables`) in `server/bookings.ts` or capacity module that:
  1. Fetches current assignment table IDs for a booking.
  2. Calls `unassign_tables_atomic` via `unassignTableFromBooking` for each table (batched) and logs errors.
- Update guest edit route (legacy branch) to invoke helper right before or after `updateBookingRecord`, then call a new `requestTableReassignment` helper that triggers allocator RPC (`update_booking_with_capacity_check`) or at minimum flips status to `pending_allocation`.
- Update guest cancel route to call helper so tables release immediately when status becomes `cancelled`.
- Add lint-safe logging + unit coverage for helper, and ensure `pnpm lint` passes.
