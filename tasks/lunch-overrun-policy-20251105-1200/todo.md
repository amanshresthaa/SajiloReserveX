# Implementation Checklist

## Setup

- [x] Create task docs

## Core

- [x] Skip service-end clamp for lunch in `computeBookingWindow`

## Tests

- [ ] Typecheck passes
- [ ] Unit tests for dinner clamping still pass

## Notes

- Assumptions: Only lunch overrun relaxation is desired.
- Deviations: None.

## Batched Questions (if any)

- Should UI hide late lunch start times that would overlap dinner setup? (Future UX decision)
