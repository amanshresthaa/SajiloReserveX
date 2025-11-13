---
task: auto-assign-performance
timestamp_utc: 2025-11-12T19:23:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: high
flags: [planner_observability]
related_tickets: []
---

# Implementation Plan: Auto-Assign Performance Instrumentation

## Objective

We will instrument every `quoteTablesForBooking` call in the inline and background auto-assign flows so we can measure per-attempt duration, outcome codes, and strategy knobs, then emit a job-level summary event that captures attempts, cutoff reasoning, and total duration. That visibility is the baseline we need before tuning retries and caching in later epics.

## Success Criteria

- [ ] `recordObservabilityEvent` receives a `auto_assign.quote` for every planner call, populated with `planner_duration_ms`, `planner_success`, `planner_reason`, `planner_strategy`, and `trigger` context.
- [ ] Inline and job flows both log their `auto_assign.quote` events plus the new job summary event (`auto_assign.summary` with result/attempts/duration).
- [ ] Baseline doc captures median/p95/p99 durations and retry counts from existing logs/metrics so the sprint has measurable targets.

## Architecture & Components

- **Background job (`server/jobs/auto-assign.ts`)**: wrap the planner call in a timing helper, emit `auto_assign.quote`, and build a job summary event after the loop exits, referencing attempt count + exit reason. Keep existing `logJob` console messages for runbooks.
- **Inline API path (`src/app/api/bookings/route.ts`)**: Reuse the inline attempt instrumentation but align field names/structure so dashboards can compare. Capture strategy info (if any options provided) and ensure the `quote_result` event remains consistent.
- **Observability pipeline (`server/observability.ts`)**: continue writing to `observability_events`; no schema change required.

## Data Flow & API Contracts

- **Events emitted**:
  - `auto_assign.quote`: { durationMs, success, reason, strategy: { requireAdjacency, maxTables }, trigger }
  - `auto_assign.summary`: { attemptsUsed, maxAttempts, result, totalDurationMs }
  - Inline `bookings.inline_auto_assign.quote_*` events already exist and will keep using `context` with duration/reason.
- **Trigger determination**: job uses `options.reason` defaulting to `creation`; inline is `creation` or `modification` depending on flow.

## UI/UX States

- Not applicable—this change is purely backend telemetry.

## Edge Cases

- Planner call throws before returning (e.g., `AbortError`): record event with duration and reason `quote.exception` before rethrowing.
- Booking status flips to `confirmed` mid-run: existing job early return still wins; ensure summary event happens once with `result: 'already_confirmed'`.
- Inline path may trigger job fallback; ensure instrumentation doesn’t prevent job scheduling.

## Testing Strategy

- Unit: mock `quoteTablesForBooking` to throw success/failure, assert `recordObservabilityEvent` is called with expected payloads from `autoAssignAndConfirmIfPossible`.
- Manual: run targeted scripts or dev server to trigger inline auto-assign and confirm new events appear in logs (observability table). Use `rg` or `psql` to sample `observability_events` rows if feasible.
- Metrics: verify baseline doc numbers (p95/p99 durations) by scanning existing logs and referencing instrumentation once new events exist (deferred until telemetry captured in Stage 2).

## Rollout

- Feature flag not yet introduced; instrumentation always runs in dev/prod. Monitor `observability_events` for row growth.
- No DB migrations needed.

## DB Change Plan (if applicable)

- N/A
