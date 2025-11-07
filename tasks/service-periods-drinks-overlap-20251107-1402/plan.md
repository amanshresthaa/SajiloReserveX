# Implementation Plan: Allow Drinks Service Period Overlaps

## Objective

We will enable restaurant operators to define a "Drinks" service period that can overlap other periods without triggering validation errors.

## Success Criteria

- [ ] Operators can save service periods when Drinks overlaps other named periods.
- [ ] Non-Drinks overlaps still produce the existing validation error.

## Architecture & Components

- `server/restaurants/servicePeriods.ts`
  - Add a helper (e.g., `isDrinksPeriod(name: string)`) that returns `true` when the normalized period name equals `drinks`.
  - Update the overlap loop to skip throwing when either adjacent period is Drinks.
  - Keep existing validation/error strings for all other period names.

## Data Flow & API Contracts

- Endpoint: PUT /api/owner/restaurants/[id]/service-periods
- Request/Response: existing contracts reused; only validation logic changes.
- Errors: Non-Drinks overlaps continue to throw `400` with overlap message.

## UI/UX States

- No UI changes anticipated; existing forms continue to show API errors if returned.

## Edge Cases

- Multiple Drinks periods on the same day should not throw.
- Drinks overlapping any food period (Lunch, Dinner, etc.) should be accepted.
- Two non-Drinks overlaps must still throw even if a Drinks period spans the same timeframe.
- All-day entries (`dayOfWeek === null`) must keep the same semantics.

## Testing Strategy

- Unit: add a test suite for the overlap guard covering allowed and blocked combinations plus case-insensitive name behavior.
- Integration: rely on server route tests already mocking `updateServicePeriods`.
- E2E: not in scope.
- Accessibility: unchanged (API-only change).

## Rollout

- No feature flag; safe fix in place.
- Monitoring: API error rates for service periods.
- Kill-switch: revert commit if needed.
