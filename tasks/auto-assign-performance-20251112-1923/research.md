---
task: auto-assign-performance
timestamp_utc: 2025-11-12T19:23:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: [planner_observability]
related_tickets: []
---

# Research: Auto-Assign Performance and Instrumentation

## Requirements

- **Functional**:
  - Emit a timing event for every `quoteTablesForBooking` call from both the background job (`autoAssignAndConfirmIfPossible`) and the inline flow (`src/app/api/bookings/route.ts`). The event must capture `planner_duration_ms`, success flag, reason, and strategy knobs such as `requireAdjacency` and `maxTables`, and include the trigger (creation/modification/ultra-fast, inline timeout, etc.).
  - Emit per-attempt and end-of-job summary events that include attempt counts, exit reason, and total duration to support querying retries and outcomes.
  - Document the current baseline (median/p95/p99 durations, retries-per-booking, retry delays) so sprint targets are anchored in reality.
- **Non-functional**:
  - Keep instrumentation lightweight and resilient: Observability writes should not slow down the hot job path and must preserve existing semantics (e.g., job still exits early when booking flips to confirmed).
  - Maintain Supabase remote-only policy (no local migrations/seeds).
  - Preserve accessibility/UX (no UI touched) and keep instrumentation logic testable (unit style). Record events through existing `recordObservabilityEvent` helper to stay consistent with other flows.

## Existing Patterns & Reuse

- `autoAssignAndConfirmIfPossible` already logs attempts via `logJob(...)` and fires `recordObservabilityEvent` for star/stop events but lacks per-call duration details. The inline API flow already records quote events (`inline_auto_assign.quote_result`, `.no_hold`, `.quote_error`) with duration and alternates; this can be reused for schema/fields and to align new job events.
- `recordObservabilityEvent` is the canonical helper writing structured events to `observability_events`; it is already used in both job and inline flows (e.g., success, failure, cutoff). Reuse this instead of adding a new telemetry channel.
- `quoteTablesForBooking` accepts `maxTables`/`requireAdjacency`, while the job/inline calls currently rely on defaults. We can capture the options passed by reading the `options` objects at each call site.
- Scripts such as `scripts/ops-auto-assign-ultra-fast-loop.ts` and the ultra-fast run reference `quoteTablesForBooking` with custom options; they will also need instrumentation if they remain part of the sprint scope (but we can focus on the main job/inline first and plan the scripts later).

## External Resources

- [docs/auto-assign-algorithms.json](docs/auto-assign-algorithms.json) — summarizes existing planner flow semantics (job vs inline vs scripts) and highlights why instrumentation is necessary; useful reference when reasoning about `quote.reason` values.
- Stress-test outputs (`stress-test-output-20251105-185137.log`) show the current auto-assign commands and failure messages; while they do not capture precise timing, they demonstrate that planner calls spike in load and the scripts are currently triggering `ERR_MODULE_NOT_FOUND` before instrumentation runs.
- AGENTS.md root policy emphasises documentation, conventional commits, and manual verification expectations, so the task folder must include required artifacts and we must mention verification steps.

## Constraints & Risks

- Instrumentation writes to the `observability_events` table on every planner call; under load, this could add pressure. Need to keep event payloads minimal and consider batching if we ever need to avoid throttling (not part of this sprint but worth noting in plan/verification).
- The auto-assign job already retries up to `maxRetries` (clamped to 11) with `recordObservabilityEvent` around success/failure. Adding per-call events must not change retry timing; we should sample event creation in non-blocking ways (e.g., no awaits outside of necessary ones) but `recordObservabilityEvent` is awaited now; ensure we keep consistent behavior.
- `quote.reason` values may be undefined or include new codes; instrumentation must safely default (`null` or `'NO_REASON'`) to avoid invalid JSON in `context`.
- Inline flow uses `CancellableAutoAssign` with `AbortController`; instrumentation should not interfere with the signal path nor extend the critical path beyond necessary logging.

## Open Questions (owner, due)

- Q: Should the background job skip the first attempt when inline already recorded a failure with a reason like `NO_CAPACITY`? (Answer: will address in Epic B; for A-phase we simply instrument the attempts.)
- Q: Do we need to include `maxTables`/`requireAdjacency` values for scripts as well? (Answer: we will capture whatever options we can at each call site we touch this sprint; script coverage can be added if time allows.)
- Q: Which field should capture whether an inline success already sent the confirmation email, so the job doesn’t resend? (Answer: plan to add a flag in `auto_assign_last_result` later in Epic B.)

## Recommended Direction (with rationale)

- Start by centralizing the instrumentation around each `quoteTablesForBooking` call: wrap the call, capture start/end timestamps, and emit `auto_assign.quote` events with duration, success, reason, and strategy detail. Reuse the existing `recordObservabilityEvent` helper to keep the telemetry pipeline consistent.
- Add attempt-level counters (`attempt_index`, `attemptsUsed`) and a final summary event (`auto_assign.summary`) to `autoAssignAndConfirmIfPossible` to track job-wide behaviour without querying logs.
- Mirror the same strategy telemetry for inline auto-assign so we can compare inline vs job behaviour and detect repeated work.
- Once instrumentation is in place, use existing logs and any available observability data to compute median/p95/p99 durations and attempt counts for the baseline doc; this sets the stage for measuring the sprint targets.
