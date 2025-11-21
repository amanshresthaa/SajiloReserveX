---
task: guest-account-bookings-404
timestamp_utc: 2025-11-21T18:21:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Core

- [x] Inspect guest account bookings route and canonical account page implementation.
- [x] Add or restore re-export/redirect to ensure `/guest/account/bookings` resolves.

## Tests

- [x] `pnpm run build`

## Notes

- Assumption: guest routes should mirror account routes per routing conventions.
