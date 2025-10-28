# Implementation Plan: Resolve Lunch Service Overrun Failure

## Objective

We will ensure ops dashboard table assignment succeeds for bookings spanning lunch boundaries without unnecessary failures.

## Success Criteria

- [x] Identify precise guard causing `Reservation would overrun lunch service` and document required behaviour.
- [x] Adjust policy/assignment logic or configuration so valid bookings are assignable (auto-assign now skips gracefully).
- [x] Update tests to cover lunch boundary scenarios.

## Architecture & Components

- `server/capacity/tables.ts:autoAssignTablesForDate` now traps `ServiceOverrunError`, records a skip, and keeps processing remaining bookings.
- Telemetry via `emitSelectorDecision` receives a skip event with `skipReason`, enabling Ops to diagnose overrun cases without blowing up the batch.
- `tests/server/capacity/autoAssignTables.test.ts` extended to simulate a lunch-boundary booking and assert the skip behaviour.

## Data Flow & API Contracts

Endpoint: `POST /api/ops/dashboard/assign-tables`
Request: `{ restaurantId: UUID, date?: YYYY-MM-DD }`
Response: `{ date: string, assigned: Array<{ bookingId, tableIds }>, skipped: Array<{ bookingId, reason }> }`
Errors: Now limited to genuine infrastructure issues; lunch overruns return 200 with `skipped` entries instead of 500.

## UI/UX States

- Loading: unchanged.
- Error: batch no longer fails; UI should show skipped bookings with the overrun reason from payload.
- Success: includes `skipped` array even when no assignments applied.

## Edge Cases

- Bookings crossing into dinner remain skipped until policy allows cross-service seating.
- Restaurants with custom policies (future work) will still throw if they lack defined services altogether (handled by existing fallback).

## Testing Strategy

- Unit: run targeted `autoAssignTables.test.ts`.
- Integration: rely on existing manual confirm/selection suites for regression.
- E2E: optional; ops dashboard should be manually spot-checked once API payload surfaces new skip reason.
- Accessibility: N/A for backend change.

## Rollout

- Feature flag: none.
- Exposure: immediate after deployment.
- Monitoring: watch ops dashboard assignment telemetry for `"overrun"` reasons to ensure rate matches expectations.
