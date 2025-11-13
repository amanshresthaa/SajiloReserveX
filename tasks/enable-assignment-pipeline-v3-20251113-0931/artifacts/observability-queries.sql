# 📊 Assignment Pipeline V3 — Observability Queries

**Purpose**: Copy-paste SQL queries for monitoring V3 rollout in Supabase Studio or your analytics tool.

---

## 🔍 Phase Validation Queries

### Query 1: Verify Shadow Mode Is Active

**Purpose**: Confirm coordinator is running in shadow mode

```sql
SELECT 
  event_type,
  COUNT(*) as event_count,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type
ORDER BY event_count DESC;
```

**Expected output** (shadow mode active):
- `booking.assignment_state_transition` with count ≈ number of new bookings
- `first_seen` and `last_seen` within last hour

**If no results**: Shadow mode not running; check feature flags

---

### Query 2: State Transition Flow Validation

**Purpose**: Ensure bookings progress through expected states

```sql
SELECT 
  context->>'from' as from_state,
  context->>'to' as to_state,
  COUNT(*) as transition_count
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND event_type = 'booking.assignment_state_transition'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1, 2
ORDER BY 3 DESC;
```

**Expected output**:
```
from_state              | to_state                | transition_count
------------------------+-------------------------+-----------------
created                 | capacity_verified       | 150
capacity_verified       | assignment_pending      | 150
assignment_pending      | assignment_in_progress  | 150
assignment_in_progress  | assigned                | 142
assigned                | confirmed               | 142
assignment_in_progress  | manual_review           | 8
```

**Red flags**:
- Missing intermediate transitions (e.g., no `assignment_pending → assignment_in_progress`)
- High `manual_review` count (>10%)

---

### Query 3: Compare Legacy vs. Coordinator (Shadow Mode)

**Purpose**: Validate shadow coordinator matches legacy success rate

```sql
-- Legacy flow results
SELECT 
  'legacy' as source,
  COUNT(*) FILTER (WHERE context->>'result' = 'succeeded') as successes,
  COUNT(*) FILTER (WHERE context->>'result' = 'exhausted') as exhausted,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE context->>'result' = 'succeeded') / NULLIF(COUNT(*), 0), 2) as success_rate_pct
FROM observability_events
WHERE event_type = 'auto_assign.summary'
  AND created_at > NOW() - INTERVAL '24 hours'

UNION ALL

-- Coordinator (shadow) results
SELECT 
  'coordinator_shadow' as source,
  COUNT(*) FILTER (WHERE context->>'to' = 'confirmed') as successes,
  COUNT(*) FILTER (WHERE context->>'to' = 'manual_review') as manual_review,
  COUNT(DISTINCT booking_id) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE context->>'to' = 'confirmed') / NULLIF(COUNT(DISTINCT booking_id), 0), 2) as success_rate_pct
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND created_at > NOW() - INTERVAL '24 hours';
```

**Expected**: Success rates within ±5% of each other

**Example output**:
```
source              | successes | exhausted/manual | total | success_rate_pct
--------------------+-----------+------------------+-------+-----------------
legacy              | 142       | 8                | 150   | 94.67
coordinator_shadow  | 145       | 5                | 150   | 96.67
```

---

## 📈 Ongoing Monitoring Queries

### Query 4: Booking Confirmation Rate (Hourly)

**Purpose**: Track booking success over time

```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE assignment_state = 'manual_review') as manual_review,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'confirmed') / NULLIF(COUNT(*), 0), 2) as confirmation_rate_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE assignment_state = 'manual_review') / NULLIF(COUNT(*), 0), 2) as manual_review_pct
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1 DESC;
```

**Targets**:
- `confirmation_rate_pct` ≥ 95%
- `manual_review_pct` < 10%

**Alert threshold**: confirmation_rate_pct < 90% for 2+ consecutive hours

---

### Query 5: Manual Review Queue Analysis

**Purpose**: Understand why bookings aren't auto-assigning

```sql
SELECT 
  context->>'reason' as reason,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND event_type = 'booking.assignment_state_transition'
  AND context->>'to' = 'manual_review'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 2 DESC;
```

**Example output**:
```
reason              | count | percentage
--------------------+-------+-----------
no_assignment       | 5     | 62.5
timeout             | 2     | 25.0
circuit_open        | 1     | 12.5
```

