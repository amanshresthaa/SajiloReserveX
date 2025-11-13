# Assignment Pipeline V3 — Environment Configuration Guide

This document provides copy-paste environment variable configurations for each rollout phase.

---

## Quick Reference

| Environment    | Phase              | `ENABLED` | `SHADOW` | `MAX_PARALLEL` |
| -------------- | ------------------ | --------- | -------- | -------------- |
| **Local Dev**  | Testing (optional) | `true`    | `false`  | `3`            |
| **Staging**    | Shadow             | `false`   | `true`   | `3`            |
| **Staging**    | Full               | `true`    | `false`  | `3`            |
| **Production** | Shadow             | `false`   | `true`   | `3`            |
| **Production** | 10% Rollout        | `true`    | `false`  | `3`            |
| **Production** | 50% Rollout        | `true`    | `false`  | `3`            |
| **Production** | 100% Rollout       | `true`    | `false`  | `3`            |
| **Rollback**   | Disabled           | `false`   | `false`  | `3`            |

---

## Phase-by-Phase Configuration

### Phase 1: Local Development (Optional)

**Purpose**: Manual testing of coordinator before staging deployment

**.env.local** (or environment config):

```bash
# Assignment Pipeline V3 - LOCAL TESTING
FEATURE_ASSIGNMENT_PIPELINE_V3=true
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**Behavior**:

- Coordinator processes all new bookings
- Legacy code inactive
- Safe to experiment; no production impact

**Verification**:

```bash
# Start dev server
pnpm run dev

# Create test booking and check logs for:
grep -i "assignment.coordinator" logs/dev.log
grep -i "assignment.state_machine" logs/dev.log

# Query observability events in Supabase Studio:
# SELECT * FROM observability_events WHERE source = 'assignment.state_machine' ORDER BY created_at DESC LIMIT 10;
```

---

### Phase 2: Staging Shadow Mode

**Purpose**: Validate coordinator logic without affecting booking outcomes

**Staging Environment Variables**:

```bash
# Assignment Pipeline V3 - STAGING SHADOW MODE
FEATURE_ASSIGNMENT_PIPELINE_V3=false
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=true
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**Behavior**:

- **Legacy flow**: Runs as normal (production path)
- **Coordinator**: Runs in parallel but results are **not persisted**
- Shadow results logged for comparison

**Deployment** (example for Vercel):

```bash
# Via Vercel dashboard:
# Settings → Environment Variables → Add/Edit:
# FEATURE_ASSIGNMENT_PIPELINE_V3 = false
# FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW = true

# Via Vercel CLI:
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 false staging
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW true staging

# Redeploy to apply:
vercel --prod --env staging
```

**Monitoring Queries** (run in Supabase SQL Editor):

```sql
-- Verify shadow mode is active
SELECT
  event_type,
  COUNT(*) as event_count,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type;

-- Expected: You should see booking.assignment_state_transition events
-- If no events, shadow mode may not be running
```

**Duration**: Minimum 24 hours
**Exit Criteria**: 0 errors, event volume matches booking volume

---

### Phase 3: Staging Full Enablement

**Purpose**: Run coordinator as primary assignment path in staging

**Staging Environment Variables**:

```bash
# Assignment Pipeline V3 - STAGING FULL ENABLEMENT
FEATURE_ASSIGNMENT_PIPELINE_V3=true
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**Behavior**:

- Coordinator is **primary path**
- Legacy code inactive (but still present for emergency rollback)
- All bookings assigned via state machine

**Deployment**:

```bash
# Update environment variables
vercel env rm FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW staging
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 true staging

# Redeploy
vercel --prod --env staging
```

**Monitoring**:

```sql
-- Booking confirmation rate
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE assignment_state = 'manual_review') as manual_review,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'confirmed') / COUNT(*), 2) as confirmation_rate
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1 DESC;

