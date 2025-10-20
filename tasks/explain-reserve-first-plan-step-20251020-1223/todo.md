# Implementation Checklist

## Setup

- [x] Locate implementation of the first plan step in `/reserve`

## Core

- [x] Document logic flow and dependencies
- [x] Optimize schedule prefetching strategy
- [x] Remove config-based defaults in favor of schedule data
- [x] Refactor plan step hook into smaller composable pieces
- [x] Reduce unnecessary global state writes (notes sync)
- [x] Eliminate static fallback time flashes
- [x] Extend ops API/schema to accept reservation cadence fields
- [x] Add cadence inputs/validation to `RestaurantDetailsForm`
- [x] Wire ops hooks/services to new fields and ensure UI persists changes

## UI/UX

- [ ] Not applicable

## Tests

- [ ] Not applicable

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- None currently
