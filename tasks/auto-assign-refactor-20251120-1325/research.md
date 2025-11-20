---
task: auto-assign-refactor
timestamp_utc: 2025-11-20T13:25:53Z
owner: github:@amankumarshrestha
reviewers: [github:@amankumarshrestha]
risk: medium
flags: []
related_tickets: []
---

# Research: Auto-assign algorithm simplification

## Requirements

- Functional: simplify the auto-assign algorithm while preserving current behavior and outputs; maintain booking assignment correctness and side effects.
- Non-functional (perf/a11y/security/privacy/i18n): improve runtime efficiency; avoid regressions to stability or observability; no PII logging; preserve existing telemetry and error handling behavior where feasible.

## Existing Patterns & Reuse

- Primary entry point: `server/jobs/auto-assign.ts` (`autoAssignAndConfirmIfPossible`) invoked by background job + inline fallback paths.
- Helper modules: `server/capacity/auto-assign-last-result.ts` (inline result parsing/skip rules), `server/capacity/planner-cache.ts`, `server/assignments` coordinator (pipeline v3 flag), legacy planner via `quoteTablesForBooking` / `atomicConfirmAndTransition`.
- Existing telemetry/logging: `recordObservabilityEvent`, `recordPlannerQuoteTelemetry`, structured logging via `logJob`.
- Feature flags controlling behavior: `isAutoAssignOnBookingEnabled`, retry policy v2 (`isAutoAssignRetryPolicyV2Enabled`), assignment pipeline v3 (`isAssignmentPipelineV3Enabled`), planner cache flag.

## External Resources

- [Spec/Doc](docs/auto-assign-baseline.md) — baseline metrics and expectations for auto-assign performance.

## Constraints & Risks

- Inline and background flows share the algorithm; simplifications must not break request/response contracts or drift from database constraints.
- Avoid changing public API shapes unless compatibility is assured.
- Ensure idempotency and concurrency protections remain intact.

## Findings (current state)

- The main job function (`autoAssignAndConfirmIfPossible`) is ~730 LOC with logging/telemetry, booking lookup, inline-result heuristics, retry strategy, planner cache, coordinator fallback, email sending, and summary emission all interleaved.
- Heavy branching: 17 `recordObservabilityEvent` calls and 29 `logJob` calls inside a single function; inline skip/hard-stop logic and planner cache handling are embedded in the loop.
- Side-effect orchestration (emails, confirmation, retries) sits alongside configuration logic (feature flags, strategy adjustments), making it hard to reason about and test.
- Attempt loop builds cache keys and telemetry on every iteration even for cached hard failures; summary context (`inlineSkipReasonCode`, `hardStopReason`) is kept in outer-scope mutable vars.
- Coordinator path (pipeline v3) is mixed into the same function, complicating control flow and recovery from schema/feature-flag conditions.

## Open Questions (owner, due)

- Which module hosts the main auto-assign algorithm entry point? (owner: self — due: before coding)
- What are the measurable bottlenecks (CPU/IO) in the current implementation? (owner: self — due: before plan)
- Which behaviors are guarded by feature flags and must be preserved? (owner: self — due: before code changes)

## Recommended Direction (with rationale)

- Extract the monolithic function into smaller, named steps (load booking, compute strategy/attempt limits, coordinator path, legacy attempt loop, email handling) to reduce cognitive load.
- Encapsulate inline-result heuristics (skip initial attempt, hard-stop adjustment) into pure helpers that can be unit-tested.
- Centralize telemetry/logging to avoid duplicated code and ensure consistent context, reducing branching noise.
- Preserve existing feature-flag gates and idempotency paths while simplifying control flow to minimize accidental regressions.
