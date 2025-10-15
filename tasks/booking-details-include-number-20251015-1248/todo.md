# Implementation Checklist

## Setup

- [x] Review existing booking details modal component
- [x] Trace data flow from API to DTO

## Core

- [x] Extend `/api/ops/bookings` DTO with `customerPhone`
- [x] Update shared `BookingDTO`/`OpsBookingListItem` types & mappings
- [x] Surface customer phone number in the dialog UI

## UI/UX

- [ ] Ensure responsive layout remains intact
- [ ] Confirm empty state messaging when number missing
- [ ] Validate accessibility semantics remain correct

## Tests

- [x] Update or add tests as needed

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- None
