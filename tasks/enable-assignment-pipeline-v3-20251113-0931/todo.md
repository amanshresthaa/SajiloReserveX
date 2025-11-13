---
task: enable-assignment-pipeline-v3
timestamp_utc: 2025-11-13T09:31:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: [FEATURE_ASSIGNMENT_PIPELINE_V3, FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW]
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Review existing AssignmentCoordinator implementation (`server/assignments/`)
- [x] Confirm feature flags are properly wired (`lib/env.ts`, `config/env.schema.ts`)
- [x] Verify observability events are instrumented (`assignment.state_machine`)
- [x] Create task folder with artifacts per `/AGENTS.md`

## Phase 1: Local Development (Optional)

- [ ] Copy `.env.example` to `.env.local` if not present
- [ ] Set local environment variables:
  ```bash
  FEATURE_ASSIGNMENT_PIPELINE_V3=true
  FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
  FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
  ```
- [ ] Start dev server: `pnpm run dev`
- [ ] Create test booking via UI or API
- [ ] Verify coordinator processes booking:
  - [ ] Check server logs for `[assignment.coordinator]` entries
  - [ ] Query `observability_events` for `source = 'assignment.state_machine'`
  - [ ] Confirm booking reaches `confirmed` state
  - [ ] Verify email sent exactly once
- [ ] Test edge cases:
  - [ ] Lock contention (create 5+ concurrent bookings same restaurant)
  - [ ] No capacity scenario (book all tables, try another)
  - [ ] State transition validation (attempt invalid transition)

**Exit Criteria**: Coordinator successfully confirms bookings locally with expected events

---

## Phase 2: Staging Shadow Mode

### Configuration

- [ ] Access staging environment config (Vercel/AWS/Supabase dashboard)
- [ ] Set staging environment variables:
  ```bash
  FEATURE_ASSIGNMENT_PIPELINE_V3=false
  FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=true
  FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
  ```
- [ ] Deploy/restart staging application
- [ ] Confirm flags loaded: check `/api/debug/config` or logs

### Monitoring Setup

- [ ] Set up Supabase query dashboard for staging:
  ```sql
  -- Shadow mode validation query
  SELECT
    DATE_TRUNC('hour', created_at) as hour,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT booking_id) as unique_bookings
  FROM observability_events
  WHERE source = 'assignment.state_machine'
    AND created_at > NOW() - INTERVAL '24 hours'
  GROUP BY 1, 2
  ORDER BY 1 DESC, 3 DESC;
  ```
- [ ] Create comparison query (legacy vs. V3 shadow):
  ```sql
  -- Compare outcomes
  SELECT
    'legacy' as source,
    COUNT(*) FILTER (WHERE event_type = 'auto_assign.summary' AND context->>'result' = 'succeeded') as successes,
    COUNT(*) FILTER (WHERE event_type = 'auto_assign.summary') as total
  FROM observability_events
  WHERE created_at > NOW() - INTERVAL '24 hours'
  UNION ALL
  SELECT
    'coordinator_shadow' as source,
    COUNT(*) FILTER (WHERE context->>'to' = 'confirmed') as successes,
    COUNT(DISTINCT booking_id) as total
  FROM observability_events
  WHERE source = 'assignment.state_machine'
    AND created_at > NOW() - INTERVAL '24 hours';
  ```

### Testing

- [ ] Generate staging load: Create 50+ test bookings over 24 hours
- [ ] Monitor observability events every 6 hours
- [ ] Check server logs for coordinator errors/warnings
- [ ] Verify shadow coordinator results match legacy outcomes (±5%)

### Validation Checklist

- [ ] `observability_events` shows `assignment.state_machine` events
- [ ] Event volume ≈ booking creation volume
- [ ] No coordinator errors in logs
- [ ] Shadow success rate comparable to legacy
- [ ] No circuit breaker opens
- [ ] No rate limit errors (unless expected)

