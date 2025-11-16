---
task: booking-flow-frontend-consolidation
timestamp_utc: 2025-11-16T14:36:13Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm scope of booking flow frontend consolidation
- [x] Identify source files and components

## Core

- [x] Extract relevant booking flow frontend code references
- [x] Structure references into JSON file
- [x] Align offline UX with actual behavior (messaging + keep non-submit controls usable)
- [x] Make consent defaults opt-in with retention copy
- [x] Make post-confirm navigation respect entry context (return path)
- [x] Reduce availability loading friction/copy

## UI/UX

- [ ] Validate keyboard/focus after changes (Chrome DevTools)

## Tests

- [x] Manual validation of JSON output
- [ ] Manual QA of booking wizard (offline/online, consent toggles, close/return path)

## Notes

- Assumptions:
- Deviations:

## Batched Questions

-
