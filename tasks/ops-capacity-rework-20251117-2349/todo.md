---
task: ops-capacity-rework
timestamp_utc: 2025-11-17T23:49:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Confirm feature flag approach (`feat.ops.capacity_v2`?) and default state.
- [ ] Validate Supabase permissions for `booking_occasions` (service role SELECT).

## Core

- [ ] Fix timeline data correctness (service windows, holds/reservations, schedule alignment).
- [ ] Add/adjust filters/actions (per final requirements).
- [ ] Improve refresh/realtime behavior; cache invalidation.

## UI/UX

- [x] Responsive layout for mobile/tablet/desktop.
- [x] Clear reserved/hold/out-of-service visuals and labels.
- [ ] Keyboard navigation and focus states for filters/timeline items.
- [ ] Loading/empty/error/closed states polished.

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E/Component
- [ ] Accessibility (axe/manual)

## Notes

- Assumptions:
- Deviations:

## Batched Questions

- [ ] Which new filters/actions are required?
- [ ] Target devices/browsers and perf budgets beyond defaults?
- [ ] Flagged rollout required?
