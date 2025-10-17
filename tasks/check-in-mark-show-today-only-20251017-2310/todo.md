# Implementation Checklist

## Setup

- [x] Align on tooltip copy for disabled lifecycle actions
- [x] Update shared type definitions for booking availability (if needed)

## Core

- [x] Extend `BookingActionButton` with an availability prop and disable logic
- [x] Compute `isActionableToday` in `BookingsList` and `BookingDetailsDialog`
- [x] Apply the same restriction in `BookingRow` (Ops bookings table)
- [x] Guard `/check-in` and `/no-show` routes with restaurant timezone comparison

## UI/UX

- [x] Ensure disabled buttons expose clear tooltips for accessibility

## Tests

- [x] Update `booking-lifecycle-routes` tests for the new guard
- [x] Run targeted Vitest suite

## Notes

- Assumptions: Ops experience should be the only surface exposing these lifecycle buttons.
- Deviations: Vitest run triggered unrelated assertion failures in existing ops UI tests; lifecycle route suite passed with new cases.

## Batched Questions (if any)

- None