**Duration**: 24 hours minimum
**Exit Criteria**: All validation items pass; 0 errors

---

## Phase 3: Staging Full Enablement

### Configuration

- [ ] Update staging environment variables:
  ```bash
  FEATURE_ASSIGNMENT_PIPELINE_V3=true
  FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
  FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
  ```
- [ ] Deploy/restart staging application
- [ ] Confirm flag change in logs

### Monitoring

- [ ] Track booking confirmation rate:
  ```sql
  SELECT
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
    COUNT(*) as total,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'confirmed') / COUNT(*), 2) as confirmation_rate_pct
  FROM bookings
  WHERE created_at > NOW() - INTERVAL '48 hours'
  GROUP BY 1
  ORDER BY 1 DESC;
  ```
- [ ] Monitor manual review queue:
  ```sql
  SELECT COUNT(*) as manual_review_count
  FROM bookings
  WHERE assignment_state = 'manual_review'
    AND created_at > NOW() - INTERVAL '48 hours';
  ```
- [ ] Track coordinator latency (add timing logs if not present)

### Testing

- [ ] Create diverse booking scenarios:
  - [ ] Small party (2 people)
  - [ ] Large party (10+ people)
  - [ ] Peak time slot (all popular)
  - [ ] Off-peak slot
  - [ ] Edge party size (e.g., 7 if tables are 2/4/6)
  - [ ] Concurrent bookings (same restaurant, same time)
- [ ] Verify all reach `confirmed` or `manual_review` (no stuck states)
- [ ] Check emails sent correctly (no duplicates)
- [ ] Test booking modification flow (if applicable)

### Edge Case Testing

- [ ] Force circuit breaker open (fail 5+ assignments rapidly):
  - [ ] Verify coordinator returns retry with delay
  - [ ] Confirm circuit recovers after cooldown
- [ ] Test rate limiting (create 10+ concurrent bookings):
  - [ ] Verify only 3 processed concurrently per restaurant
  - [ ] Confirm others queue and process later
- [ ] Simulate state transition race (concurrent updates):
  - [ ] Verify optimistic lock prevents conflicts

**Duration**: 48 hours minimum
**Exit Criteria**:

- [ ] Confirmation rate ≥95%
- [ ] Manual review rate <10%
- [ ] 0 P0/P1 bugs
- [ ] Sign-off from QA/engineering lead

---

## Phase 4: Production Shadow Mode

### Configuration

- [ ] **⚠️ PRODUCTION ENVIRONMENT ⚠️**
- [ ] Coordinate with team: announce shadow mode start time
- [ ] Set production environment variables:
  ```bash
  FEATURE_ASSIGNMENT_PIPELINE_V3=false
  FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=true
  FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
  ```
- [ ] Deploy/restart production application
- [ ] Verify deployment health checks pass
- [ ] Confirm flags in production logs

### Monitoring (Production)

- [ ] Set up real-time monitoring dashboard (Grafana/Datadog/Supabase)
- [ ] Configure alerts:
  - [ ] Coordinator error rate >5% (P1 alert)
  - [ ] Circuit breaker open >5min (P2 alert)
  - [ ] Manual review queue spike (P3 alert)
- [ ] Run same validation queries as staging (Phase 2)

### Observation Period

- [ ] Monitor for 24-48 hours (include weekend if possible)
- [ ] Check metrics every 4 hours
- [ ] Compare shadow vs. legacy outcomes
- [ ] Look for anomalies in:
  - [ ] Error rates
  - [ ] Latency patterns
  - [ ] State transition failures
  - [ ] Lock contention

**Duration**: 24-48 hours (include peak booking times)
**Exit Criteria**:

- [ ] Shadow results match legacy (±5%)
- [ ] 0 production errors from coordinator
- [ ] Sign-off from on-call engineer + product owner

---

## Phase 5: Production Gradual Rollout

### 5a. Production 10% Rollout (Day 1)

