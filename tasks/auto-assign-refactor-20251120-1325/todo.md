---
task: auto-assign-refactor
timestamp_utc: 2025-11-20T13:25:53Z
owner: github:@amankumarshrestha
reviewers: [github:@amankumarshrestha]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm scope and entry points for auto-assign algorithm.
- [x] Identify existing tests covering auto-assign.

## Core

- [x] Map current algorithm flow and bottlenecks.
- [x] Simplify logic and refactor for readability/perf.
- [x] Ensure idempotency and concurrency safeguards remain.

## UI/UX

- N/A (backend service).

## Tests

- [x] Add/adjust unit/integration tests if needed.
- [x] Run relevant test suites (see verification.md).

## Notes

- Assumptions: No functional change intended to email sending/observability; coordinator path kept intact.
- Deviations: Skipping first job attempt remains gated to retry policy v2 as in legacy logic.

## Batched Questions

- None yet.
