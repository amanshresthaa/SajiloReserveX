# Implementation Checklist

## Setup

- [x] Create task folder, capture research & plan templates.

## Core

- [x] Refine `server/restaurants/schedule.ts` to derive slot availability from actual service periods and expose `availableBookingOptions`.
- [x] Update schedule consumers (`ReservationSchedule` type, hooks) to handle the new contract.

## UI/UX

- [x] Adjust Occasion picker flow to disable options that are not in `availableBookingOptions` while preserving existing layout.

## Tests

- [x] Extend/adjust server schedule tests to cover new availability logic.
- [x] Update wizard hook/component tests and fixtures to match the new contract.

## Notes

- Assumptions: Drinks should only surface when at least one drinks service period exists on the selected date.
- Deviations: Augmented API route test asserts new contract; no dedicated unit tests for schedule helper yet.

## Batched Questions (if any)

- None at this time.
