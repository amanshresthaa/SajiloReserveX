# Research: Booking Table Reassignment

## Requirements

- Functional:
  - Editing a booking from the ops dashboard must clear or recalculate table assignments when the update changes key allocation inputs (party size, booking date, start/end times).
  - After increasing the party size, the assignment should either be re-planned via the capacity engine or left unassigned so manual reassignment can occur.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Keep booking update latency low (single PATCH call should stay <1s under normal load).
  - Preserve audit logging & side effects already emitted by the route.
  - Avoid leaking booking existence (unchanged security posture).

## Existing Patterns & Reuse

- Guest-facing booking update route (`src/app/api/bookings/[id]/route.ts:720`) already detects when an edit requires “table realignment”, attempts `updateBookingWithCapacityCheck`, and calls `clearBookingTableAssignments` when falling back to a plain record update.
- `clearBookingTableAssignments` in `server/bookings.ts:463` encapsulates releasing existing table assignments via `unassign_tables_atomic`.
- `updateBookingWithCapacityCheck` (exported from `server/capacity/transaction.ts`) performs the reassignment logic and should be reused in the ops flow.
- Unified validation path in `src/app/api/ops/bookings/[id]/route.ts` (`handleUnifiedOpsUpdate`, line ~450) already routes through the booking validation service which, in turn, invokes the capacity engine; only the legacy path lacks this safeguard.

## External Resources

- Internal task `tasks/guest-table-reset-20251107-1741/plan.md` documents the expectation that legacy booking updates clear table assignments before/after `updateBookingRecord`.

## Constraints & Risks

- Need to honor `env.featureFlags.bookingValidationUnified`; legacy adjustments should only run when the flag is false.
- Ops PATCH route relies on a tenant-scoped Supabase client for updates; any capacity calls must continue to use tenant/service clients that satisfy RLS.
- Clearing assignments without successfully updating the booking could strand bookings; ensure we only clear after the record update succeeds (fallback case), mirroring guest route semantics.

## Open Questions (owner, due)

- Q: Should we force a capacity recompute on every change (even party-size decreases) or only when increasing?  
  A: Follow guest route precedent—realignment triggers whenever size/time/date change, regardless of direction, to keep allocations consistent.

## Open Questions (owner, due)

- Q:
  A:

## Recommended Direction (with rationale)

- In the non-unified OPS PATCH branch, calculate a `requiresTableRealignment` boolean (compare booking date/time/end & party size with incoming payload).
- When realignment is required, first try `updateBookingWithCapacityCheck` with the full booking context (restaurant, customer, seating preference, etc.). If success, return immediately.
- If capacity update fails or is unavailable, fall back to the existing `updateBookingRecord` call but immediately invoke `clearBookingTableAssignments` so tables are freed for manual reassignment.
- Add regression tests around the legacy branch to ensure `clearBookingTableAssignments` is invoked whenever party size changes.
