---
task: auto-assign-eslint-warning
timestamp_utc: 2025-11-20T20:56:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Read root `AGENTS.md` and confirm applicable rules.
- [x] Create task folder with research and plan.

## Core

- [x] Remove unused `Database` type import from `server/jobs/auto-assign.ts`.

## Tests

- [x] Run `pnpm eslint server/jobs/auto-assign.ts` to ensure no warnings.

## Notes

- Assumptions: Lint-only change; no runtime logic adjustments required.
- Deviations: None currently.

## Batched Questions

- None.
