\set ON_ERROR_STOP on

WITH params AS (
  SELECT
    :'start_ts'::timestamptz AS window_start,
    :'end_ts'::timestamptz AS window_end
),
quote_events AS (
  SELECT
    (events.context::jsonb->>'planner_duration_ms')::numeric AS planner_duration_ms,
    (events.context::jsonb->>'cache_hit')::boolean AS cache_hit
  FROM observability_events AS events
  CROSS JOIN params
  WHERE events.event_type = 'auto_assign.quote'
    AND events.created_at >= params.window_start
    AND events.created_at < params.window_end
    AND (events.context::jsonb->>'planner_duration_ms') IS NOT NULL
),
quote_stats AS (
  SELECT
    COUNT(*) AS sample_size,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY planner_duration_ms)::numeric, 2) AS p50_ms,
    ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY planner_duration_ms)::numeric, 2) AS p90_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY planner_duration_ms)::numeric, 2) AS p95_ms,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY planner_duration_ms)::numeric, 2) AS p99_ms,
    ROUND(AVG(planner_duration_ms)::numeric, 2) AS avg_ms,
    MAX(planner_duration_ms) AS max_ms,
    COALESCE(SUM(CASE WHEN cache_hit IS TRUE THEN 1 ELSE 0 END), 0) AS cache_hits
  FROM quote_events
),
attempt_events AS (
  SELECT
    events.booking_id,
    COUNT(*) AS attempts
  FROM observability_events AS events
  CROSS JOIN params
  WHERE events.event_type = 'auto_assign.attempt'
    AND events.created_at >= params.window_start
    AND events.created_at < params.window_end
  GROUP BY events.booking_id
),
attempt_stats AS (
  SELECT
    COUNT(*) AS booking_count,
    ROUND(AVG(attempts)::numeric, 2) AS avg_attempts,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY attempts) AS median_attempts,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY attempts) AS p90_attempts,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY attempts) AS p95_attempts,
    MAX(attempts) AS max_attempts
  FROM attempt_events
),
inline_quote_events AS (
  SELECT
    (events.context::jsonb->>'durationMs')::numeric AS duration_ms,
    (events.context::jsonb->>'hasHold')::boolean AS has_hold
  FROM observability_events AS events
  CROSS JOIN params
  WHERE events.event_type = 'inline_auto_assign.quote_result'
    AND events.created_at >= params.window_start
    AND events.created_at < params.window_end
    AND (events.context::jsonb->>'durationMs') IS NOT NULL
),
inline_duration_stats AS (
  SELECT
    COUNT(*) AS sample_size,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p50_ms,
    ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p90_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p95_ms,
    ROUND(AVG(duration_ms)::numeric, 2) AS avg_ms,
    COALESCE(SUM(CASE WHEN has_hold IS TRUE THEN 1 ELSE 0 END), 0) AS inline_successes
  FROM inline_quote_events
),
inline_timeout_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE events.event_type = 'inline_auto_assign.timeout') AS timeout_events,
    COUNT(*) FILTER (WHERE events.event_type = 'inline_auto_assign.succeeded') AS success_events
  FROM observability_events AS events
  CROSS JOIN params
  WHERE events.event_type IN ('inline_auto_assign.timeout', 'inline_auto_assign.succeeded')
    AND events.created_at >= params.window_start
    AND events.created_at < params.window_end
),
job_success_events AS (
  SELECT
    (events.context::jsonb->>'durationMs')::numeric AS duration_ms
  FROM observability_events AS events
  CROSS JOIN params
  WHERE events.event_type = 'auto_assign.succeeded'
    AND events.created_at >= params.window_start
    AND events.created_at < params.window_end
    AND (events.context::jsonb->>'durationMs') IS NOT NULL
),
job_success_stats AS (
  SELECT
    COUNT(*) AS sample_size,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p50_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 2) AS p95_ms,
    ROUND(AVG(duration_ms)::numeric, 2) AS avg_ms,
    MAX(duration_ms) AS max_ms
  FROM job_success_events
),
job_event_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE events.event_type = 'auto_assign.started') AS started,
    COUNT(*) FILTER (WHERE events.event_type = 'auto_assign.succeeded') AS succeeded,
    COUNT(*) FILTER (WHERE events.event_type = 'auto_assign.failed') AS failed
  FROM observability_events AS events
  CROSS JOIN params
  WHERE events.event_type IN ('auto_assign.started', 'auto_assign.succeeded', 'auto_assign.failed')
    AND events.created_at >= params.window_start
    AND events.created_at < params.window_end
),
hard_stop_events AS (
  SELECT
    COUNT(*) FILTER (WHERE events.event_type = 'auto_assign.hard_stop') AS hard_stops
  FROM observability_events AS events
  CROSS JOIN params
  WHERE events.event_type = 'auto_assign.hard_stop'
    AND events.created_at >= params.window_start
    AND events.created_at < params.window_end
),
reason_events AS (
  SELECT
    CASE
      WHEN COALESCE(events.context::jsonb->>'reasonCode', '') <> '' THEN events.context::jsonb->>'reasonCode'
      WHEN (events.context::jsonb->>'reason') ILIKE '%no capacity%' THEN 'hard.no_capacity'
      WHEN (events.context::jsonb->>'reason') ILIKE '%no suitable%' THEN 'hard.no_suitable_tables'
      WHEN (events.context::jsonb->>'reason') ILIKE '%insufficient capacity%' THEN 'hard.insufficient_capacity'
      WHEN (events.context::jsonb->>'reason') ILIKE '%max tables%' THEN 'hard.max_tables'
      WHEN (events.context::jsonb->>'reason') ILIKE '%global capacity%' THEN 'hard.global_capacity'
      WHEN (events.context::jsonb->>'reason') ILIKE '%hold conflict%' THEN 'transient.hold_conflict'
      WHEN (events.context::jsonb->>'reason') ILIKE '%timeout%' THEN 'transient.timeout'
      WHEN (events.context::jsonb->>'reason') ILIKE '%abort%' THEN 'transient.abort'
      WHEN (events.context::jsonb->>'reason') ILIKE '%rpc%' THEN 'transient.rpc_error'
      WHEN (events.context::jsonb->>'reason') ILIKE '%lock wait%' THEN 'transient.lock_wait'
      WHEN COALESCE(events.context::jsonb->>'reason', '') = '' THEN 'unknown'
      ELSE 'unknown'
    END AS reason_bucket
  FROM observability_events AS events
  CROSS JOIN params
  WHERE events.event_type = 'auto_assign.attempt'
    AND events.created_at >= params.window_start
    AND events.created_at < params.window_end
),
reason_stats AS (
  SELECT
    reason_bucket,
    COUNT(*) AS bucket_count,
    SUM(COUNT(*)) OVER () AS total_count
  FROM reason_events
  GROUP BY reason_bucket
),
inline_duplicate_events AS (
  SELECT
    COUNT(*) AS duplicates
  FROM observability_events AS events
  CROSS JOIN params
  WHERE events.event_type IN (
    'auto_assign.email_duplicate_blocked',
    'auto_assign.email_skipped_inline'
  )
    AND events.created_at >= params.window_start
    AND events.created_at < params.window_end
),
metrics AS (
  SELECT 'planner_duration_p50_ms' AS metric, 'all' AS dimension, qs.p50_ms AS value, 'ms' AS unit, qs.sample_size AS sample_size, 'auto_assign.quote' AS source FROM quote_stats qs
  UNION ALL SELECT 'planner_duration_p90_ms', 'all', qs.p90_ms, 'ms', qs.sample_size, 'auto_assign.quote' FROM quote_stats qs
  UNION ALL SELECT 'planner_duration_p95_ms', 'all', qs.p95_ms, 'ms', qs.sample_size, 'auto_assign.quote' FROM quote_stats qs
  UNION ALL SELECT 'planner_duration_p99_ms', 'all', qs.p99_ms, 'ms', qs.sample_size, 'auto_assign.quote' FROM quote_stats qs
  UNION ALL SELECT 'planner_duration_avg_ms', 'all', qs.avg_ms, 'ms', qs.sample_size, 'auto_assign.quote' FROM quote_stats qs
  UNION ALL SELECT 'planner_duration_max_ms', 'all', qs.max_ms, 'ms', qs.sample_size, 'auto_assign.quote' FROM quote_stats qs
  UNION ALL SELECT 'planner_cache_hit_pct', 'all', CASE WHEN qs.sample_size > 0 THEN ROUND(100.0 * qs.cache_hits::numeric / qs.sample_size, 2) ELSE NULL END, 'pct', qs.sample_size, 'auto_assign.quote' FROM quote_stats qs
  UNION ALL SELECT 'job_attempts_avg', 'all', ats.avg_attempts, 'attempts', ats.booking_count, 'auto_assign.attempt' FROM attempt_stats ats
  UNION ALL SELECT 'job_attempts_p50', 'all', ats.median_attempts, 'attempts', ats.booking_count, 'auto_assign.attempt' FROM attempt_stats ats
  UNION ALL SELECT 'job_attempts_p90', 'all', ats.p90_attempts, 'attempts', ats.booking_count, 'auto_assign.attempt' FROM attempt_stats ats
  UNION ALL SELECT 'job_attempts_p95', 'all', ats.p95_attempts, 'attempts', ats.booking_count, 'auto_assign.attempt' FROM attempt_stats ats
  UNION ALL SELECT 'job_attempts_max', 'all', ats.max_attempts::numeric, 'attempts', ats.booking_count, 'auto_assign.attempt' FROM attempt_stats ats
  UNION ALL SELECT 'job_attempts_sample_size', 'bookings', ats.booking_count::numeric, 'count', ats.booking_count, 'auto_assign.attempt' FROM attempt_stats ats
  UNION ALL SELECT 'inline_duration_p50_ms', 'all', ids.p50_ms, 'ms', ids.sample_size, 'inline_auto_assign.quote_result' FROM inline_duration_stats ids
  UNION ALL SELECT 'inline_duration_p90_ms', 'all', ids.p90_ms, 'ms', ids.sample_size, 'inline_auto_assign.quote_result' FROM inline_duration_stats ids
  UNION ALL SELECT 'inline_duration_p95_ms', 'all', ids.p95_ms, 'ms', ids.sample_size, 'inline_auto_assign.quote_result' FROM inline_duration_stats ids
  UNION ALL SELECT 'inline_duration_avg_ms', 'all', ids.avg_ms, 'ms', ids.sample_size, 'inline_auto_assign.quote_result' FROM inline_duration_stats ids
  UNION ALL SELECT 'inline_success_rate_pct', 'all', CASE WHEN ids.sample_size > 0 THEN ROUND(100.0 * ids.inline_successes::numeric / ids.sample_size, 2) ELSE NULL END, 'pct', ids.sample_size, 'inline_auto_assign.quote_result' FROM inline_duration_stats ids
  UNION ALL SELECT 'inline_timeout_pct', 'all', CASE WHEN (its.timeout_events + its.success_events) > 0 THEN ROUND(100.0 * its.timeout_events::numeric / (its.timeout_events + its.success_events), 2) ELSE NULL END, 'pct', (its.timeout_events + its.success_events), 'inline_auto_assign.timeout/succeeded' FROM inline_timeout_stats its
  UNION ALL SELECT 'inline_success_event_count', 'all', its.success_events::numeric, 'count', its.success_events, 'inline_auto_assign.succeeded' FROM inline_timeout_stats its
  UNION ALL SELECT 'inline_timeout_event_count', 'all', its.timeout_events::numeric, 'count', its.timeout_events, 'inline_auto_assign.timeout' FROM inline_timeout_stats its
  UNION ALL SELECT 'job_success_duration_p50_ms', 'all', jss.p50_ms, 'ms', jss.sample_size, 'auto_assign.succeeded' FROM job_success_stats jss
  UNION ALL SELECT 'job_success_duration_p95_ms', 'all', jss.p95_ms, 'ms', jss.sample_size, 'auto_assign.succeeded' FROM job_success_stats jss
  UNION ALL SELECT 'job_success_duration_avg_ms', 'all', jss.avg_ms, 'ms', jss.sample_size, 'auto_assign.succeeded' FROM job_success_stats jss
  UNION ALL SELECT 'job_success_duration_max_ms', 'all', jss.max_ms, 'ms', jss.sample_size, 'auto_assign.succeeded' FROM job_success_stats jss
  UNION ALL SELECT 'job_success_rate_pct', 'all', CASE WHEN jec.started > 0 THEN ROUND(100.0 * jec.succeeded::numeric / jec.started, 2) ELSE NULL END, 'pct', jec.started, 'auto_assign.succeeded/started' FROM job_event_counts jec
  UNION ALL SELECT 'job_failure_rate_pct', 'all', CASE WHEN jec.started > 0 THEN ROUND(100.0 * jec.failed::numeric / jec.started, 2) ELSE NULL END, 'pct', jec.started, 'auto_assign.failed/started' FROM job_event_counts jec
  UNION ALL SELECT 'job_started_count', 'all', jec.started::numeric, 'count', jec.started, 'auto_assign.started' FROM job_event_counts jec
  UNION ALL SELECT 'job_succeeded_count', 'all', jec.succeeded::numeric, 'count', jec.succeeded, 'auto_assign.succeeded' FROM job_event_counts jec
  UNION ALL SELECT 'job_failed_count', 'all', jec.failed::numeric, 'count', jec.failed, 'auto_assign.failed' FROM job_event_counts jec
  UNION ALL SELECT 'job_hard_stop_count', 'all', hse.hard_stops::numeric, 'count', hse.hard_stops, 'auto_assign.hard_stop' FROM hard_stop_events hse
  UNION ALL
  SELECT
    'reason_share_pct' AS metric,
    rs.reason_bucket AS dimension,
    CASE WHEN rs.total_count > 0 THEN ROUND(100.0 * rs.bucket_count::numeric / rs.total_count, 2) ELSE NULL END AS value,
    'pct' AS unit,
    rs.bucket_count AS sample_size,
    'auto_assign.attempt' AS source
  FROM reason_stats rs
  UNION ALL
  SELECT
    'inline_email_duplicates' AS metric,
    'all' AS dimension,
    ide.duplicates::numeric AS value,
    'count' AS unit,
    ide.duplicates AS sample_size,
    'auto_assign.email_duplicate_blocked' AS source
  FROM inline_duplicate_events ide
)
SELECT
  :'start_ts'::timestamptz AS window_start,
  :'end_ts'::timestamptz AS window_end,
  metric,
  dimension,
  value,
  unit,
  sample_size,
  source
FROM metrics
ORDER BY metric, dimension;
