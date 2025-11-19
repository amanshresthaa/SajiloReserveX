---
task: remove-plan-page
timestamp_utc: 2025-11-19T22:29:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Remove bookings plan step page

## Requirements

- Functional:
  - Remove the ops walk-in booking page at `/bookings/new?step=plan` so it is no longer reachable/rendered.
  - Eliminate UI entry points that direct users to `/bookings/new` (nav, CTA buttons, customer shortcuts).
  - Update redirects/scripts/tests so nothing references the removed page.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Avoid broken navigation; ensure any legacy hits get a graceful fallback (redirect to `/bookings`).
  - Keep remaining surfaces accessible/responsive where UI containers are adjusted after button removal.

## Existing Patterns & Reuse

- Ops walk-in page lives at `src/app/app/(app)/bookings/new/page.tsx` and renders `OpsWalkInBookingClient`, which wraps `BookingFlowPage`/`BookingWizard` (step synced via `?step=plan|details|review|confirm`).
- Navigation/CTA entry points:
  - `OPS_NAV_SECTIONS` includes a "Walk-in booking" link to `/bookings/new`.
  - `OpsBookingsClient` header has a "New booking" button linking to `/bookings/new`.
  - `CustomersTable` customer cards include a prefilled `/bookings/new` link.
- Redirect: `next.config.js` currently maps `/reserve` → `/bookings/new`.
- Tests/tools referencing the page: `tests/ops/clients.test.tsx`, Playwright specs (`tests/e2e/ops/v5-smoke.spec.ts`, `tests/e2e/ops/walk-in-booking.spec.ts`), and `scripts/capture-route-screenshots.ts`.

## External Resources

- None beyond in-repo references above.

## Constraints & Risks

- Removing the page cuts off the walk-in creation flow; ensure remaining UI doesn’t link to a 404.
- Redirect target for legacy `/reserve` hits must point to a valid page.
- Tests/tooling will fail if references aren’t cleaned up alongside the removal.

## Open Questions (owner, due)

- Are ops users expected to create bookings elsewhere after removal? Assumption: removal is intentional and no replacement path is required.

## Recommended Direction (with rationale)

- Remove the `/bookings/new` ops route and the `OpsWalkInBookingClient` component entirely.
- Strip navigation/CTA links to this page and retarget `/reserve` redirect to `/bookings` as a safe fallback.
- Update associated tests (unit + Playwright) and screenshot script to avoid the removed route.
- Verify `/bookings` still loads and legacy `/bookings/new` hits redirect away instead of rendering the wizard.
