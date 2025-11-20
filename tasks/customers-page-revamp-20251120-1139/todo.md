---
task: customers-page-revamp
timestamp_utc: 2025-11-20T11:39:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Extend customers data flow (schema/service/query) with search/marketing/last-visit/min-bookings/sort support
- [ ] Add feature flag <flag_name> (default off)

## Core

- [x] Data fetching / mutations (filters propagate from UI → service → API/export)
- [x] Validation & error surfaces (schema, forbidden/membership handling)
- [x] URL/state sync & navigation for customers filters+paging

## UI/UX

- [x] Responsive layout (filter toolbar, cards/table)
- [x] Loading/empty/error states updated for filtered views
- [ ] A11y roles, labels, focus mgmt (manual QA pass pending)

## Tests

- [ ] Unit (helpers/query parsing if time)
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks
- [ ] Linting/Type checks

## Notes

- Assumptions:
- Deviations: No feature flag introduced (ship behind existing membership checks)

## Batched Questions

- ...
