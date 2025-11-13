---
task: auto-assign-optimization
timestamp_utc: 2025-11-12T20:08:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Plan: Auto-assign Optimization

## Objective

We will shrink auto-assign wall-clock time and cut redundant planner work by (1) instrumenting every `quoteTablesForBooking` call, (2) sharing inline planner outcomes with the job, (3) enforcing smarter retry/backoff policies, and (4) optimizing the planner itself (profiling, pruning, caching) so that we reduce CPU per planner call by ≥30% or halve calls per booking while keeping booking confirmation success flat.

## Success Criteria

- [ ] Every planner invocation (inline, job, stress scripts) emits `auto_assign.quote` with duration, success, reason, strategy, trigger, attempt.
- [ ] `auto_assign.summary` exists for every job execution with attempts, outcome, duration, inline context.
- [ ] Inline persistence enables the job to skip or shorten attempts after recent inline failures/timeouts; average attempts per job ≤3 without lowering success rate.
- [ ] Inline auto-assign p95 ≤ 2s (or unchanged but with fewer timeouts); background job p95 time-to-success/fatal reduced by ≥50% on congested services.
- [ ] Planner profiling shows combination counts / DB query counts and exposes obvious pruning wins; pruning/caching reduce `planner_duration_ms` p95 by ≥30% in stress runs.
- [ ] No increase in failed confirmations; no duplicate guest emails or double charge-like effects.

## Architecture & Components

- `recordPlannerQuoteTelemetry` (server/capacity/planner-telemetry.ts)
  - Extend to accept optional `planner_internal` payload (combination count, query counters) gated by DEBUG flag.
- Inline handler `src/app/api/bookings/route.ts`
  - Ensure `CancellableAutoAssign` propagates AbortSignal to planner + confirm flows; persist inline result via `buildInlineLastResult` and emit timeout event with context.
- Background job `server/jobs/auto-assign.ts`
  - Read inline result, classify failure reason (deterministic vs transient) via helper, adjust maxAttempts/delays accordingly, reuse inline telemetry.
  - Emit booking summary once per job; record reason-coded exit events (`summary.result`, `cutoff`, `already_confirmed`).
- Planner core `server/capacity/table-assignment/quote.ts`
  - Add profiling instrumentation toggled by `DEBUG_CAPACITY_PROFILING` env / strategy flag; produce counts for combos, DB reads, pruning steps.
  - Introduce global capacity, zone filter, and max table pre-checks to bail early; capture `reason` codes accordingly.
  - Optional per-process cache keyed by `restaurantId:date:start:party:strategyHash` storing failure summary or last successful candidate metadata.
- Scripts `scripts/ops-auto-assign-ultra-fast-loop.ts` and related stress tools
  - Wrap planner invocations with telemetry + caching helpers; add safe-mode defaults and warnings when overriding.
- Observability `recordObservabilityEvent`
  - Provide dashboards/queries (Phase A3) summarizing durations, attempts, reason codes.

## Data Flow & API Contracts

Endpoint/entry points:

- Inline booking POST (`src/app/api/bookings/route.ts`)
  - Request: booking payload (existing)
  - Response: unchanged, but instrumentation writes to `auto_assign_last_result` JSON column.
- Job (`autoAssignAndConfirmIfPossible`)
  - Input: `bookingId`, optional `reason`/`emailVariant`
  - Side-effects: Supabase queries, `recordObservabilityEvent` events, `auto_assign_last_result` updates when inline succeeded.
- Planner cache API (new helper)
  - `getPlannerCacheKey(booking, strategy)` -> string
  - `peekPlannerCache(key)` -> { type: "failure" | "success"; context }
  - `putPlannerCache(key, payload)` -> void (TTL-based, e.g., 5 min)

Contract adjustments:

- `recordPlannerQuoteTelemetry` now optionally accepts `internalStats?: PlannerInternalStats` to inline more context when profiling enabled.
- `recordObservabilityEvent` contexts gain canonical reason codes (`planner_reason_code`) for easier classification.

## UI/UX States

No direct UI, but internal dashboards will present states:

- Planner duration distributions segmented by success/failure, adjacency, strategy.
- Job attempt waterfall (attempt_count histogram, summary outcomes, inline skip reasons).
- Timeout vs success charts for inline flow to ensure user experience remains stable.

## Edge Cases

- Inline attempt stores stale result or fails to persist due to Supabase error → job must treat missing `auto_assign_last_result` as no-op and log warning.
- Booking confirmed between inline and job → job should detect status change (already implemented) and still emit summary event with `result: already_confirmed`.
- Cached failure reused after capacity improves (party cancellation) → cache TTL + startAt-based invalidation ensures we re-evaluate after short interval.
- Planner abort mid-flight due to timeout signal → ensure we catch AbortError, emit telemetry, and classify as transient to allow job fallback.

## Testing Strategy

- Unit
  - `recordPlannerQuoteTelemetry` emits event with strategy + failure reasons; new optional stats serialized correctly.
  - `autoAssignAndConfirmIfPossible` reduces attempts when inline hard failure vs transient reason; emits summary with proper `result`.
  - Cache helper returns cached failure and bypasses planner invocation when `NO_CAPACITY` reason stored.
- Integration
  - Inline POST booking path: simulate `quoteTablesForBooking` success/failure/timeouts to ensure inline persistence, timeout events, and job scheduling interplay.
  - Planner profiling toggled via env flag surfaces internal stats without altering final response.
