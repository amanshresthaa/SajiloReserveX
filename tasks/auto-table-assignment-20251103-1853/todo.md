# Implementation Checklist

## Setup

- [ ] Create auto-assign service function
- [ ] Add status API route

## Core

- [ ] Wire service into booking-created side-effects
- [ ] Update confirmation hook to reflect assigned/pending

## UI/UX

- [ ] No table visuals added

## Tests

- [ ] Basic smoke via dev run

## Notes

- Assumptions: SQL keeps setting 'confirmed'; UI relies on assignments presence.
- Deviations: No DB status change in this iteration.
