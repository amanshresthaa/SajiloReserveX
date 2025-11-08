# Implementation Checklist

## Setup

- [x] Confirm Supabase service-period data (via seeds or Supabase CLI) to verify lunch/drinks/dinner windows.
- [x] Capture baseline reproduction notes (current default = drinks even during lunch/dinner).

## Core

- [x] Refactor `server/restaurants/schedule.ts` to resolve overlapping periods deterministically (helper + priority rules).
- [x] Ensure `defaultBookingOption` always reflects the resolved period, and availability labels still match the chosen period.
- [x] Align service-period validation so drinks (fallback) periods can overlap meal windows without 400s.

## Tests

- [x] Add/extend unit tests in `tests/server/restaurants/schedule.test.ts` that cover lunch-overrides-drinks, dinner-overrides-drinks, and drinks-only fallback.
- [x] Run targeted lint/tests (at minimum `pnpm test --filter schedule` if available, otherwise relevant suites).

## Verification

- [ ] (Optional) Use Supabase CLI against remote data to spot-check slot ownership.
- [ ] Document results + attach test command outputs in `verification.md`.

## Notes

- Assumptions: Occasion catalog remains lunch/drinks/dinner for now but solution must support arbitrary keys.
- Deviations: None yet.
