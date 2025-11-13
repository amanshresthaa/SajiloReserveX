# Post-Optimization Metrics — Auto-Assign (Enable Retry Policy v2 + Planner Cache)

## Objective

After enabling `FEATURE_AUTO_ASSIGN_RETRY_POLICY_V2=true` and `PLANNER_CACHE_ENABLED=true` (plus `DEBUG_CAPACITY_PROFILING=true` in staging when needed), re-run the same dashboards to confirm the sprint goals:

- ≥30% reduction in p95 `planner_duration_ms`
- ≥50% reduction in planner invocations per booking (attempts)
- Inline p95 ≤ 2 s (or better timeout distribution) and background job time-to-success/failure halved.

## Rollout checklist

1. Toggle flags in staging, let telemetry warm up (≥24h) while monitoring `auto_assign.quote` error rates.
2. Verify cache hit events (`auto_assign.planner_cache_hit`) stay < 30% to avoid stale data domination.
3. Only after staging looks good, set flags in production change window (document in change log).

## Queries

Reuse the baseline SQL snippets, but add `context->>'cache_hit'` filters to measure cache efficiency:

```sql
select
  count(*) filter (where (context->>'cache_hit')::boolean is true) as cache_hits,
  count(*) filter (where (context->>'cache_hit')::boolean is not true) as cache_misses,
  round(100.0 * count(*) filter (where (context->>'cache_hit')::boolean is true) / greatest(count(*),1), 2) as cache_hit_pct
from observability_events
where event_type = 'auto_assign.goal_hit'
  and created_at >= now() - interval '7 days';
```

(Replace `auto_assign.goal_hit` with `auto_assign.planner_cache_hit` once events land.)

## Metrics to log

- Same duration/attempt stats as baseline (p50/p90/p95/p99, per-booking attempts).
- Cache hit%, split by `reasonCode` (e.g., `hard.no_capacity` vs `transient.hold_conflict`).
- Inline timeout ratio after new strategy adjustments.
- Job success rate (`auto_assign.succeeded` vs `auto_assign.failed/exhausted`).

## Template

```
| Metric | Baseline | Post-opt | Delta |
| --- | --- | --- | --- |
| Planner p95 (ms) | | | |
| Planner p99 (ms) | | | |
| Avg attempts / booking | | | |
| Attempt p95 | | | |
| Inline timeout % | | | |
| Background job P95 ms | | | |
| Cache hit % (hard reasons) | n/a | | |
```

Fill in numbers for staging and prod separately.

## Snapshot (2025-11-12 → 2025-11-13 UTC)

- **Query execution**: 2025-11-12 23:36 UTC via Supabase SQL (same remote `SUPABASE_DB_URL`).
- **Raw CSV**: `artifacts/post-optimization-metrics.csv` (generated from `observability-metrics.sql`).
- **Sample sizes**: 14 inline quote events, 13 inline timeout events, 15 job runs, 8 bookings with attempt telemetry, 21 attempt rows for reason mix, 0 planner quote rows, 0 job successes after retries.

| Metric                      | Baseline (2025-11-08 → 11-10)       | Post-opt window                               | Delta / comment                                                          |
| --------------------------- | ----------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| Planner p95 (ms)            | n/a (no `auto_assign.quote` events) | n/a                                           | Instrumentation still missing → cannot measure planner win yet.          |
| Planner p99 (ms)            | n/a                                 | n/a                                           | —                                                                        |
| Avg attempts / booking      | n/a (no attempt rows)               | **2.63** (8 bookings)                         | New telemetry present; average attempts still above target of ≤3.        |
| Attempt p95                 | n/a                                 | **8.2** attempts                              | Worst case still very high because some jobs looped 11 times.            |
| Inline timeout %            | **83.33 %** (n=6)                   | **100 %** (n=13)                              | +16.67 pp regression → every inline run in this window timed out.        |
| Inline duration p95         | **2,576,035 ms** (outlier-heavy)    | **207,984 ms**                                | -92 % tail after pruning, but inline still exceeds 2 s budget.           |
| Background job p95 duration | **25,383 ms** (3 successes)         | n/a (0 successes)                             | Regression: jobs never reached success, so no post metric.               |
| Job success rate            | **60 %** (3/5)                      | **0 %** (0/15)                                | All post-window jobs exhausted without confirmation (hold conflicts).    |
| Cache hit %                 | 0 %                                 | 0 %                                           | Cache flag not emitting; cache logic likely disabled.                    |
| Reason mix                  | n/a                                 | 100 % `transient.hold_conflict` (21 attempts) | Every attempt failed on hold conflicts while cache/retry logic disabled. |

### Observations

1. **Planner + cache telemetry still absent** – `auto_assign.quote` events never landed, so none of the target duration improvements or cache hit ratios can be proven yet.
2. **Retry policy gains are inconclusive** – attempt-level telemetry now exists, but the lack of job successes (0/15) indicates the cache/retry flags were still off or completely ineffective in this sample (all failures are `transient.hold_conflict`).
3. **Inline behaviour regressed** – despite significantly lower p95 durations (likely because the inline API now bails faster), the timeout rate jumped to 100 % and `inline_auto_assign.succeeded` never fired. This suggests the inline flow is aborting before sending success events.
4. **Data quality** – two days of baseline data vs. a single day post-change is too sparse for statistical confidence; nevertheless, the direction shows we are not yet meeting success/timeout targets.

### Follow-ups

- Confirm deployments actually enable `FEATURE_AUTO_ASSIGN_RETRY_POLICY_V2` and `PLANNER_CACHE_ENABLED` in staging before rerunning metrics; otherwise we are comparing “flag off” vs “flag still off”.
- Investigate why inline success events disappeared even while inline quote telemetry still claims “success” (similar inconsistency noted in the baseline).
- Prioritise getting `auto_assign.quote` writes working (and include cache hit context) so we can measure the <30 % planner-duration goal.
- Once telemetry gaps close, re-run both baseline and post snapshots with ≥7 days of volume and re-populate the table above for staging + production separately as required by this doc.

## Notes

- Keep profiler flag `DEBUG_CAPACITY_PROFILING=true` only while collecting diagnostics; disable afterwards to reduce telemetry size.
- If metrics regress, flip `FEATURE_AUTO_ASSIGN_RETRY_POLICY_V2=false` to revert instantly.
