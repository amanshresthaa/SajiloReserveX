---
task: my-bookings-revamp
timestamp_utc: 2025-11-17T11:21:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Reuse existing dashboard components (BookingsTable, dialogs) and shadcn UI primitives
- [ ] Add feature flag <flag_name> (default off) — not planned (UX-only)

## Core

- [x] Keep existing bookings data fetching/edit/cancel flows intact
- [x] Split experience: new `/dashboard` guest home + lighter `/my-bookings` focused on table
- [x] Add insights/spotlight/quick actions to dashboard overview
- [ ] Validate error states and filters still behave in new layout

## UI/UX

- [x] Responsive grid updates for dashboard + bookings pages
- [ ] Loading/empty/error states verified after changes
- [ ] A11y roles, labels, focus mgmt (keyboard pass)

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:

## Batched Questions

- ...
