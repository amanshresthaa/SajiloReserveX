---
task: assignment-pipeline-v3-rollout
timestamp_utc: 2025-11-13T09:32:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: [FEATURE_ASSIGNMENT_PIPELINE_V3]
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Verify existing feature flag schema + env loader already expose `FEATURE_ASSIGNMENT_PIPELINE_V3*`.

## Core

- [x] Add `assignment.coordinator.*` telemetry helper + emitters inside `server/assignments/assignment-coordinator.ts`.
- [x] Ensure telemetry is non-blocking (fire-and-forget) and include key metadata (trigger, attempt count, strategy, timings).
- [x] Add/adjust tests (or at least targeted unit test) covering telemetry payload generation.

## Documentation

- [x] Update `.env.example` with assignment pipeline flag guidance & comments for each env stage.
- [x] Create `docs/assignment-pipeline-rollout.md` (or similar) describing per-env toggle sequence, monitoring queries, and rollback steps.
- [x] Note legacy planner cleanup scope + follow-up plan.

## Verification

- [x] Run lint/tests touched by coordinator changes (targeted Vitest file; documented broader suite failures).
- [ ] Capture manual verification steps + observability query snippets in `verification.md`.
