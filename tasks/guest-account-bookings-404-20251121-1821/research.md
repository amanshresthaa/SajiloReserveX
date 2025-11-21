---
task: guest-account-bookings-404
timestamp_utc: 2025-11-21T18:21:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Fix /guest/account/bookings 404

## Requirements

- Functional: Restore working route for `/guest/account/bookings` (and related /guest account aliases) so they render the intended bookings page instead of 404.
- Non-functional: Maintain canonical routing rules (guest aliases redirect/serve canonical /account/bookings), avoid breaking SEO redirects and existing navigation.

## Existing Patterns & Reuse

- Guest namespace uses `src/app/guest/(guest)/(account)/...` as aliases of account pages.
- Redirect logic for legacy guest paths is captured in `docs/routing-conventions.md` and middleware may already map some guest paths.

## External Resources

- Internal routing conventions doc (`docs/routing-conventions.md`) — source of truth for canonical vs legacy aliases.

## Constraints & Risks

- Incorrect routing could cause loops or mis-redirects.
- Must ensure metadata/dynamic settings stay consistent with canonical page.

## Open Questions (owner, due)

- None currently.

## Recommended Direction (with rationale)

- Reuse canonical account page implementation; either re-export page/default + metadata or add redirect from guest alias to canonical `/account/bookings` per conventions.