-- Target: confirmation_rate >= 95%, manual_review < 10% of total
```

**Duration**: Minimum 48 hours
**Exit Criteria**: Confirmation rate ≥95%, 0 P0/P1 bugs, sign-off from QA + engineering lead

---

### Phase 4: Production Shadow Mode

**Purpose**: Validate coordinator with real production traffic (zero risk)

**Production Environment Variables**:

```bash
# Assignment Pipeline V3 - PRODUCTION SHADOW MODE
FEATURE_ASSIGNMENT_PIPELINE_V3=false
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=true
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**⚠️ PRODUCTION DEPLOYMENT CHECKLIST**:

- [ ] Coordinate with team (announce in Slack/Teams)
- [ ] Ensure on-call engineer is aware
- [ ] Schedule deployment during low-traffic window if possible
- [ ] Have rollback plan ready (see below)

**Deployment** (example):

```bash
# Vercel:
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 false production
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW true production
vercel --prod

# AWS/Other:
# Update environment variables via console/CLI
# Restart application or trigger deployment
```

**Real-Time Monitoring**:

```sql
-- Run every 15 minutes during first 2 hours, then hourly
SELECT
  COUNT(*) FILTER (WHERE source = 'assignment.state_machine') as coordinator_events,
  COUNT(*) FILTER (WHERE event_type = 'auto_assign.summary') as legacy_events,
  COUNT(DISTINCT booking_id) as unique_bookings
FROM observability_events
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Expected: coordinator_events ≈ unique_bookings, no errors
```

**Duration**: 24-48 hours (include weekend or peak booking times)
**Exit Criteria**: Shadow results match legacy, 0 production errors

---

### Phase 5: Production Gradual Rollout

#### 5a. Production 10% (Day 1)

**Production Environment Variables**:

```bash
# Assignment Pipeline V3 - PRODUCTION 10% ROLLOUT
FEATURE_ASSIGNMENT_PIPELINE_V3=true
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**⚠️ CRITICAL DEPLOYMENT**:

- [ ] Team notified and on standby
- [ ] Deployment during business hours (not late night)
- [ ] On-call engineer actively monitoring

**Deployment**:

```bash
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 true production
vercel env rm FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW production
vercel --prod
```

**Post-Deployment**:

- Monitor every 15 minutes for first hour
- Check metrics at 6h, 12h, 24h
- Look for anomalies in success rate, latency, errors

**Duration**: 24 hours
**Exit Criteria**: Metrics stable, no customer complaints

---

#### 5b. Production 50% (Day 2)

**Same configuration as 10%** (if per-restaurant rollout not implemented)

**If per-restaurant rollout**:

```bash
# In code, implement feature flag override:
# const useV3 = isAssignmentPipelineV3Enabled() || isRestaurantInRolloutList(restaurantId, 0.5);
```

**Duration**: 24 hours
**Exit Criteria**: No degradation vs. 10% phase

---

#### 5c. Production 100% (Day 3+)

**Same configuration** — already at 100% if no per-restaurant gating

**Ongoing Monitoring** (for 7 days):

```sql
-- Daily summary query
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE assignment_state = 'manual_review') as manual_review,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'confirmed') / COUNT(*), 2) as confirmation_rate
FROM bookings
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY 1 DESC;
```

**Duration**: 7 days minimum before legacy cleanup
**Exit Criteria**: 0 incidents, success rate stable ≥95%

---

## Rollback Procedures

### Emergency Rollback (Immediate)

**Scenario**: Production errors, customer impact, or P0 incident

**Action**:

```bash
# Disable V3 immediately
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 false production
vercel env rm FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW production
vercel --prod

# Or via dashboard:
# Set FEATURE_ASSIGNMENT_PIPELINE_V3=false
# Redeploy immediately
```

**Behavior**:

- Legacy planner loop takes over instantly
- Coordinator returns `noop` for all new bookings
- No code deployment needed

**Recovery Time**: <5 minutes (flag change + restart)

---

### Partial Rollback (Gradual)

**Scenario**: Minor issues during rollout; want to reduce blast radius

**Action**:

```bash
# If at 100%, roll back to 50% (requires per-restaurant gating in code)
# If at 50%, roll back to 10%
# If at 10%, roll back to shadow mode

