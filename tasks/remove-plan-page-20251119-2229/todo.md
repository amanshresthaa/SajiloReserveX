---
task: remove-plan-page
timestamp_utc: 2025-11-19T22:29:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Inventory existing `/bookings/new` route, entry points, and redirects.

## Core

- [x] Replace `/bookings/new` page with redirect to `/bookings`.
- [x] Remove `OpsWalkInBookingClient` component/export.
- [x] Strip nav/CTA links (`OPS_NAV_SECTIONS`, bookings header, customer actions).
- [x] Retarget `/reserve` redirect to `/bookings`; update route screenshot manifest.

## UI/UX

- [x] Ensure layout still aligns in bookings header without the extra CTA.
- [x] Remove actions column in customers table without breaking table structure.

## Tests

- [x] Update/remove unit tests tied to walk-in client.
- [x] Remove Playwright walk-in spec and smoke check targeting `/bookings/new`.
- [ ] Run automated tests (planned: `pnpm test:ops` if time permits).

## Notes

- Assumptions: ops walk-in creation is intentionally retired; redirect to `/bookings` is acceptable for legacy hits.
- Deviations: full test suite not yet run; will document in verification.

## Batched Questions

- None at this time.
