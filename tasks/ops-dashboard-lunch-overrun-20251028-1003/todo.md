# Implementation Checklist

## Setup

- [x] Reproduce the error via API/test
- [x] Inspect service window policy configuration

## Core

- [x] Update capacity policy/ops assignment to allow intended reservations
- [x] Ensure ops dashboard handles boundary conditions gracefully

## UI/UX

- [ ] Validate error messaging fallback if restriction remains intentional

## Tests

- [x] Unit
- [x] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:
  - Skipped UI validation/E2E until API integration surfaces new skip reason.

## Batched Questions (if any)

- ...
