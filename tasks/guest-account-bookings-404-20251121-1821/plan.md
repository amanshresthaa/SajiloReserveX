---
task: guest-account-bookings-404
timestamp_utc: 2025-11-21T18:21:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Fix /guest/account/bookings 404

## Objective

Ensure `/guest/account/bookings` (and related guest account aliases) resolve to the correct bookings page, consistent with canonical `/account/bookings`.

## Success Criteria

- [ ] Navigating to `/guest/account/bookings` serves the bookings page (or redirects to `/account/bookings`) without 404.
- [ ] Canonical `/account/bookings` behavior unchanged.
- [ ] Build continues to pass.

## Architecture & Components

- Guest wrapper route: `src/app/guest/(guest)/(account)/bookings/page.tsx` (and possibly MyBookingsClient).
- Canonical component: `src/app/account/bookings/page.tsx` or `MyBookingsClient`.
- Middleware/redirects if needed.

## UI/UX States

- Should match existing account bookings UI; no new UI states.

## Edge Cases

- Avoid redirect loops between guest and canonical routes.
- Preserve metadata/robots directives.

## Testing Strategy

- Build: `pnpm run build`.
- Local manual hit of `/guest/account/bookings` (if possible) or static analysis to ensure route exists.

## Rollout

- No flags; safe once verified.
