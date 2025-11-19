---
task: remove-bookings-new-route
timestamp_utc: 2025-11-19T23:21:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Remove legacy bookings new route

## Objective

We will remove the deprecated `/bookings/new` route and all CTAs pointing to it to prevent users from visiting a dead or unsupported flow.

## Success Criteria

- [ ] `/bookings/new` route no longer reachable in the app.
- [ ] No UI CTAs or links target `/bookings/new`.
- [ ] No broken navigation introduced; build succeeds.

## Architecture & Components

- Identify route configuration (Next.js pages or app routes) and remove the page/component.
- Update navigation components or buttons that link to the route.

## Data Flow & API Contracts

- None affected.

## UI/UX States

- Ensure remaining navigation still provides valid destinations.

## Edge Cases

- Hidden/conditional CTAs pointing to `/bookings/new`.
- Programmatic navigations in hooks or effects.

## Testing Strategy

- Static analysis: `rg` to confirm no references to `/bookings/new` remain.
- Build or lint if time permits.

## Rollout

- No feature flag; direct removal once verified.

## DB Change Plan (if applicable)

- Not applicable.