- [ ] **⚠️ PRODUCTION DEPLOYMENT ⚠️**
- [ ] Coordinate with team: announce production rollout start
- [ ] Update production environment variables:
  ```bash
  FEATURE_ASSIGNMENT_PIPELINE_V3=true
  FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
  FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
  ```
  _Note: If per-restaurant rollout is needed, implement feature flag override in code first_
- [ ] Deploy to production
- [ ] Monitor first hour closely (every 15 minutes)
- [ ] Check metrics after 6 hours, 12 hours, 24 hours
- [ ] Verify:
  - [ ] Booking confirmation rate stable (≥95%)
  - [ ] No error rate spike
  - [ ] Circuit breaker status healthy
  - [ ] Manual review queue normal (<10%)

**Duration**: 24 hours
**Rollback Plan**: Set `FEATURE_ASSIGNMENT_PIPELINE_V3=false` if issues detected

---

### 5b. Production 50% Rollout (Day 2)

- [ ] Review Day 1 metrics with team
- [ ] Decision gate: Proceed if all Day 1 criteria met
- [ ] (If per-restaurant rollout) Expand to 50% of restaurants
- [ ] Monitor same metrics as 10% phase
- [ ] Watch for:
  - [ ] Increased lock contention
  - [ ] Database load changes
  - [ ] Any degradation in P95 latency

**Duration**: 24 hours
**Rollback Plan**: Reduce to 10% or disable fully

---

### 5c. Production 100% Rollout (Day 3)

- [ ] Review Day 1-2 metrics; confirm stability
- [ ] Decision gate: Full team sign-off required
- [ ] Enable V3 for all production traffic
- [ ] Monitor continuously for first 24 hours
- [ ] Run stability checks:
  - [ ] All bookings processing normally
  - [ ] Email delivery rate normal
  - [ ] No customer complaints about confirmations
  - [ ] Ops dashboard functioning correctly

**Duration**: 7 days minimum (before legacy cleanup)
**Exit Criteria**:

- [ ] 7 consecutive days with 0 incidents
- [ ] Success rate stable ≥95%
- [ ] Manual review queue healthy
- [ ] Post-rollout retrospective complete

---

## Phase 6: Legacy Cleanup (Week 2+)

- [ ] Wait 7 days after 100% production rollout
- [ ] Create separate cleanup task: `cleanup-legacy-assignment-loop-YYYYMMDD-HHMM`
- [ ] Document legacy code to remove in that task's research.md:
  - [ ] Legacy planner loop in `server/jobs/auto-assign.ts`
  - [ ] Retry logic specific to legacy flow
  - [ ] Deprecated helper functions
  - [ ] Obsolete feature flags (if any)
- [ ] Follow full SDLC for cleanup (research → plan → implement → verify)
- [ ] Ensure tests updated to reflect V3-only behavior
- [ ] Update documentation to remove legacy references

**Exit**: Legacy code archived in git; V3 is sole assignment path

---

## Notes

### Assumptions

- AssignmentCoordinator implementation is complete and tested (confirmed: yes)
- All required database schema already deployed (confirmed: yes)
- Observability events are properly instrumented (confirmed: yes)
- Email deduplication logic handles V3 flow (verified via `shouldSkipEmailForJob()`)

### Deviations

- None expected; this is a configuration-only rollout

### Batched Questions

- [ ] **Q1**: Which environment should we start with (local, staging, production shadow)?
      **A**: Start with **staging shadow** (skip local if confident in existing tests)

- [ ] **Q2**: What is the minimum observation period for each phase?
      **A**: Shadow mode: 24h minimum; Full rollout: 24-48h per increment; Production 100%: 7 days before cleanup

- [ ] **Q3**: Who has approval authority for production rollout?
      **A**: Engineering lead + QA lead; product owner for 100% rollout

- [ ] **Q4**: What is the rollback SLA?
      **A**: Immediate (flag flip + restart); target <5 minutes for emergency rollback
