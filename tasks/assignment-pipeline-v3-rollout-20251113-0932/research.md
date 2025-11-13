---
task: assignment-pipeline-v3-rollout
timestamp_utc: 2025-11-13T09:32:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: [FEATURE_ASSIGNMENT_PIPELINE_V3]
related_tickets: []
---

# Research: Assignment Pipeline V3 Rollout

## Requirements

- **Functional**
  - Provide a per-environment rollout plan for `FEATURE_ASSIGNMENT_PIPELINE_V3`, starting in shadow mode before routing bookings through the new coordinator and state machine.
  - Surface `assignment.state_machine` and coordinator observability signals so ops can monitor success/error rates while the flag is in shadow and when fully enabled.
  - Document exact env var settings and flag transitions for dev → staging → production, including verification steps and rollback guidance.
  - Prepare for the final cleanup step (removing the legacy planner loop once pipeline metrics look good) by identifying dependent modules and risks.
- **Non-functional**
  - Maintain Supabase remote-only policy for state machine tables (`booking_assignment_state_history`, etc.).
  - Keep auto-assign latency acceptable; instrumentation must not introduce blocking I/O on the hot path.
  - Follow AGENTS.md SDLC (task artifacts, plan, verification evidence) and conventional commits.

## Existing Patterns & Reuse

- `server/jobs/auto-assign.ts` gates the new coordinator via `isAssignmentPipelineV3Enabled()` and bails out to the legacy planner otherwise (`server/jobs/auto-assign.ts:232-320`). This needs doc/backlog coverage for the removal step.
- `server/assignments/state-machine.ts` already emits `recordObservabilityEvent` entries with `source: "assignment.state_machine"` whenever transitions persist.
- `AssignmentCoordinator` (`server/assignments/assignment-coordinator.ts`) already orchestrates locks, rate limiting, circuit breaker, and emits `recordObservabilityEvent` import (unused today) we can leverage for `assignment.coordinator.*` signals.
- Env parsing is centralized in `lib/env.ts:205-225` with schema defined in `config/env.schema.ts:70-90`; `.env.example` is the canonical place to document defaults.
- Observability runbooks such as `PRODUCTION_DEPLOYMENT_RUNBOOK.md` and monitoring dashboards under `config/observability/` establish the precedent for per-feature rollout docs.

## External Resources

- `tasks/table-assignment-overhaul-20251113-0846/plan.md` — describes intended architecture & rollout expectations for the pipeline.
- `DEPLOYMENT_SUMMARY.md` — shows how previous capacity features documented env vars + monitoring.

## Constraints & Risks

- Legacy planner loop still owns booking confirmations; premature removal without hard data risks regressions.
- Running the coordinator in “shadow” concurrently with the legacy loop would currently mutate bookings (state transitions + holds). Until we design a dry-run path, shadow mode must remain a documentation/flagging exercise.
- Missing `assignment.coordinator` observability today will block the "watch new events" ask; we need instrumentation without significantly slowing jobs.
- Env values differ per environment; storing sensitive env files in git is prohibited, so we must document values/runbooks rather than commit actual secrets.

## Open Questions (owner, due)

- Can we expose a dry-run path for the coordinator to make `FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW` meaningful beyond documentation? (Owner: eng, due: before prod flip.)
- Which dashboard/alerts should watch `assignment.state_machine` + coordinator events? (Owner: ops, due: before staging rollout.)

## Recommended Direction (with rationale)

1. Instrument `AssignmentCoordinator` to emit structured `assignment.coordinator` events (lock acquisition, attempt outcomes, errors). This satisfies the "watch new ... events" requirement once the flag flips.
2. Update `.env.example` (and deployment docs) to spell out the per-environment switch sequence: set `_SHADOW=true` while `_V3=false`, monitor, then invert values before removing the legacy planner loop.
3. Add a dedicated rollout runbook (`docs/assignment-pipeline-rollout.md`) that enumerates the per-env steps, observability queries, and rollback instructions.
4. Document the legacy planner removal plan (files/functions) so the final cleanup is low risk once metrics are green.
