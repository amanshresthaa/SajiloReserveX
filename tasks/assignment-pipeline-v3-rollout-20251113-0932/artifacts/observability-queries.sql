-- Assignment Pipeline V3 - Observability Queries
-- Run these queries against the Supabase database to monitor the rollout

-- ============================================================================
-- Query 1: Success/Error Ratio (Last 6 Hours)
-- ============================================================================
-- This query shows the breakdown of coordinator events by type and success/failure
-- TARGET: Success rate ≥97%

SELECT
  event_type,
  count(*) AS total,
  count(*) FILTER (WHERE context->>'reason' IS NULL) AS successes,
  count(*) FILTER (WHERE context->>'reason' IS NOT NULL) AS failures,
  ROUND(
    100.0 * count(*) FILTER (WHERE context->>'reason' IS NULL) /
    NULLIF(count(*), 0),
    2
  ) AS success_rate_percent
FROM observability_events
WHERE source IN ('assignment.coordinator', 'assignment.state_machine')
  AND created_at >= now() - INTERVAL '6 hours'
GROUP BY 1
ORDER BY 1;

-- ============================================================================
-- Query 2: Event Type Summary (Last 24 Hours)
-- ============================================================================
-- High-level view of all coordinator events

SELECT
  event_type,
  count(*) AS total_events,
  min(created_at) AS first_seen,
  max(created_at) AS last_seen
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND created_at >= now() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY total_events DESC;

-- ============================================================================
-- Query 3: Retry Reasons + Delays
-- ============================================================================
-- Understand why retries are happening and how long delays are
-- TARGET: Low retry rate, reasonable delays

SELECT
  context->>'reason' AS reason,
  avg((context->>'delay_ms')::numeric) AS avg_delay_ms,
  min((context->>'delay_ms')::numeric) AS min_delay_ms,
  max((context->>'delay_ms')::numeric) AS max_delay_ms,
  count(*) AS retry_count
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND event_type = 'coordinator.retry'
  AND created_at >= now() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY retry_count DESC;

-- ============================================================================
-- Query 4: Manual Review Rate by Restaurant
-- ============================================================================
-- Track how often bookings are escalated to manual review
-- TARGET: Manual review rate <1%

SELECT
  restaurant_id,
  count(*) FILTER (WHERE event_type = 'coordinator.manual_review') AS manual_reviews,
  count(*) FILTER (WHERE event_type = 'coordinator.confirmed') AS confirmed,
  count(*) FILTER (WHERE event_type = 'coordinator.error') AS errors,
  ROUND(
    100.0 * count(*) FILTER (WHERE event_type = 'coordinator.manual_review')::numeric /
    NULLIF(count(*) FILTER (WHERE event_type = 'coordinator.confirmed'), 0),
    2
  ) AS percent_manual
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND created_at >= now() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY manual_reviews DESC;

-- ============================================================================
-- Query 5: State Machine Transitions (Verify Pipeline Health)
-- ============================================================================
-- Ensure state machine is progressing bookings correctly

SELECT
  event_type,
  count(*) AS total_transitions
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND created_at >= now() - INTERVAL '6 hours'
GROUP BY 1
ORDER BY total_transitions DESC;

-- ============================================================================
-- Query 6: Error Details (Last 6 Hours)
-- ============================================================================
-- Investigate any errors that occurred

SELECT
  created_at,
  restaurant_id,
  booking_id,
  event_type,
  context->>'reason' AS error_reason,
  context->>'message' AS error_message,
  context->>'strategy' AS attempted_strategy
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND event_type = 'coordinator.error'
  AND created_at >= now() - INTERVAL '6 hours'
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- Query 7: Lock Contention (Monitor Concurrency Issues)
-- ============================================================================
-- Check if lock contention is occurring

SELECT
  date_trunc('hour', created_at) AS hour,
  count(*) AS lock_contention_count
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND event_type = 'coordinator.lock_contention'
  AND created_at >= now() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1 DESC;

-- ============================================================================
-- Query 8: Circuit Breaker Trips (Monitor System Health)
-- ============================================================================
-- Check if circuit breaker is protecting against upstream failures

SELECT
  created_at,
  restaurant_id,
  booking_id,
  context->>'service' AS affected_service,
  context->>'reason' AS trip_reason
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND event_type = 'coordinator.circuit_open'
  AND created_at >= now() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- ============================================================================
-- Query 9: Assignment Timing Metrics
-- ============================================================================
-- Analyze how long assignments are taking

SELECT
  event_type,
  count(*) AS total_events,
  ROUND(avg((context->>'duration_ms')::numeric), 2) AS avg_duration_ms,
  ROUND(min((context->>'duration_ms')::numeric), 2) AS min_duration_ms,
  ROUND(max((context->>'duration_ms')::numeric), 2) AS max_duration_ms,
  ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY (context->>'duration_ms')::numeric), 2) AS p50_duration_ms,
  ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY (context->>'duration_ms')::numeric), 2) AS p95_duration_ms
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND event_type IN ('coordinator.confirmed', 'coordinator.manual_review')
  AND context->>'duration_ms' IS NOT NULL
  AND created_at >= now() - INTERVAL '24 hours'
GROUP BY 1;

-- ============================================================================
-- Query 10: Hourly Event Rate (Detect Anomalies)
-- ============================================================================
-- Track event volume over time

SELECT
  date_trunc('hour', created_at) AS hour,
  event_type,
  count(*) AS event_count
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND created_at >= now() - INTERVAL '24 hours'
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;
