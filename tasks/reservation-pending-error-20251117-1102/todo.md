---
task: reservation-pending-error
timestamp_utc: 2025-11-17T11:02:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Inspect existing reservations schedule query and API usage (no Shadcn additions expected).
- [ ] Confirm reproduction steps within app for affected venue/date.

## Core

- [x] Identify cause of pending hydration rejection for `reservations/schedule` query.
- [x] Implement fix ensuring server/client query states align and errors handled gracefully.

## UI/UX

- [ ] Ensure loading/empty/error states remain intact and accessible after fix.

## Tests

- [x] Assess existing test coverage; add/update targeted test if feasible.
- [ ] Manual sanity checks on multiple dates/venues.

## Notes

- Assumptions: Reuse existing data-fetch utilities and components.
- Deviations: None yet.

## Batched Questions

- None currently.
