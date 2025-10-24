# Implementation Checklist

## Setup

- [x] Create/extend components
- [ ] Add feature flag <flag_name> (default off)

## Core

- [x] Data fetching / mutations
- [ ] Validation & error surfaces
- [ ] URL/state sync & navigation

## UI/UX

- [x] Responsive layout
- [x] Loading/empty/error states
- [ ] A11y roles, labels, focus mgmt

## Tests

- [x] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
  - Use restaurant default reservation duration and global clean buffer for turnaround.
  - Fall back to service policy times when restaurant service periods unavailable.
- Deviations:
  - No feature flag introduced (single rollout requested).

## Batched Questions (if any)

- ...
