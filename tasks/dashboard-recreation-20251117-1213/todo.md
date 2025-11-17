---
task: dashboard-recreation
timestamp_utc: 2025-11-17T12:13:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Review existing dashboard route/components for reuse (Shadcn-first).
- [x] Confirm data sources/services required for dashboard data.

## Core

- [x] Rebuild dashboard layout structure (header/sidebar/content grid).
- [x] Implement data fetching and rendering for dashboard sections.
- [x] Add loading/error/empty states.

## UI/UX

- [ ] Ensure responsive layout across breakpoints.
- [ ] Validate accessibility roles/labels/focus handling.
- [ ] Confirm navigation links/buttons work.
- [x] Serve marketing home at `/` with clear CTAs; new guest routing aliases wired.
- [x] Introduced new guest routing aliases (restaurants/bookings/account/auth) with redirects to preserve legacy paths.

## Tests

- [ ] Unit or integration coverage for components/hooks as needed.
- [ ] Manual validation of key flows.

## Notes

- Assumptions: Parity with current dashboard is the goal unless new requirements emerge.
- Deviations: Added refreshed layout, bookings preview, and profile readiness progress while keeping existing data flows.
- Test run: `pnpm test:ops -- --runInBand -t dashboard` currently failing in unrelated server capacity/guard detection suites (pre-existing).
- Routing updates: Added new guest routes (`/restaurants`, `/bookings`, `/account/profile`, `/auth/signin`, etc.) and redirect mappings for legacy URLs per sprint plan.

## Batched Questions

- Clarify any new dashboard requirements or metrics if they differ from current version.
