---
task: lint-email-worker-any
timestamp_utc: 2025-11-21T20:11:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Reproduce lint warnings for `scripts/queues/email-worker.ts` (from pre-commit failure output).

## Core

- [x] Replace suppression check `any` cast with a typed helper/guard.
- [x] Replace default-case `any` cast for job type logging with typed handling.

## Tests

- [x] Run `pnpm exec eslint scripts/queues/email-worker.ts --max-warnings=0`.

## Notes

- Assumptions: No functional changes needed; only typing improvements to satisfy lint.
- Deviations: None currently.

## Batched Questions

- None.
