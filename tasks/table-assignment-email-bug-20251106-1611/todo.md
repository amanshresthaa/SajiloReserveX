# Implementation Checklist

## Setup

- [x] Review manual confirmation flow and identify missing status transition/email trigger

## Core

- [x] Add transition metadata + confirmed email dispatch to `POST /api/staff/manual/confirm`
- [x] Guard email send with suppression flag and duplicate-confirm checks

## UI/UX

- [ ] N/A (API-only change)

## Tests

- [x] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: Manual reconfirmation after initial confirmation should rely on update emails, so we skip duplicate confirmation sends.
- Deviations: None.

## Batched Questions (if any)

- None
