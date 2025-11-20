---
task: walk-in-bookings
timestamp_utc: 2025-11-19T23:28:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Create/extend components (Shadcn-first; exception noted if any)
- [ ] Add feature flag feat.walk_in.booking (default off) — Not planned (ops auth only) unless requested

## Core

- [x] Data fetching / mutations
- [x] Validation & error surfaces
- [x] URL/state sync & navigation
- [ ] Add CTA entry point to ops bookings

## UI/UX

- [x] Responsive layout
- [x] Loading/empty/error states
- [x] A11y roles, labels, focus mgmt

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
  - /walk-in should be reachable for ops users; redirect to /app/walk-in acceptable pending IA confirmation.
- Deviations:

## Batched Questions

-
