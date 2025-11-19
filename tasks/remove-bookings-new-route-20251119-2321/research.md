---
task: remove-bookings-new-route
timestamp_utc: 2025-11-19T23:21:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Remove legacy bookings new route

## Requirements

- Functional:
  - Remove availability of `http://app.localhost:3000/bookings/new` route and any calls-to-action that navigate to it.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Ensure no broken links remain; keep navigation consistent and accessible.

## Existing Patterns & Reuse

- Need to inspect routing configuration and any CTA components referencing the deprecated path.

## External Resources

- None yet.

## Constraints & Risks

- Risk of leaving orphaned navigation items causing 404s.
- Possible shared components linking to the route; must ensure replacements exist or removal does not regress UX.

## Open Questions (owner, due)

- What is the intended alternative destination after removing the route? (owner: repo maintainer, due: before merge)

## Recommended Direction (with rationale)

- Search for route definition and delete or redirect appropriately.
- Remove or update components/links pointing to `/bookings/new` to avoid dead navigation.
