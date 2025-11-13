# Baseline Metrics — Auto-Assign (Pull Before Enabling Retry Policy v2)

## Objective

Establish current planner cost/latency and retry behavior using the new `auto_assign.quote` and `auto_assign.summary` events before enabling the caching + retry-policy-v2 flags in production. These numbers become the “before” snapshot for sprint goals (≥30% reduction in p95 planner duration, ≥50% drop in planner calls per booking, faster inline/job P95).

## Data sources

1. `observability_events` table — stores `auto_assign.quote`, `auto_assign.summary`, `inline_auto_assign.*`, etc.
2. Stress-test logs under `stress-test-output-*` for cross-checking script behavior.
3. Existing ops telemetry (Cloud Logging dashboards) for sanity.

## Queries (Supabase SQL console)

```sql
-- Per-call planner duration distribution (last 7 days)
select
  percentile_cont(0.5) within group (order by (context->>'planner_duration_ms')::numeric) as p50_ms,
  percentile_cont(0.9) within group (order by (context->>'planner_duration_ms')::numeric) as p90_ms,
  percentile_cont(0.95) within group (order by (context->>'planner_duration_ms')::numeric) as p95_ms,
  percentile_cont(0.99) within group (order by (context->>'planner_duration_ms')::numeric) as p99_ms
from observability_events
where event_type = 'auto_assign.quote'
  and created_at >= now() - interval '7 days';
```

```sql
-- Attempts per booking (job)
select
  percentile_cont(0.5) within group (order by (context->>'attemptsUsed')::numeric) as attempts_p50,
  percentile_cont(0.9) within group (order by (context->>'attemptsUsed')::numeric) as attempts_p90,
  percentile_cont(0.95) within group (order by (context->>'attemptsUsed')::numeric) as attempts_p95,
  avg((context->>'attemptsUsed')::numeric) as attempts_avg
from observability_events
where event_type = 'auto_assign.summary'
  and created_at >= now() - interval '7 days';
```

```sql
-- Inline timeout rate and duration
select
  count(*) filter (where event_type = 'inline_auto_assign.timeout') as inline_timeouts,
  count(*) filter (where event_type = 'inline_auto_assign.succeeded') as inline_success,
  round(100.0 * count(*) filter (where event_type = 'inline_auto_assign.timeout') / greatest(count(*) filter (where event_type in ('inline_auto_assign.timeout','inline_auto_assign.succeeded')),1), 2) as inline_timeout_pct,
  percentile_cont(0.95) within group (order by (context->>'durationMs')::numeric) as inline_duration_p95
from observability_events
where event_type in ('inline_auto_assign.timeout','inline_auto_assign.succeeded')
  and created_at >= now() - interval '7 days';
```

## Metrics to capture

- Median / p90 / p95 / p99 planner duration (ms)
- Avg / p90 / p95 attempts per job booking (`attemptsUsed` from summary)
- Inline timeout percentage and p95 duration
- Distribution of `planner_reason_code` (success vs `hard.*` vs `transient.*`)
- Inline email duplication incidents (should be zero after job email skip logic)

Record the query results here (copy/paste table output). Leave timestamps + environment noted.

## Snapshot (2025-11-08 → 2025-11-10 UTC)

- **Query execution**: 2025-11-12 23:28 UTC via Supabase SQL editor (remote `SUPABASE_DB_URL` service project).
- **Raw CSV**: `artifacts/baseline-metrics.csv` (generated from `observability-metrics.sql`).
- **Sample sizes**: 7 inline quote events, 6 inline timeout/success events, 5 job runs (`auto_assign.started`), 3 job successes, 0 `auto_assign.quote` rows, 0 `auto_assign.summary` rows.

| Metric                  | Value                    | Sample                                 | Notes                                                                                                                                                                                 |
| ----------------------- | ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inline duration p95     | 2,576,035 ms (~42.9 min) | 7 inline attempts                      | Extreme tail driven by two requests stuck until timeout; median only 8,839 ms.                                                                                                        |
| Inline timeout %        | 83.33 %                  | 6 inline outcome events                | 5/6 inline attempts ended in timeout despite inline telemetry claiming 100 % success; demonstrates instrumentation mismatch between `inline_auto_assign.quote_result` and `.timeout`. |
| Job success rate        | 60 %                     | 5 job runs                             | 3 succeeded, 2 failed; successes completed in 16–26 s (p95 ≈ 25 s).                                                                                                                   |
| Job attempts            | _Not available_          | 0 `auto_assign.attempt` rows in window | `auto_assign.summary` & per-attempt counters are not landing in this environment yet.                                                                                                 |
| Planner duration stats  | _Not available_          | 0 `auto_assign.quote` rows             | Need to confirm why `recordPlannerQuoteTelemetry` is not persisting.                                                                                                                  |
| Cache hit %             | 0 %                      | 0 `cache_hit=true` rows                | Planner cache instrumentation not emitting yet.                                                                                                                                       |
| Reason mix              | _Not available_          | 0 attempt rows                         | Cannot classify hard vs transient reasons without attempt-level telemetry.                                                                                                            |
| Inline email duplicates | 0                        | 0                                      | No duplicate-email guard events observed; continue monitoring once volume increases.                                                                                                  |

### Observations

1. **Instrumentation gap**: neither `auto_assign.quote` nor `auto_assign.summary` exists in the Supabase dataset, so planner percentiles and attempts-per-booking must be inferred later.
2. **Inline telemetry inconsistency**: inline timeout events fire (5/6), yet all seven `inline_auto_assign.quote_result` rows claim `hasHold=true`. Need to audit how we derive `hasHold` vs timeout flows.
3. **Job performance**: even without retry-policy v2, successful jobs confirm within ~19 s on average; the two failures exhausted attempts before success, but we cannot attribute causes without reason codes.
4. **Data sparsity**: only five bookings hit the auto-assign job during this window, so numbers serve only as a directional "before" snapshot.

### Action items

- Ensure deployments actually write `auto_assign.quote` / `auto_assign.summary` events; without them we cannot prove planner savings.
- Add validation to keep inline `hasHold` in sync with timeout emitters so success/timeout ratios reconcile.
- Keep gathering data as volume grows; rerun this baseline once telemetry gaps close for a statistically meaningful cut.

## Notes / caveats

- Ensure feature flags `FEATURE_AUTO_ASSIGN_RETRY_POLICY_V2=false` and `PLANNER_CACHE_ENABLED=false` for baseline.
- Exclude stress-test scripts by filtering `context->>'source'` if they pollute metrics (look at `auto_assign.ops_loop`).
- Capture the Supabase SQL export (CSV) and drop it into `artifacts/` if possible (`artifacts/baseline-metrics.csv`).
