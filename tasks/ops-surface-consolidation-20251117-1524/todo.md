---
task: ops-surface-consolidation
timestamp_utc: 2025-11-17T15:24:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Confirm IA and endpoint inventory against current routes.
- [ ] Add feature flag wiring if needed for UI changes.

## Core

- [ ] Implement `/api/v1/ops/{bookings,customers,restaurants,team,dashboard}` (reuse existing ops logic).
- [ ] Implement alias `/api/ops/...` forwarding to `/api/v1/ops/...`.
- [ ] Wire `/api/owner/...` and `/api/team/...` adapters to ops endpoints with deprecation headers.
- [ ] Add `PATCH /api/ops/bookings/[id]` canonical handler and deprecate `/status` if present.
- [ ] Add role-based middleware guard sourced from memberships (role: staff | owner).

## UI/UX

- [ ] Align ops routes to new IA (dashboard/bookings/customers/team/settings) with redirects from legacy paths.
- [ ] Wire UI data fetching to `/api/ops/...` exclusively.
- [ ] Implement cross-screen flows (booking → customer profile, customer → prefilled booking, team invite banner/link copy, settings back to dashboard).
- [ ] Update nav labels and CTAs per IA.

## Tests

- [ ] Update/add unit and integration tests for API aliases/adapters and booking PATCH.
- [ ] Update/add E2E happy paths for ops flows (booking, customer, team, settings).
- [ ] Axe/accessibility checks on updated ops screens.

## Notes

- Assumptions: No DB schema migrations needed; existing ops services remain the source of truth.
- Deviations: TBD.

## Batched Questions

- TBD.
