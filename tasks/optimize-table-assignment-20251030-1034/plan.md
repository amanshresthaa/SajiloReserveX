# Implementation Plan: Optimize Table Assignment

## Objective

We will prioritize high-spend (large party) bookings during automatic table assignment while keeping throughput high by minimizing idle table time.

## Success Criteria

- [ ] `autoAssignTablesForDate` processes bookings using a deterministic priority that considers service window and party size (descending).
- [ ] Existing selector scoring/telemetry still executes per booking without regressions (all tests green).
- [ ] New priority ordering covered by unit tests (capacities sorted as expected) and benchmark smoke run still passes.

## Architecture & Components

- Update `server/capacity/tables.ts` so the booking iteration uses a precomputed priority order (bucketed by window start then `party_size` descending) while reusing existing busy-map + planner logic.
- Introduce helper(s) within `tables.ts` to compute booking priority from booking metadata and venue policy; reuse `resolveStartDateTime` to stay time-zone aware.
- Optionally surface a `featureFlags.allocator.prioritizeLargeParties` toggle (env + accessor) to gate rollout.

## Data Flow & API Contracts

- Endpoint: `POST /api/ops/dashboard/assign-tables` (unchanged request/response shape per `src/app/api/ops/dashboard/assign-tables/route.ts`).
- Internal behavior change: ordering of booking processing prior to calling `assignTableToBooking`.
- Errors remain unchanged; still surface skip reasons through telemetry + result payload.

## UI/UX States

- No UI changes expected; Ops dashboard continues to trigger the same API and render assignments.

## Edge Cases

- Bookings without `start_at` fall back to `booking_date` + `start_time`; if both missing, retain original order to avoid runtime errors.
- Equal party sizes within the same bucket should preserve chronological order (stable sort fallback).
- Ensure fallback logic handles `ServiceOverrunError` or missing service definitions without breaking iteration.

## Testing Strategy

- Unit: extend `tests/server/capacity/autoAssignTables.test.ts` to cover new prioritization (e.g., mix of party sizes verifying assignment order).
- Integration: rely on existing tests covering holds/conflicts to ensure no regression; run targeted test file via `pnpm test -- tests/server/capacity/autoAssignTables.test.ts`.
- E2E: none for this backend-only change.
- Accessibility: not applicable.

## Rollout

- Feature flag: add optional env flag if maintainers want gradual rollout; default to enabled in non-prod.
- Exposure: start with staging verification, then enable in production once telemetry validated.
- Monitoring: watch selector telemetry (`emitSelectorDecision`) for increased skips/conflicts.
- Kill-switch: disable the feature flag to revert to chronological ordering.
