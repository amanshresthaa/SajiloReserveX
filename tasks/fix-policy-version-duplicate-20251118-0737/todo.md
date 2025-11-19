---
task: fix-policy-version-duplicate
timestamp_utc: 2025-11-18T07:38:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Inspect `server/capacity/manual-session.ts` around `policyVersion` usage.

## Core

- [x] Consolidate `policyVersion` definition to eliminate duplicate declaration while preserving fallback logic.

## UI/UX

- Not applicable.

## Tests

- [x] Run `pnpm run build` to ensure compilation passes.

## Notes

- Assumptions: No other parts rely on duplicate declaration side effects.
- Deviations: None yet.

## Batched Questions

- None.
