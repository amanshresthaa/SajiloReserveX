# Implementation Checklist

## Setup

- [x] Confirm data sources for bookings
- [x] Identify component to display guest count

## Core

- [x] Implement data fetching for today's bookings with guest aggregation
- [x] Display count in /ops dashboard
- [x] Ensure updates when data changes

## UI/UX

- [x] Handle loading/empty/error states
- [x] Ensure count is accessible with proper semantics

## Tests

- [ ] Unit tests for data utilities
- [x] Integration test for dashboard display
- [ ] Accessibility checks if UI updates

## Notes

- Assumptions:
  - Existing `summary.totals.covers` field represents today's total guest count.
- Deviations:
  - Manual accessibility/DevTools checks pending due to unavailable authenticated UI session.

## Batched Questions (if any)

-
