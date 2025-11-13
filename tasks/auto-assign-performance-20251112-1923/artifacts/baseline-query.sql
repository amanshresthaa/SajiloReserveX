-- Auto-Assign Performance Baseline Metrics
-- Query observability_events for auto_assign telemetry captured after instrumentation
--
-- Purpose: Establish baseline performance metrics (median/p95/p99 duration, attempt counts)
-- before applying retry policy v2 and planner caching optimizations.
--
-- Prerequisites:
-- - Instrumentation must be deployed and collecting auto_assign.quote + auto_assign.summary events
-- - Sufficient data volume (recommend ≥100 jobs) for statistical significance
--
-- Usage:
--   psql $SUPABASE_DB_URL -f baseline-query.sql > baseline-results.txt
--   -- OR via Supabase SQL Editor (copy/paste)

-- ============================================================================
-- 1. Auto-Assign Job Summary Metrics
-- ============================================================================
-- Aggregate auto_assign.summary events to show:
-- - Job completion outcomes (succeeded/cutoff/exhausted/error)
-- - Attempts used distribution (median, p95, p99, max)
-- - Total job duration distribution
-- - Inline skip behavior

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
    (context->>'inlineSkipReason')::text AS inline_skip_reason
  FROM observability_events
  WHERE event_type = 'auto_assign.summary'
    AND created_at >= NOW() - INTERVAL '7 days'  -- Adjust window as needed
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
  COUNT(DISTINCT inline_skip_reason) FILTER (WHERE inline_skip_reason IS NOT NULL) AS unique_skip_reasons
FROM summary_events
GROUP BY result
ORDER BY job_count DESC;

-- ============================================================================
-- 2. Per-Attempt Planner Performance (auto_assign.quote)
-- ============================================================================
-- NOT YET IMPLEMENTED in current code (plan.md references it but not yet in job)
-- This query will work once we add per-attempt auto_assign.quote events
--
-- Expected to show:
-- - Planner call duration per attempt
-- - Success/failure breakdown
-- - Strategy effectiveness (requireAdjacency, maxTables)

-- Uncomment when auto_assign.quote events are emitted:
/*
WITH quote_events AS (
  SELECT
    id,
    created_at,
    restaurant_id,
    booking_id,
    (context->>'durationMs')::numeric AS planner_duration_ms,
    (context->>'success')::boolean AS planner_success,
    (context->>'reason')::text AS planner_reason,
    (context->>'reasonCode')::text AS reason_code,
    (context->>'strategy')::jsonb AS strategy,
    (context->>'trigger')::text AS trigger,
    (context->>'attemptIndex')::int AS attempt_index
  FROM observability_events
  WHERE event_type = 'auto_assign.quote'
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  planner_success,
  COUNT(*) AS quote_count,
  ROUND(AVG(planner_duration_ms), 0) AS avg_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY planner_duration_ms) AS median_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY planner_duration_ms) AS p95_duration_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY planner_duration_ms) AS p99_duration_ms,
  MAX(planner_duration_ms) AS max_duration_ms
FROM quote_events
GROUP BY planner_success
ORDER BY planner_success DESC;
*/

-- ============================================================================
-- 3. Inline Auto-Assign Comparison
-- ============================================================================
-- Compare inline vs job behavior to detect redundant work

WITH inline_events AS (
  SELECT
    booking_id,
    created_at,
    (context->>'durationMs')::numeric AS duration_ms,
    (context->>'hasHold')::boolean AS has_hold,
    (context->>'reason')::text AS reason
  FROM observability_events
  WHERE event_type = 'inline_auto_assign.quote_result'
    AND created_at >= NOW() - INTERVAL '7 days'
),
job_summaries AS (
  SELECT
    booking_id,
    created_at,
    (context->>'result')::text AS result,
    (context->>'attemptsUsed')::int AS attempts_used,
    (context->>'inlineSkipReason')::text AS inline_skip_reason
  FROM observability_events
  WHERE event_type = 'auto_assign.summary'
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  CASE 
    WHEN ie.has_hold THEN 'inline_success'
    WHEN ie.has_hold = false THEN 'inline_failure'
    ELSE 'no_inline_attempt'
  END AS inline_outcome,
  js.result AS job_result,
  COUNT(*) AS booking_count,
  ROUND(AVG(ie.duration_ms), 0) AS avg_inline_duration_ms,
  ROUND(AVG(js.attempts_used), 2) AS avg_job_attempts
FROM job_summaries js
LEFT JOIN inline_events ie ON ie.booking_id = js.booking_id
  AND ie.created_at < js.created_at  -- inline happens before job
  AND ie.created_at > js.created_at - INTERVAL '5 minutes'  -- within reasonable window
GROUP BY inline_outcome, js.result
ORDER BY booking_count DESC;

-- ============================================================================
-- 4. Retry Delay Impact (from existing auto_assign.attempt events)
-- ============================================================================
-- Current attempt events don't have timestamps per-attempt; use summary totalDuration
-- as a proxy for now. After adding per-attempt quote events, we can compute inter-attempt gaps.

WITH attempts_per_job AS (
  SELECT
    booking_id,
    (context->>'attemptsUsed')::int AS attempts,
    (context->>'totalDurationMs')::numeric AS total_ms,
    (context->>'result')::text AS result
  FROM observability_events
  WHERE event_type = 'auto_assign.summary'
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  result,
  attempts,
  COUNT(*) AS job_count,
  ROUND(AVG(total_ms), 0) AS avg_total_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_ms) AS median_total_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_ms) AS p95_total_ms
FROM attempts_per_job
WHERE attempts > 0
GROUP BY result, attempts
ORDER BY result, attempts;

-- ============================================================================
-- 5. Observability Events Ingestion Rate (safety check)
-- ============================================================================
-- Ensure instrumentation isn't overwhelming the table

SELECT
  DATE_TRUNC('hour', created_at) AS hour_bucket,
  COUNT(*) AS event_count,
  COUNT(*) FILTER (WHERE event_type LIKE 'auto_assign.%') AS auto_assign_count,
  COUNT(*) FILTER (WHERE event_type = 'auto_assign.summary') AS summary_count,
  COUNT(*) FILTER (WHERE event_type = 'auto_assign.attempt') AS attempt_count,
  COUNT(*) FILTER (WHERE event_type LIKE 'inline_auto_assign.%') AS inline_count
FROM observability_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour_bucket
ORDER BY hour_bucket DESC
LIMIT 48;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Adjust time windows (INTERVAL '7 days', etc.) based on data availability
-- 2. For production baseline, recommend ≥7 days of stable traffic
-- 3. Export results to CSV for artifact preservation:
--    \copy (SELECT ...) TO 'baseline-results.csv' WITH CSV HEADER
-- 4. Run this query BEFORE enabling FEATURE_AUTO_ASSIGN_RETRY_POLICY_V2 / PLANNER_CACHE_ENABLED
-- 5. Rerun as post-optimization-query.sql after feature flag rollout completes
