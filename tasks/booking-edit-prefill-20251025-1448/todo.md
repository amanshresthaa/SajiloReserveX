# Implementation Checklist

## Setup

- [x] Inspect current picker initialisation to confirm fallback behaviour.

## Core

- [x] Seed `ScheduleAwareTimestampPicker` initial state from the provided ISO value (date/time + timezone fallback).
- [x] Prevent the initial “today” schedule fetch when an initial date exists and keep `lastCommittedRef` aligned.

## UI/UX

- [ ] Manually verify the edit dialog now opens with the saved date/time active without extra clicks.

## Tests

- [x] Unit — extend `ScheduleAwareTimestampPicker` tests for initial state hydration.
- [ ] Integration
- [ ] E2E
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: Booking API continues to return `restaurantSlug`/timezone for edit flow.
- Deviations: Manual QA on /my-bookings blocked—magic-link sign-in requires credentials that were not provided.

## Batched Questions (if any)

- 
