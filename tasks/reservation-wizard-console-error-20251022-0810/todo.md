# Implementation Checklist

## Setup

- [x] Create task scaffolding

## Core

- [x] Update `useReservationWizard` to skip error reporting for `"BOOKING_IN_PAST"`

## UI/UX

- [x] Sanity-check that booking-in-past flow still routes user to Plan step with alert

## Tests

- [x] Extend `BookingWizard.plan-review` test to assert reporter behavior
- [x] Run relevant unit tests

## Notes

- Assumptions: Only `"BOOKING_IN_PAST"` needs suppression right now.
- Deviations:

## Batched Questions (if any)

- None at this time
