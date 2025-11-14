---
task: evaluate-adjacency-build-fix
timestamp_utc: 2025-11-13T23:40:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Identify duplicated `evaluateAdjacency` declarations causing the build failure.

## Core

- [x] Remove the redundant local function in `server/capacity/selector.ts` to avoid redeclaration.
- [x] Ensure selector imports continue to use the shared helper and update any typings if necessary.

## UI/UX

- n/a.

## Tests

- [x] Run `pnpm run build` to verify compilation succeeds.

## Notes

- Assumptions: Shared helper already handles the cases previously covered locally.
- Deviations: None.

## Batched Questions

- None at this time.
