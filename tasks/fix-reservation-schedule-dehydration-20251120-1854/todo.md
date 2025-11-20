---
task: fix-reservation-schedule-dehydration
timestamp_utc: 2025-11-20T18:54:00Z
owner: github:@assistant
reviewers: [github:@assistant]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Create/extend components (Shadcn-first; exception noted if any)
- [ ] Add feature flag <flag_name> (default off)

## Core

- [x] Data fetching / mutations (persistence sanitization + schedule query meta updates)
- [ ] Validation & error surfaces
- [ ] URL/state sync & navigation

## UI/UX

- [ ] Responsive layout
- [ ] Loading/empty/error states implemented
- [ ] A11y roles, labels, focus mgmt

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: Reservation schedule queries are transient and safe to exclude from persisted caches; only hydrated, idle queries should be stored.
- Deviations: No UI changes in this iteration; Chrome DevTools QA not run (not applicable).

## Batched Questions

-
