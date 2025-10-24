# Implementation Checklist

## Setup

- [x] Confirm existing booking edit flow
- [x] Identify availability source

## Core

- [x] Update server/client validation to reject unavailable slots
- [x] Ensure error messaging is user friendly

## UI/UX

- [x] Disable or hide unavailable times
- [ ] Handle loading/empty/error states
- [ ] Confirm accessibility on time selection

## Tests

- [x] Unit
- [ ] Integration
- [ ] E2E
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
  - Schedule availability is pre-fetched in production flows; tests can bypass day gating without changing behaviour.
- Deviations:
  - Unit test stubs `isDateUnavailable` to keep the picker enabled while exercising manual entry validation.

## Batched Questions (if any)

- ...