# Shadow mode rollback:
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 false production
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW true production
vercel --prod
```

---

## Observability Dashboard Setup

### Recommended Grafana/Datadog Panels

**Panel 1: Booking Confirmation Rate**

```sql
SELECT
  time_bucket('5 minutes', created_at) as time,
  100.0 * COUNT(*) FILTER (WHERE status = 'confirmed') / COUNT(*) as confirmation_rate
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1;
```

Alert: confirmation_rate < 90% for >10 minutes

---

**Panel 2: Manual Review Queue**

```sql
SELECT
  COUNT(*) as manual_review_count
FROM bookings
WHERE assignment_state = 'manual_review'
  AND created_at > NOW() - INTERVAL '24 hours';
```

Alert: manual_review_count > 20% of daily bookings

---

**Panel 3: Coordinator Error Rate**

```sql
SELECT
  time_bucket('5 minutes', created_at) as time,
  COUNT(*) FILTER (WHERE event_type LIKE '%error%' OR event_type LIKE '%failure%') as errors,
  COUNT(*) as total
FROM observability_events
WHERE source LIKE 'assignment.%'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1;
```

Alert: error_rate > 5% for >10 minutes

---

**Panel 4: Assignment Latency (requires instrumentation)**

```
# Add timing logs in coordinator if not present
# Parse logs or use APM tool (Datadog, New Relic)
```

---

## Troubleshooting

### Issue: Shadow mode shows no events

**Symptoms**: `observability_events` has no `assignment.state_machine` entries

**Diagnosis**:

```sql
SELECT * FROM observability_events WHERE created_at > NOW() - INTERVAL '1 hour' ORDER BY created_at DESC LIMIT 20;
```

**Possible causes**:

1. Feature flag not applied (check logs for flag values)
2. No bookings created during observation window
3. Coordinator disabled by another config override

**Fix**: Verify flags, create test booking, check server logs

---

### Issue: High manual review rate

**Symptoms**: >10% of bookings end in `manual_review` state

**Diagnosis**:

```sql
SELECT
  context->>'reason' as reason,
  COUNT(*) as count
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND context->>'to' = 'manual_review'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 2 DESC;
```

**Possible causes**:

1. Insufficient table capacity (real constraint)
2. Strategy engine not finding solutions (tune parameters)
3. Retry budget too low (increase `maxRetries` in coordinator config)

**Fix**: Analyze reasons; adjust capacity or engine config; may need code changes

---

### Issue: Lock contention warnings

**Symptoms**: Logs show `outcome: noop, reason: lock_contention`

**Diagnosis**: Check concurrent booking patterns

**Possible causes**:

1. Multiple workers processing same booking
2. Lock TTL too long (currently 30s)
3. Lock not released (bug)

**Fix**: Review lock manager; adjust TTL; investigate stuck locks

---

## Post-Rollout Cleanup Checklist

After 7 days stable at 100% in production:

- [ ] Create new task: `cleanup-legacy-assignment-loop-YYYYMMDD-HHMM`
- [ ] Document legacy code paths to remove
- [ ] Update tests to reflect V3-only behavior
- [ ] Remove obsolete feature flag checks (optional; keep for safety)
- [ ] Archive rollout task with final metrics
- [ ] Update documentation (`FEATURES_SUMMARY.md`, runbooks)
- [ ] Retrospective meeting with team

---

## Contact & Escalation

**Questions during rollout**:

- Engineering Lead: ******\_\_\_******
- QA Lead: ******\_\_\_******
- On-Call Engineer: ******\_\_\_****** (during production rollout)

**Emergency contacts**:

- Engineering Manager: ******\_\_\_******
- Product Owner: ******\_\_\_******

**Slack/Teams channels**:

- #engineering-alerts (for incidents)
- #booking-assignment (for rollout updates)
