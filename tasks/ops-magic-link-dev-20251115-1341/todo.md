---
task: ops-magic-link-dev
timestamp_utc: 2025-11-15T13:41:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Scaffold `scripts/ensure-dev-port.ts` per plan.
- [x] Wire script into `predev`.

## Core

- [x] Script checks port availability and exits with descriptive errors.
- [x] Helpful guidance for resolving conflicts.

## UI/UX

- [x] CLI message is actionable and references Supabase magic-link dependency.

## Tests

- [x] Manual conflict test (document in verification).
- [x] Manual success test (document in verification).

## Notes

- Assumptions: Supabase only allows localhost:3000 callbacks.
- Deviations: None yet.

## Batched Questions

- N/A.