**Action items**:
- `no_assignment` → Check table capacity or strategy config
- `timeout` → Increase planner timeout or optimize queries
- `circuit_open` → Investigate upstream failures

---

### Query 6: Coordinator Error Tracking

**Purpose**: Monitor coordinator health

```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE event_type LIKE '%error%' OR event_type LIKE '%failure%') as errors,
  COUNT(*) as total_events,
  ROUND(100.0 * COUNT(*) FILTER (WHERE event_type LIKE '%error%' OR event_type LIKE '%failure%') / NULLIF(COUNT(*), 0), 2) as error_rate_pct
FROM observability_events
WHERE source LIKE 'assignment.%'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1 DESC;
```

**Target**: `error_rate_pct` < 1%

**Alert threshold**: error_rate_pct > 5% for 10+ minutes

---

### Query 7: Assignment State Distribution (Current)

**Purpose**: See how many bookings are in each state right now

```sql
SELECT 
  assignment_state,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY assignment_state
ORDER BY count DESC;
```

**Expected distribution**:
- `confirmed`: ~90-95%
- `manual_review`: <10%
- Intermediate states (`assignment_pending`, `assignment_in_progress`): <1% (should resolve quickly)

**Red flags**:
- High percentage in `assignment_pending` or `assignment_in_progress` → stuck bookings
- `manual_review` > 10% → capacity issues or engine misconfiguration

---

### Query 8: Booking Assignment Attempts (Performance)

**Purpose**: Analyze how many attempts are needed to confirm bookings

```sql
SELECT 
  attempt_no,
  COUNT(*) as bookings,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM booking_assignment_attempts
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY attempt_no
ORDER BY attempt_no;
```

**Example output**:
```
attempt_no | bookings | percentage
-----------+----------+-----------
1          | 140      | 93.33
2          | 8        | 5.33
3          | 2        | 1.33
```

**Interpretation**:
- Most bookings succeed on first attempt (good!)
- If >10% require 3+ attempts → investigate capacity constraints

---

### Query 9: Assignment Strategy Usage

**Purpose**: See which strategies are being used

```sql
SELECT 
  strategy,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM booking_assignment_attempts
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND result = 'success'
GROUP BY strategy
ORDER BY count DESC;
```

**Example output**:
```
strategy        | count | percentage
----------------+-------+-----------
optimal_fit     | 120   | 80.0
adjacency       | 20    | 13.3
load_balancing  | 10    | 6.7
```

**Use**: Identify most effective strategies; consider deprioritizing low-success strategies

---

## 🚨 Alert Queries (Run Periodically or Set Up Alerts)

### Alert 1: High Error Rate

```sql
SELECT 
  COUNT(*) FILTER (WHERE event_type LIKE '%error%') as error_count,
  COUNT(*) as total_events
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND created_at > NOW() - INTERVAL '10 minutes';
```

**Trigger**: `error_count / total_events > 0.05` (5%)  
**Action**: Check logs, consider rollback

---

### Alert 2: Circuit Breaker Open

```sql
SELECT COUNT(*)
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND context->>'circuit_status' = 'open'
  AND created_at > NOW() - INTERVAL '5 minutes';
```

**Trigger**: Any result > 0  
**Action**: Investigate upstream failures; circuit should auto-recover

---

### Alert 3: Manual Review Queue Spike

```sql
SELECT COUNT(*) as manual_review_count
FROM bookings
WHERE assignment_state = 'manual_review'
  AND created_at > NOW() - INTERVAL '1 hour';
```

**Trigger**: `manual_review_count > (0.1 * total_bookings_last_hour)`  
**Action**: Check capacity, review manual_review reasons (Query 5)

---

### Alert 4: Stuck Bookings

```sql
SELECT 
  id,
  assignment_state,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as age_minutes
FROM bookings
WHERE assignment_state IN ('assignment_pending', 'assignment_in_progress')
  AND created_at < NOW() - INTERVAL '10 minutes'
ORDER BY created_at;
```

**Trigger**: Any results (bookings stuck >10 minutes in intermediate state)  
**Action**: Investigate booking IDs; check for lock contention or deadlocks

---

## 📊 Dashboard Recommendations

### Grafana/Datadog Panel Setup

