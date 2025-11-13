---
task: auto-assign-optimization
timestamp_utc: 2025-11-12T20:08:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Research: Auto-assign Optimization

## Requirements

- Functional:
  - Instrument every `quoteTablesForBooking` invocation (inline flow, background job, stress tools) with duration, success flag, failure reason, and applied strategy knobs, reported via `recordObservabilityEvent` / `auto_assign.quote` telemetry.
  - Emit attempt-level and booking-level summary events from `autoAssignAndConfirmIfPossible` so we can reconstruct retries, exit paths, and total runtime for both inline and job auto-assign flows.
  - Persist inline planner outcomes so the background job can skip redundant attempts or adjust retry budgets when inline already proved no capacity; ensure no duplicate confirmation emails when inline already sent them.
  - Cap and tune retries/backoffs based on deterministic failure reasons and time-to-service cutoff windows; ensure job honors inline results, reduces hammering, and exits gracefully when hopeless.
  - Optimize `quoteTablesForBooking` internals (profiling hooks, pre-check pruning, caching) to cut CPU time and redundant recomputation while keeping booking success behavior unchanged.
  - Improve `CancellableAutoAssign` timeout propagation so inline timeouts are explicit, observable, and do not leave dangling planner work.
  - Add safety rails to ultra-fast ops scripts (sane defaults, shared optimizations) to protect Supabase and mirror production behavior.
- Non-functional:
  - Reduce average CPU time per planner call by ≥30% or reduce planner calls per booking by ≥50% (primary goal 1).
  - Inline auto-assign p95 ≤ 2s (or no worse than current but with fewer timeouts); background job p95 time-to-success/fatal reduced by ≥50% on busy services (primary goal 2).
  - Maintain success metrics: no increase in failed confirmations, no duplicate emails, no broken bookings (goal 3).
  - Preserve accessibility, security (no secrets in source), and logging conventions demanded by `/AGENTS.md`.
  - All telemetry must be consistent with existing observability schema and be queryable for dashboards/baseline reporting.

## Existing Patterns & Reuse

- `recordPlannerQuoteTelemetry` (server/capacity/planner-telemetry.ts) already shapes an `auto_assign.quote` event with `planner_duration_ms`, `planner_success`, `planner_reason`, and strategy metadata. Inline (`src/app/api/bookings/route.ts`) and job (`server/jobs/auto-assign.ts`) already use it; scripts do not.
- Inline flow persists `auto_assign_last_result` via `buildInlineLastResult` (server/capacity/auto-assign-last-result.ts), capturing duration, reason, strategy, email status, etc. Background job parses it (parseAutoAssignLastResult) and already reduces retries when inline failure looks hard via `isInlineHardFailure` and `isInlineResultRecent`.
- Job instrumentation exists: per-attempt telemetry (`auto_assign.attempt`, `.attempt_error`), success/failure events, and `auto_assign.summary` are recorded; `emitAutoAssignSummary` ensures single summary per booking.
- `CancellableAutoAssign` wraps inline flow with AbortController but deeper stack may not honor signal; instrumentation for timeouts currently limited to an `inline_auto_assign.timeout` event.
- Planner internals use high-resolution timers, diagnostics (plans.diagnostics, lookahead, hold conflicts) but they are not surfaced externally without DEBUG flags.
- Scripts (e.g., `scripts/ops-auto-assign-ultra-fast-loop.ts`) call `quoteTablesForBooking` directly without telemetry, caching, or inline-result persistence.

## External Resources

- `ALLOCATION_STRESS_TEST_README.md` and stress-test logs (e.g., `stress-test-output-20251105-185137.log`) document previous performance issues; use them to cross-validate new metrics.
- `CLEANUP_SUMMARY.md`, `DOCUMENTATION.md`, and `VISUAL_ARCHITECTURE.md` summarize Supabase schemas and routing flows—helpful for risk assessment.
- Supabase dashboard / log drains (outside repo) provide authoritative timing numbers; we will need to export relevant slices for baseline doc (A3).

## Constraints & Risks

- Telemetry overhead must stay minimal; wrapping `quoteTablesForBooking` everywhere cannot add noticeable latency or create log storms.
- Persisting inline results adds writes to the `bookings` table; must avoid race conditions or growth of JSON blobs.
- Retry reductions risk lowering success rate if misclassified; need robust reason taxonomy and fallback logic.
- Planner optimizations (pruning, caching) must not violate seating constraints or fairness; caching is limited to process memory—no cross-instance coherence guaranteed.
- Inline AbortSignal propagation requires all downstream async calls (Supabase queries, planner loops) to respect cancellation, which may be non-trivial.
- Ops scripts run outside Next.js runtime; instrumentation there must avoid assuming web env, and safe-mode defaults cannot block legitimate load tests.
- Need to maintain `tasks/<slug>-timestamp` artifact discipline per `/AGENTS.md`; missing artifacts will block CI/PR.

## Open Questions (owner, due)

- What existing dashboards or metrics backfill `planner_duration_ms`? Do we already ingest from `recordPlannerQuoteTelemetry`? (owner: @assistant, due: Phase A3).
- Are there additional planner callers (e.g., manual assignment tools) that need instrumentation to avoid blind spots? (owner: @assistant, due: before implementation sprawl).
- How do we classify `quote.reason` reliably? Need canonical list to treat as deterministic vs transient (owner: @assistant + capacity SMEs, due: before B2 changes).
- Should inline persistence live on `bookings.auto_assign_last_result` or a new side table to avoid payload bloat? (owner: @assistant with DB owner, due: Phase B1 design).
- What caching scope is acceptable for planner (per request, per worker, distributed)? (owner: @assistant + infra, due: before C3).

## Recommended Direction (with rationale)

- **Instrumentation first (Epics A & D1)**: Ensure `recordPlannerQuoteTelemetry` coverage for scripts and verify inline/job telemetry completeness. Extend summary events and inline timeout observability to eliminate blind spots.
- **Data persistence bridge (Epic B1/D2)**: Reuse `auto_assign_last_result` structure but version it if needed; background job should read inline metadata to skip hopeless first attempts, avoid duplicate emails, and adjust strategy (e.g., relax adjacency on timeout follow-ups).
- **Retry policy tuning (Epic B2)**: Introduce a reason taxonomy (deterministic vs transient) and map to maxAttempts/backoffs; combine with existing cutoff logic to bound attempts ≤3 for hard failures while preserving success rate via instrumentation.
- **Planner profiling (Epic C1)**: Add DEBUG-only counters and optionally telemetry events capturing combination counts, DB query totals, and pruning stats so we can empirically target pruning/caching.
- **Search-pruning (Epic C2)**: Implement cheap global capacity / zone-level checks before heavy combination enumeration; these should short-circuit impossible cases and feed reason codes for B2.
- **Caching (Epic C3)**: Start with per-process caches keyed by restaurant/date/time/party/strategy to reuse failure/success envelopes during batch jobs or scripts; ensure cache invalidation on writes is simple (e.g., TTL-based) to avoid staleness risk.
- **Ops script safeguards (Epic E)**: Add config gating and reuse of planner optimizations to keep stress tools reflective yet safe.
