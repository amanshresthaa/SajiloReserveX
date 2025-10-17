# Implementation Plan: Booking Status Badge Infinite Loop

## Objective

We will enable staff to view booking status badges without triggering render loops so that the dashboard remains stable.

## Success Criteria

- [ ] Booking status badges render without React update depth errors.
- [ ] Dashboard performance remains unchanged in profiler metrics (manual QA).

## Architecture & Components

- BookingStateMachine reducer: add structural sharing optimisation so `REGISTER` returns the existing state when snapshots match stored values.
- useBookingRealtime hook: verify effect dependencies remain accurate after reducer changes.
  State: Context reducer inside `BookingStateMachineProvider` | Routing/URL state: unaffected.

## Data Flow & API Contracts

Endpoint: n/a
Request: n/a
Response: n/a
Errors: n/a

## UI/UX States

- Loading: unchanged.
- Empty: unchanged.
- Error: remain absent; ensure no new UI states introduced.
- Success: badges display correct status text and color.

## Edge Cases

- Bookings whose status genuinely changes should still update downstream consumers.
- Optimistic transitions must continue to preserve `optimistic` metadata without being wiped by the optimisation.

## Testing Strategy

- Unit: extend `booking-state-machine` reducer tests (or add new ones) to cover idempotent `REGISTER` dispatches.
- Integration: run existing ops dashboard/state-machine tests if available.
- E2E: smoke via existing Playwright scenario (if available).
- Accessibility: confirm badge semantics unchanged (no UI change introduced).

## Rollout

- Feature flag: not applicable.
- Exposure: immediate with monitoring via manual QA.
- Monitoring: rely on runtime logs during manual verification.