- Script / e2e
  - `runUltraFastAssignment` safe-mode defaults verified via CLI invocation (dry run) to ensure concurrency caps.
  - Stress test environment (pre-prod) measuring `planner_duration_ms` before/after pruning/caching to validate ≥30% improvement.
- Observability validation
  - Query event store to ensure every planner call yields `auto_assign.quote`; attempt histograms match job logs; summary events exist for each job.

## Rollout

1. Phase A (Days 1–3): land instrumentation changes, summary events, inline persistence adjustments. Release behind logging flags if needed.
2. Phase B (Days 3–7): deploy retry tuning + inline/job sharing. Use feature flag (`feat.auto_assign.retry_policy_v2`) for quick disable.
3. Phase C (Days 5–10): ship planner profiling/pruning/caching behind env toggles (`DEBUG_CAPACITY_PROFILING`, `PLANNER_CACHE_ENABLED`). Test in staging + targeted restaurants before turning on globally.
4. Phase D/E (Days 8–10): tighten inline timeout handling and script safe modes, reusing Phase B outputs.
5. Monitor dashboards/logs daily; if regressions observed, disable new flags and fall back to prior behavior.

### FEATURE_AUTO_ASSIGN_RETRY_POLICY_V2 + PLANNER_CACHE_ENABLED rollout (Nov 2025)

| Stage                      | Target                                  | Actions                                                                                                                                                                                         | Monitoring & gates                                                                                                                                                                                                        | Rollback                                                                                                        |
| -------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 0 — Telemetry readiness    | Staging                                 | Ensure `auto_assign.quote` + `auto_assign.summary` events exist for ≥24 h. Run `observability-metrics.sql` (baseline window) and store CSV to confirm non-zero planner + attempt data.          | `planner_duration_p95` populated; `job_attempts_sample_size ≥ 20`. If not, halt rollout and land instrumentation fixes first.                                                                                             | n/a                                                                                                             |
| 1 — Staging soak           | Staging                                 | Flip `FEATURE_AUTO_ASSIGN_RETRY_POLICY_V2=true`, wait 2 h, then `PLANNER_CACHE_ENABLED=true`. Capture metrics daily (7-day rolling) and compare against current baseline (LCP/perf unaffected). | Guardrails: `inline_timeout_pct ≤ 85 %`, `job_success_rate ≥ 55 %`, `avg_attempts ≤ 3`. If cache hits stay 0, debug cache key + persistence before proceeding.                                                            | Toggle both flags off (env var or Supabase config) and purge in-process cache.                                  |
| 2 — Limited production     | 2 pilot restaurants (auto-assign heavy) | Enable `retry_policy_v2` for pilot env group only; cache flag stays false for 24 h to isolate retry gains. After confirming attempts drop, enable cache for same restaurants.                   | Monitor `reason_share_pct` for spike in `hard.*`, ensure `job_failed_count` does not exceed baseline (≤ 2 per day). Inline timeout % must not exceed baseline +10pp.                                                      | Flip flags off per restaurant via dynamic config; flush planner cache store.                                    |
| 3 — Progressive ramp       | 25 % → 50 % → 100 % of restaurants      | Expand retry flag first, then cache once cache-hit ratio shows >5 % (ensures cache warm). Keep change window ≤1 h with live observability dashboards in view.                                   | Success criteria: `avg_attempts ≤ 2.5`, `job_success_rate ≥ 65 %`, `planner_cache_hit_pct ≥ 10 % of failures`, inline timeout trend flat/down. Rollback if any KPI breaches for >30 min or if inline/logging alert fires. | Disable flags globally (same release), invalidate cache map, redeploy without cache shim if needed.             |
| 4 — Post-ramp verification | All envs                                | Re-run `baseline-metrics.csv` / `post-optimization-metrics.csv` automation for prod data, attach to `artifacts/`. Update `verification.md` with production metrics + QA evidence.               | All sprint success metrics (≥30 % planner p95 reduction, ≥50 % drop in planner invocations per booking) must be proven vs. new baseline.                                                                                  | If goals not met, consider leaving retry on but cache off, and open follow-up task for deeper caching strategy. |

**Monitoring playbook**

- `tasks/auto-assign-optimization-20251112-2007/artifacts/observability-metrics.sql` (via `psql --csv`) every morning for staging + prod to watch attempts, inline timeout %, cache-hit ratio.
- Alert thresholds (PagerDuty/Sentry): `auto_assign.failed` per hour > baseline +50 %, `inline_auto_assign.timeout` > baseline +20 %, `auto_assign.planner_cache_hit` missing for >2 h.
- Add Grafana panels for `planner_duration_ms` (once events land) + `reason_share_pct` (expect shift away from `transient.hold_conflict` as cache prevents retries).

**Revert path**

- Immediate toggle: set both flags false in env config (`env.featureFlags.planner.cacheEnabled`, `env.featureFlags.autoAssign.retryPolicyV2`), redeploy API, and drop in-memory cache map.
- Data cleanup: purge `auto_assign_last_result` entries older than 24 h to avoid stale guidance when retry policy off.
- Document incident + attach latest CSVs to `verification.md`.

## DB Change Plan

No schema migrations required; we continue using `bookings.auto_assign_last_result` JSONB. If JSON size becomes an issue, revisit with Supabase team outside this sprint.
