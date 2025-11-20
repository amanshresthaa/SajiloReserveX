---
task: fix-walk-in-link
timestamp_utc: 2025-11-20T10:44:49Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Fix walk-in link routing

## Objective

Ensure the “Log walk-in” button navigates ops users to the working walk-in flow without a page-not-found error.

## Success Criteria

- [ ] Clicking “Log walk-in” from bookings table opens the walk-in wizard.
- [ ] Auth guard behavior unchanged (redirects to login if unauthenticated).
- [ ] No regression to other bookings controls.

## Architecture & Components

- `OpsBookingsClient` button `Link` target — update to correct route.
- Walk-in page already implemented at `src/app/app/(app)/walk-in/page.tsx`.

## Data Flow & API Contracts

- No API changes; navigation only.

## UI/UX States

- Ensure navigation preserves existing layout; no new UI states.

## Edge Cases

- User not logged in should still redirect to login.
- Bookings filters/query params should remain unaffected after navigation back.

## Testing Strategy

- Manual navigation from bookings page to walk-in; verify page renders and no 404.
- Basic lint or type check not required for route change but run if fast.

## Rollout

- Direct change; no feature flag needed.

## DB Change Plan (if applicable)

- Not applicable.