**Panel 1: Confirmation Rate (Time Series)**
- Metric: `confirmation_rate_pct` from Query 4
- Visualization: Line chart
- Threshold: Red line at 90%, yellow at 95%

**Panel 2: Manual Review Rate (Time Series)**
- Metric: `manual_review_pct` from Query 4
- Visualization: Line chart
- Threshold: Red line at 10%

**Panel 3: State Transition Volume (Bar Chart)**
- Metric: Transition counts from Query 2
- Visualization: Stacked bar (by from/to state)

**Panel 4: Error Rate (Single Stat + Sparkline)**
- Metric: `error_rate_pct` from Query 6
- Visualization: Big number + trend line
- Color: Green <1%, Yellow 1-5%, Red >5%

**Panel 5: Strategy Distribution (Pie Chart)**
- Metric: Strategy usage from Query 9
- Visualization: Pie or donut chart

---

## 🔗 Export Queries for Analysis

### Export: 24-Hour Observability Events

```sql
COPY (
  SELECT 
    created_at,
    source,
    event_type,
    restaurant_id,
    booking_id,
    context
  FROM observability_events
  WHERE created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC
) TO '/tmp/observability_events_24h.csv' WITH CSV HEADER;
```

### Export: Booking Assignment Attempts

```sql
COPY (
  SELECT 
    ba.created_at,
    ba.booking_id,
    ba.attempt_no,
    ba.strategy,
    ba.result,
    ba.reason,
    ba.metadata,
    b.status,
    b.assignment_state
  FROM booking_assignment_attempts ba
  JOIN bookings b ON b.id = ba.booking_id
  WHERE ba.created_at > NOW() - INTERVAL '24 hours'
  ORDER BY ba.created_at DESC
) TO '/tmp/assignment_attempts_24h.csv' WITH CSV HEADER;
```

---

## 🎯 Quick Health Check (Run This First)

**One-query health check** for V3 rollout:

```sql
WITH metrics AS (
  SELECT 
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
    COUNT(*) FILTER (WHERE assignment_state = 'manual_review') as manual_review,
    COUNT(*) as total_bookings,
    COUNT(DISTINCT CASE WHEN assignment_state IN ('assignment_pending', 'assignment_in_progress') THEN id END) as stuck_bookings
  FROM bookings
  WHERE created_at > NOW() - INTERVAL '24 hours'
),
events AS (
  SELECT 
    COUNT(*) FILTER (WHERE source = 'assignment.state_machine') as state_events,
    COUNT(*) FILTER (WHERE event_type LIKE '%error%') as errors
  FROM observability_events
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  m.confirmed,
  m.manual_review,
  m.total_bookings,
  ROUND(100.0 * m.confirmed / NULLIF(m.total_bookings, 0), 2) as confirmation_rate,
  ROUND(100.0 * m.manual_review / NULLIF(m.total_bookings, 0), 2) as manual_review_rate,
  m.stuck_bookings,
  e.state_events,
  e.errors,
  CASE 
    WHEN ROUND(100.0 * m.confirmed / NULLIF(m.total_bookings, 0), 2) >= 95 
     AND ROUND(100.0 * m.manual_review / NULLIF(m.total_bookings, 0), 2) < 10
     AND m.stuck_bookings = 0
     AND e.errors = 0
    THEN '✅ HEALTHY'
    WHEN ROUND(100.0 * m.confirmed / NULLIF(m.total_bookings, 0), 2) < 90 
      OR e.errors > 10
    THEN '🚨 CRITICAL'
    ELSE '⚠️ WARNING'
  END as health_status
FROM metrics m, events e;
```

**Interpretation**:
- ✅ HEALTHY: All metrics within target; proceed
- ⚠️ WARNING: Some metrics borderline; monitor closely
- 🚨 CRITICAL: Rollback or investigate immediately

---

## 📝 Notes

- **Timezone**: All queries use `NOW()` which reflects your database timezone
- **Performance**: Add indexes if queries are slow:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_obs_events_source_created 
    ON observability_events(source, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_bookings_assignment_state 
    ON bookings(assignment_state, created_at DESC);
  ```
- **Retention**: Consider archiving old observability events (>30 days) to improve query speed

---

**Pro tip**: Bookmark this file and keep it open during rollout phases for quick copy-paste access! 🚀
