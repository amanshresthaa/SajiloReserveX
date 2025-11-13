-- Auto-Assign Performance Post-Optimization Metrics
-- Query observability_events for auto_assign telemetry AFTER enabling optimizations
--
-- Purpose: Measure performance improvements from:
-- - FEATURE_AUTO_ASSIGN_RETRY_POLICY_V2 (smarter retry delays/cutoffs)
-- - PLANNER_CACHE_ENABLED (reduce redundant planner calls)
--
-- Prerequisites:
-- - Feature flags enabled in staging/production
-- - Sufficient soak time (≥7 days recommended) at stable rollout %
-- - Baseline metrics captured from baseline-query.sql for comparison
--
-- Usage:
--   psql $SUPABASE_DB_URL -f post-optimization-query.sql > post-optimization-results.txt
--   -- Then diff against baseline-results.txt

-- ============================================================================
-- 1. Auto-Assign Job Summary Metrics (Post-Optimization)
-- ============================================================================

WITH summary_events AS (
  SELECT
    id,
    created_at,
    restaurant_id,
    booking_id,
    (context->>'result')::text AS result,
    (context->>'attemptsUsed')::int AS attempts_used,
    (context->>'maxAttempts')::int AS max_attempts,
    (context->>'totalDurationMs')::numeric AS total_duration_ms,
    (context->>'trigger')::text AS trigger,
    (context->>'skippedInitialAttempt')::boolean AS skipped_initial,
    (context->>'inlineSkipReason')::text AS inline_skip_reason,
    (context->>'hardStopReason')::text AS hard_stop_reason
  FROM observability_events
  WHERE event_type = 'auto_assign.summary'
    AND created_at >= NOW() - INTERVAL '7 days'  -- Match baseline window
)
SELECT
  result,
  COUNT(*) AS job_count,
  ROUND(AVG(attempts_used), 2) AS avg_attempts,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY attempts_used) AS median_attempts,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY attempts_used) AS p95_attempts,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY attempts_used) AS p99_attempts,
  MAX(attempts_used) AS max_attempts_observed,
  ROUND(AVG(total_duration_ms), 0) AS avg_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_duration_ms) AS median_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_duration_ms) AS p95_duration_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total_duration_ms) AS p99_duration_ms,
  MAX(total_duration_ms) AS max_duration_ms,
  COUNT(*) FILTER (WHERE skipped_initial) AS skipped_initial_count,
  COUNT(*) FILTER (WHERE hard_stop_reason IS NOT NULL) AS hard_stop_count,
  ARRAY_AGG(DISTINCT hard_stop_reason) FILTER (WHERE hard_stop_reason IS NOT NULL) AS hard_stop_reasons
FROM summary_events
GROUP BY result
ORDER BY job_count DESC;

-- ============================================================================
-- 2. Planner Cache Effectiveness
-- ============================================================================
-- If planner cache telemetry is instrumented, analyze hit rate and latency savings
-- (Adjust field names based on actual implementation)

-- Example (update context fields as needed):
/*
WITH cache_events AS (
  SELECT
    id,
    created_at,
    (context->>'cacheHit')::boolean AS cache_hit,
    (context->>'durationMs')::numeric AS duration_ms,
    (context->>'strategy')::jsonb AS strategy
  FROM observability_events
  WHERE event_type = 'auto_assign.quote'
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  cache_hit,
  COUNT(*) AS quote_count,
  ROUND(AVG(duration_ms), 0) AS avg_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) AS median_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration_ms
FROM cache_events
GROUP BY cache_hit
ORDER BY cache_hit DESC;
*/

-- ============================================================================
-- 3. Retry Policy V2 Impact: Attempts Distribution
-- ============================================================================
-- Compare attempts_used distribution to baseline; expect lower p95/p99 if cutoffs improved

