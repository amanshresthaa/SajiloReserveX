---
task: guest-wizard-nextjs-migration
timestamp_utc: 2025-11-16T23:21:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Confirm final URL structure and target segment in Next.js App Router.
- [ ] Decide on shared module location for `reserve/shared/*` and set up aliases/paths.
- [ ] Add feature flag `feat.guest.wizard.next` (or equivalent) for controlled rollout.

## Core

- [ ] Scaffold Next.js routes for wizard entry and reservation detail/history.
- [ ] Port wizard UI/state logic from `reserve/features/reservations/wizard/*` into client components.
- [ ] Wire data fetching to existing booking APIs; handle offline/timeouts.
- [ ] Implement reservation detail/history pages with error/not-found boundaries.

## UI/UX

- [ ] Ensure responsive layout; preserve wizard skeletons and progress UI.
- [ ] Loading/empty/error states; offline banner; thank-you/confirmation.
- [ ] A11y roles/labels/focus; keyboard-only flow validation.

## Tests

- [ ] Unit tests for migrated hooks/components.
- [ ] Integration tests for pages/routes.
- [ ] Playwright E2E for guest wizard and reservation detail.
- [ ] Axe/accessibility checks for key pages.

## Notes

- Assumptions: URL parity with Vite unless decided otherwise.
- Deviations: TBD as implementation progresses.

## Batched Questions

- Placement of wizard routes in Next.js tree?
- Flag name/rollout plan approval?
