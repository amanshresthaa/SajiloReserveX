---
task: remove-bookings-new-route
timestamp_utc: 2025-11-19T23:21:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Locate `/bookings/new` route definition and delete or disable it.
- [x] Identify all CTAs/links pointing to the route.

## Core

- [x] Remove or update route file.
- [x] Remove or replace CTA targets.

## UI/UX

- [ ] Confirm navigation remains consistent and accessible.

## Tests

- [x] Run static search to confirm no `/bookings/new` references remain.

## Notes

- Assumptions:
  - No replacement route specified; removal without redirect is acceptable.
- Deviations:
  - Manual UI QA via Chrome DevTools pending; dev server not run in this session.

## Batched Questions

- What URL should replace `/bookings/new` if a CTA needs a destination?