WITH attempts_histogram AS (
  SELECT
    (context->>'attemptsUsed')::int AS attempts,
    COUNT(*) AS job_count
  FROM observability_events
  WHERE event_type = 'auto_assign.summary'
    AND created_at >= NOW() - INTERVAL '7 days'
  GROUP BY attempts
)
SELECT
  attempts,
  job_count,
  ROUND(100.0 * job_count / SUM(job_count) OVER (), 2) AS pct_of_jobs,
  SUM(job_count) OVER (ORDER BY attempts ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_jobs,
  ROUND(100.0 * SUM(job_count) OVER (ORDER BY attempts ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / SUM(job_count) OVER (), 2) AS cumulative_pct
FROM attempts_histogram
ORDER BY attempts;

-- ============================================================================
-- 4. End-to-End Latency Improvement
-- ============================================================================
-- Measure total job duration delta (expect reduction from cache + smarter retries)

WITH duration_buckets AS (
  SELECT
    (context->>'totalDurationMs')::numeric AS duration_ms,
    (context->>'result')::text AS result
  FROM observability_events
  WHERE event_type = 'auto_assign.summary'
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  result,
  COUNT(*) AS job_count,
  ROUND(AVG(duration_ms), 0) AS avg_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) AS p50_ms,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY duration_ms) AS p75_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99_ms,
  MAX(duration_ms) AS max_ms
FROM duration_buckets
GROUP BY result
ORDER BY result;

-- ============================================================================
-- 5. Inline Skip Reason Effectiveness (Post-Optimization)
-- ============================================================================
-- Verify job correctly skips initial attempt when inline already failed with terminal reason

WITH inline_skip_analysis AS (
  SELECT
    (context->>'inlineSkipReason')::text AS skip_reason,
    (context->>'skippedInitialAttempt')::boolean AS skipped,
    (context->>'attemptsUsed')::int AS attempts_used,
    (context->>'result')::text AS result
  FROM observability_events
  WHERE event_type = 'auto_assign.summary'
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  skip_reason,
  skipped,
  COUNT(*) AS job_count,
  ROUND(AVG(attempts_used), 2) AS avg_attempts,
  result,
  COUNT(*) AS result_count
FROM inline_skip_analysis
WHERE skip_reason IS NOT NULL
GROUP BY skip_reason, skipped, result
ORDER BY job_count DESC;

-- ============================================================================
-- 6. Observability Events Volume Check
-- ============================================================================
-- Ensure optimizations didn't accidentally increase telemetry spam

SELECT
  DATE_TRUNC('hour', created_at) AS hour_bucket,
  COUNT(*) AS total_events,
  COUNT(*) FILTER (WHERE event_type LIKE 'auto_assign.%') AS auto_assign_events,
  COUNT(*) FILTER (WHERE event_type = 'auto_assign.summary') AS summary_events,
  COUNT(*) FILTER (WHERE event_type = 'auto_assign.attempt') AS attempt_events,
  COUNT(*) FILTER (WHERE event_type LIKE 'inline_auto_assign.%') AS inline_events
FROM observability_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour_bucket
ORDER BY hour_bucket DESC
LIMIT 48;

-- ============================================================================
-- 7. Feature Flag Rollout Safety: Gradual Exposure Analysis
-- ============================================================================
-- If feature flags include exposure % context, segment metrics by enabled/disabled cohorts
-- (Requires feature flag telemetry in context; adjust field names as needed)

-- Example (update based on actual flag context):
/*
WITH flagged_summaries AS (
  SELECT
    (context->>'featureFlags')::jsonb->'retry_policy_v2' AS flag_enabled,
    (context->>'attemptsUsed')::int AS attempts,
    (context->>'totalDurationMs')::numeric AS duration_ms,
    (context->>'result')::text AS result
  FROM observability_events
  WHERE event_type = 'auto_assign.summary'
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  flag_enabled,
  result,
  COUNT(*) AS job_count,
  ROUND(AVG(attempts), 2) AS avg_attempts,
  ROUND(AVG(duration_ms), 0) AS avg_duration_ms
FROM flagged_summaries
GROUP BY flag_enabled, result
ORDER BY flag_enabled, result;
*/

-- ============================================================================
-- COMPARISON NOTES
-- ============================================================================
-- Compare these results to baseline-results.txt/csv:
--
-- Expected Improvements:
-- 1. ↓ p95/p99 attempts_used (retry policy v2 cutoffs)
-- 2. ↓ p95/p99 total_duration_ms (cache + faster retries)
-- 3. ↑ skipped_initial_count (inline skip optimization)
-- 4. ↓ max_attempts_observed (hard stop enforcement)
-- 5. Cache hit rate > 0% (if cache enabled and warmed)
--
-- Red Flags (escalate if observed):
-- - ↑ p95 duration_ms (cache overhead > savings)
-- - ↑ exhausted jobs without matching cutoff/hard_stop
-- - Spike in observability_events volume (telemetry leak)
-- - Cache hit rate < 10% after 7d soak (cache config issue)
--
-- Export to CSV for archival:
--   \copy (SELECT ...) TO 'post-optimization-results.csv' WITH CSV HEADER
