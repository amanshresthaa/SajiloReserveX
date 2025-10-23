# Implementation Checklist

## Setup

- [x] Review existing reservation duration sources
- [x] Confirm Supabase schema changes required

## Core

- [x] Add configurable final slot logic to server schedule generation
- [x] Surface configuration in restaurant settings
- [x] Ensure API validation honours new config

## UI/UX

- [x] Hide times that exceed allowable end time
- [x] Display actionable error messaging for other rejections
- [ ] Validate responsive behaviour remains intact

## Tests

- [x] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- ...
