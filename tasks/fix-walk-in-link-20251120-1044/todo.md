---
task: fix-walk-in-link
timestamp_utc: 2025-11-20T10:44:49Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm existing walk-in route path and current link target.

## Core

- [x] Update “Log walk-in” button link to correct path.
- [x] Add proxy guard to avoid double-prefix (/app/app) rewrites on app subdomain.
- [ ] Add Walk-ins nav item in ops sidebar to navigate to walk-in flow.
- [ ] Ensure back-navigation still returns to bookings context.

## UI/UX

- [ ] Verify navigation renders walk-in wizard without 404.

## Tests

- [ ] Manual check in browser/DevTools.

## Notes

- Assumptions: route nesting requires `/app/app/walk-in`.
- Deviations: none yet.

## Batched Questions

- None.
