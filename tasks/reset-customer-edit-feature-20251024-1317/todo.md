# Implementation Checklist

## Setup

- [x] Create task folder

## Discovery

- [x] Locate all edit UI/routes for My Booking

## Core

- [x] Remove edit UI controls (buttons/links)
- [x] Remove edit-specific components/modals/forms (customer-facing)
- [x] Remove client calls to edit APIs (customer-facing triggers)
- [x] Update navigation/tests where applicable

## UI/UX

- [ ] Verify My Booking views render without edit affordances

## Tests

- [x] Run unit tests (vitest). Non-related test failing; component changes pass.

## Notes

- Assumptions: We only remove customer-facing edit; admin unaffected.
- Deviations: TBD
