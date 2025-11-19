---
task: remove-plan-page
timestamp_utc: 2025-11-19T22:29:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Remove bookings plan step page

## Objective

Remove the ops walk-in booking page (`/bookings/new?step=plan`) and its entry points so staff are no longer routed into the booking wizard from the ops console.

## Success Criteria

- [ ] Navigating to `/bookings/new` no longer renders the walk-in wizard and instead lands users on `/bookings` (or higher-level booking management).
- [ ] No navigation items or CTA buttons point to `/bookings/new`.
- [ ] Tests/tooling no longer reference the removed page.

## Architecture & Components

- Remove `src/app/app/(app)/bookings/new/page.tsx` and the `OpsWalkInBookingClient` component (not reused elsewhere).
- Update `OPS_NAV_SECTIONS`, `OpsBookingsClient` header CTAs, and `CustomersTable` actions to drop `/bookings/new` links.
- Adjust `next.config.js` redirect `/reserve` → `/bookings`.
- Clean up tests (`tests/ops/clients.test.tsx`, Playwright specs referencing the page) and screenshot route list.

## Data Flow & API Contracts

- No API contract changes. Booking list endpoints continue untouched; we are removing a UI entry point only.

## UI/UX States

- Ensure `OpsBookingsClient` header still layouts correctly after removing the primary "New booking" button.
- Legacy `/bookings/new` visits redirect to `/bookings` without flashing UI.

## Edge Cases

- Bookmarks or redirects hitting `/bookings/new` should land on `/bookings` without a loop.
- Customers table still renders cleanly without the action button.

## Testing Strategy

- Update/remove unit tests tied to `OpsWalkInBookingClient`.
- Adjust Playwright specs to stop targeting `/bookings/new`.
- If time, run `pnpm test:ops` (unit) to ensure clients compile; rely on lint/typecheck for safety if full suite is too heavy.

- No flags; change is a removal.
- Monitor for broken navigation; rollback by restoring route if necessary.

## DB Change Plan (if applicable)

- N/A (no DB changes).
