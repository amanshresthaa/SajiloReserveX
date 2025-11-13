---
task: assignment-pipeline-v3-rollout
timestamp_utc: 2025-11-13T09:32:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: [FEATURE_ASSIGNMENT_PIPELINE_V3]
related_tickets: []
---

# Implementation Plan: Assignment Pipeline V3 Rollout

## Objective

Provide a safe, observable pathway to graduate the Assignment Pipeline V3 coordinator from documentation-only status to a fully enabled feature, with clear per-environment flag settings, telemetry, and a cleanup path for the legacy planner loop.

## Success Criteria

- [ ] `AssignmentCoordinator` emits structured `assignment.coordinator.*` observability events at key lifecycle points (lock acquisition, attempts, success/error/manual review, retries, no-ops).
- [ ] `.env.example` (and related docs) explain how to toggle `FEATURE_ASSIGNMENT_PIPELINE_V3` / `_SHADOW` / `_MAX_PARALLEL` per environment.
- [ ] A rollout runbook exists under `docs/` detailing the env toggle order (shadow → full), monitoring queries, and rollback steps.
- [ ] Legacy planner cleanup scope is enumerated (files/functions) so the follow-up removal task is actionable once metrics validate.

## Architecture & Components

- `server/assignments/assignment-coordinator.ts`: add an internal telemetry helper that wraps `recordObservabilityEvent` with a consistent `source: "assignment.coordinator"` payload. Emit events for: lock acquisition result, state machine readiness, assignment attempt outcomes, circuit breaker/rate limiter triggers, retries/manual reviews/no-ops. Ensure payloads stay JSON-serializable and avoid awaiting telemetry in hot loops.
- `server/jobs/auto-assign.ts`: no behavioural change yet, but reference doc should mention that once `_V3` is true the job short-circuits into the coordinator.
- `config/env.schema.ts` + `lib/env.ts`: already parse the flags; we only need doc updates, not schema changes.
- Docs: create `docs/assignment-pipeline-rollout.md` summarizing env values, observability queries (e.g., SQL against `observability_events` filtering `source in ('assignment.state_machine','assignment.coordinator')`), and success metrics per env.

## Data Flow & API Contracts

- Telemetry payload example:
  ```json
  {
    "source": "assignment.coordinator",
    "eventType": "coordinator.confirmed",
    "bookingId": "uuid",
    "restaurantId": "uuid",
    "context": {
      "strategy": "optimal_fit",
      "attempts": 3,
      "duration_ms": 842,
      "trigger": "creation"
    }
  }
  ```
- Rollout doc will define env flag matrix:
  | Env | FEATURE_ASSIGNMENT_PIPELINE_V3 | FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW |
  | --- | --- | --- |
  | Dev local | `false` | `false` |
  | Staging (phase 1) | `false` | `true` |
  | Staging (phase 2) | `true` | `false` |
  | Prod (phase 1) | `false` | `true` |
  | Prod (phase 2) | `true` | `false` |

## UI/UX States

- No UI changes; ops dashboards are out-of-band.

## Edge Cases

- Telemetry must tolerate `booking` or `restaurant_id` missing; ensure we guard `context` size to avoid Supabase row limits.
- Coordinator may exit early (`noop`, `retry`, `manual_review`); events should still fire once per invocation to support rate calculations.
- Documentation must note that "shadow" currently implies instrumentation-only (no dry-run path yet) so toggling `_SHADOW` without `_V3` has no runtime impact until future enhancement.

## Testing Strategy

- Unit-level: add focused tests for the new telemetry helper (e.g., ensuring payload shape) using Vitest + mocks around `recordObservabilityEvent`.
- Manual: run `pnpm test server/assignments` (or targeted file) if available; otherwise rely on lint + typecheck.
- Verification doc: include SQL snippet for counting `assignment.coordinator` events and a dry-run of `pnpm lint && pnpm test assignment-coordinator` commands (if fast) prior to submission.

## Rollout

- Documented flag order + verification queries. No automatic code change flips the flags; ops/devs will set env vars per env following the new runbook.
- Observability: instruct ops to query `observability_events` for `source in ('assignment.state_machine','assignment.coordinator')` grouped by `event_type` / `severity`.
- Kill-switch remains `FEATURE_ASSIGNMENT_PIPELINE_V3=false` (plus legacy code still present until cleanup task executes).

## DB Change Plan

- None (schema already migrated previously). Emphasize remote-only migrations if future changes arise.
