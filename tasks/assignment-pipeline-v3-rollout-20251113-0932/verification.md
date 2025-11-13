---
task: assignment-pipeline-v3-rollout
timestamp_utc: 2025-11-13T09:32:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: [FEATURE_ASSIGNMENT_PIPELINE_V3]
related_tickets: []
rollout_started: 2025-11-13T15:00:00Z
---

# Verification Report: Assignment Pipeline V3 Rollout

## Rollout Status

**Current Phase**: ✅ Preparation Complete - Ready for Staging Phase 1

### Rollout Timeline

| Phase                           | Status      | Started          | Completed        | Duration | Notes                       |
| ------------------------------- | ----------- | ---------------- | ---------------- | -------- | --------------------------- |
| **Preparation**                 | ✅ Complete | 2025-11-13 15:00 | 2025-11-13 15:30 | 30 min   | Runbooks created, DB tested |
| **Staging Phase 1 (Shadow)**    | ⏳ Pending  | -                | -                | -        | Awaiting flag deployment    |
| **Staging Phase 2 (Full)**      | ⏳ Pending  | -                | -                | -        | Requires 48h monitoring     |
| **Production Phase 1 (Shadow)** | ⏳ Pending  | -                | -                | -        | After staging success       |
| **Production Phase 2 (Full)**   | ⏳ Pending  | -                | -                | -        | Final production rollout    |
| **Legacy Cleanup**              | ⏳ Pending  | -                | -                | -        | After 1 week stability      |

---

## Pre-Rollout Verification

### Infrastructure Checks

- ✅ **Database Connection**: Verified working (PostgreSQL connection successful)
- ✅ **Observability Events**: Baseline captured - 2,631 events in last 24h
- ✅ **Vercel CLI**: Available (`/Users/amankumarshrestha/Library/pnpm/vercel`)
- ✅ **Environment Schema**: V3 flags present in `config/env.schema.ts` (lines 76-78)
- ✅ **Task Folder**: Artifacts directory ready at `tasks/assignment-pipeline-v3-rollout-20251113-0932/artifacts/`

### Baseline Metrics (Pre-Rollout)

**Data captured**: 2025-11-13 ~15:00 UTC
**Time range**: Last 24 hours

**Event Breakdown** (Top 10):

| Source                        | Event Type                        | Count |
| ----------------------------- | --------------------------------- | ----- |
| `capacity.rpc`                | `capacity.rpc.conflict`           | 2,323 |
| `auto_assign`                 | `auto_assign.attempt`             | 41    |
| `auto_assign`                 | `auto_assign.quote`               | 27    |
| `capacity.transaction`        | `booking.creation.success`        | 27    |
| `bookings.inline_auto_assign` | `inline_auto_assign.quote_result` | 20    |

**Key Observations**:

- ✅ **No** `assignment.coordinator.*` events present (expected - V3 not enabled)
- ✅ Legacy auto-assign system active (`auto_assign.*` events present)
- ✅ Normal booking flow operational

**Baseline file**: `artifacts/baseline-events-20251113-*.txt`

### Documentation Deliverables

- ✅ **Main Runbook**: `docs/assignment-pipeline-rollout.md` (reviewed)
- ✅ **Staging Commands**: `artifacts/staging-rollout-commands.md` (created)
- ✅ **Production Commands**: `artifacts/production-rollout-commands.md` (created)
- ✅ **SQL Queries**: `artifacts/observability-queries.sql` (10 queries prepared)
- ✅ **Quick Reference**: `artifacts/ROLLOUT-QUICKSTART.md` (created)

---

## Staging Rollout

### Phase 1: Shadow Mode

**Target Date**: TBD (waiting for execution)
**Expected Duration**: 30 minutes

#### Pre-Phase Checklist

- [ ] Vercel CLI authenticated (`vercel login`)
- [ ] Project linked (`vercel link`)
- [ ] Engineering team notified of rollout start

#### Deployment Steps

```bash
# Set shadow mode flags (from staging-rollout-commands.md)
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 preview         # false
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW preview  # true
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL preview  # 3

# Deploy
vercel --target preview
```

#### Verification Criteria

- [ ] Deployment successful (check Vercel dashboard)
- [ ] Legacy routing still active (only `auto_assign.*` events)
- [ ] No `assignment.coordinator.*` events appear
- [ ] No errors in Vercel logs

#### Evidence to Capture

- [ ] Deployment URL and timestamp
- [ ] SQL query results confirming no coordinator events
- [ ] Screenshot of Vercel environment variables

---

### Phase 2: Full Mode

**Target Date**: TBD (after Phase 1 success)
**Expected Duration**: 48 hours + monitoring

#### Pre-Phase Checklist

- [ ] Phase 1 verified successful
- [ ] Monitoring dashboard ready
- [ ] SQL queries tested and working

#### Deployment Steps

```bash
# Flip to full mode
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 preview         # true
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW preview  # false
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL preview  # 3

# Deploy
vercel --target preview
```

#### Verification Criteria

- [ ] `assignment.coordinator.*` events appearing in observability
- [ ] Success rate ≥97% sustained for 48 hours
- [ ] Manual review rate <1%
- [ ] No sustained `coordinator.error` events
- [ ] No circuit breaker trips
- [ ] State machine transitions working (`assignment.state_machine` events)

#### Monitoring Schedule

| Time              | Query Set          | Captured By | Status     |
| ----------------- | ------------------ | ----------- | ---------- |
| T+0h (deployment) | Quick health check | -           | ⏳ Pending |
| T+1h              | Full query suite   | -           | ⏳ Pending |
| T+6h              | Full query suite   | -           | ⏳ Pending |
| T+12h             | Full query suite   | -           | ⏳ Pending |
| T+24h             | Full query suite   | -           | ⏳ Pending |
| T+36h             | Full query suite   | -           | ⏳ Pending |
| T+48h             | Final verification | -           | ⏳ Pending |

#### Evidence to Capture

- [ ] Query results at T+0h, T+6h, T+12h, T+24h, T+48h
- [ ] Success rate calculations
- [ ] Manual review rate statistics
- [ ] Any errors or anomalies observed
- [ ] Coordinator event samples

---

## Production Rollout

### Phase 1: Shadow Mode

**Target Date**: TBD (after staging 48h success)
**Expected Duration**: 24 hours

#### Pre-Phase Checklist

- [ ] Staging Phase 2 metrics meet success criteria (≥97% success, <1% manual review)
- [ ] Staging stable for full 48 hours
- [ ] Engineering team available for monitoring
- [ ] Rollback plan reviewed and ready

#### Deployment Steps

```bash
# Set shadow mode flags (from production-rollout-commands.md)
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 production         # false
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW production  # true
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL production  # 3

# Deploy to production
vercel --prod
```

#### Verification Criteria

- [ ] Deployment successful
- [ ] Legacy routing still active (production using `auto_assign.*`)
- [ ] No `assignment.coordinator.*` events in production
- [ ] No customer-reported issues

---

### Phase 2: Full Mode

**Target Date**: TBD (after Production Phase 1 success)
**Expected Duration**: 48 hours minimum

**⚠️ CRITICAL PHASE - Enhanced monitoring required**

#### Pre-Phase Checklist

- [ ] Production shadow mode stable for 24h
- [ ] On-call engineer assigned
- [ ] Alert channels configured
- [ ] Rollback plan tested
- [ ] Customer support team notified

#### Deployment Steps

```bash
# Enable V3 in production (CRITICAL)
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 production         # true
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW production  # false
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL production  # 3

# Deploy to production
vercel --prod

# IMMEDIATELY begin intensive monitoring
```

#### Verification Criteria

- [ ] Success rate ≥97% sustained for 48 hours
- [ ] Manual review rate <1%
- [ ] No sustained errors
- [ ] No circuit breaker trips
- [ ] Customer bookings working normally
- [ ] Email confirmations sending properly

#### Monitoring Schedule (Intensive)

| Time  | Query Set          | Captured By | Status     |
| ----- | ------------------ | ----------- | ---------- |
| T+0h  | Quick health check | -           | ⏳ Pending |
| T+30m | Quick health check | -           | ⏳ Pending |
| T+1h  | Full query suite   | -           | ⏳ Pending |
| T+2h  | Quick health check | -           | ⏳ Pending |
| T+4h  | Full query suite   | -           | ⏳ Pending |
| T+6h  | Full query suite   | -           | ⏳ Pending |
| T+12h | Full query suite   | -           | ⏳ Pending |
| T+24h | Full query suite   | -           | ⏳ Pending |
| T+48h | Final verification | -           | ⏳ Pending |

#### Evidence to Capture

- [ ] All query results timestamped and saved
- [ ] Success metrics calculated and documented
- [ ] Any incidents or anomalies with resolution notes
- [ ] Customer feedback (if any)
- [ ] Performance comparison vs legacy

---

## Test Outcomes (Pre-Implementation)

### Manual QA — Chrome DevTools (MCP)

Not applicable — no UI surfaces changed. Focused on server telemetry + documentation.

### Automated Tests

- **Coordinator Telemetry Test**:
  - Command: `pnpm vitest run --config vitest.config.ts tests/server/assignments/assignment-coordinator.telemetry.test.ts`
  - Result: ✅ **Passes** - verifies helper emits combined trigger/details context and null context when absent

- **Full Ops Test Suite**:
  - Command: `pnpm test:ops`
  - Result: ⚠️ **Pre-existing failures** in unrelated suites:
    - `tests/server/jobs/booking-side-effects.test.ts`
    - `tests/server/capacity/holds.strict-conflict.test.ts`
    - `tests/server/capacity/selector.scoring.test.ts`
    - `tests/server/ops/manualAssignmentRoutes.test.ts`
  - Note: Coordinator telemetry test continues to pass. No new regressions introduced.

### Artifacts

- Observability SQL snippets + rollout guidance: `docs/assignment-pipeline-rollout.md`
- Baseline event snapshot: `artifacts/baseline-events-20251113-*.txt`
- Staging deployment guide: `artifacts/staging-rollout-commands.md`
- Production deployment guide: `artifacts/production-rollout-commands.md`
- SQL query suite: `artifacts/observability-queries.sql`

---

## Rollback Log

| Date/Time | Environment | Reason | Actions Taken | Outcome                |
| --------- | ----------- | ------ | ------------- | ---------------------- |
| -         | -           | -      | -             | No rollbacks performed |

---

## Issues & Resolutions

| Issue # | Discovered | Environment | Description | Resolution | Resolved  |
| ------- | ---------- | ----------- | ----------- | ---------- | --------- |
| -       | -          | -           | -           | -          | No issues |

---

## Success Criteria Summary

### Staging Success Criteria

- [ ] Phase 1 deployed successfully
- [ ] Phase 2 enabled without errors
- [ ] Coordinator events populated as expected
- [ ] Success rate ≥97% for 48 hours
- [ ] Manual review rate <1%
- [ ] All observability queries working

### Production Success Criteria

- [ ] Phase 1 (shadow) stable for 24h
- [ ] Phase 2 enabled without customer impact
- [ ] Success rate ≥97% for 48 hours
- [ ] Manual review rate <1%
- [ ] No customer-reported issues
- [ ] Booking flow performance acceptable

---

## Post-Rollout Actions

### Immediate (After Production Success)

- [ ] Document final metrics in this file
- [ ] Capture final query results in artifacts/
- [ ] Update `.env.example` to reflect V3 as default
- [ ] Notify stakeholders of successful rollout

### Follow-Up (Within 1 Week)

- [ ] Monitor production for 1 week stability
- [ ] Create task: "Delete Legacy Planner Loop" (reference: `server/jobs/auto-assign.ts`)
- [ ] Archive rollout artifacts
- [ ] Conduct retrospective meeting

---

## Appendix

### SQL Query Cheat Sheet

```bash
# Connect to database
export PGPASSWORD='tHFJ-D.+W+jD6U-'
psql "postgresql://postgres.mqtchcaavsucsdjskptc:tHFJ-D.+W+jD6U-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

# Quick health check
\i tasks/assignment-pipeline-v3-rollout-20251113-0932/artifacts/observability-queries.sql

# Or inline
SELECT event_type, count(*), ROUND(100.0 * count(*) FILTER (WHERE context->>'reason' IS NULL) / NULLIF(count(*), 0), 2) AS success_pct
FROM observability_events
WHERE source = 'assignment.coordinator' AND created_at >= now() - INTERVAL '6 hours'
GROUP BY 1;
```

### Emergency Rollback Command

```bash
# Production emergency rollback
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 production  # false
vercel --prod

# Staging emergency rollback
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 preview  # false
vercel --target preview
```

---

## Known Issues

- Full `pnpm test:ops` suite already red on main; see failure list above in Test Outcomes. No new regressions detected in targeted coordinator tests.

---

## Sign-Off

### Implementation Sign-Off

- [ ] Engineering (Pre-implementation tests passed)
- [ ] Design/PM (Documentation reviewed)
- [ ] QA (Coordinator tests verified)

### Rollout Sign-Off (Post-Production Success)

- [ ] Implementation Lead - Date: **\_\_\_**
- [ ] Engineering Manager - Date: **\_\_\_**
- [ ] Operations Lead - Date: **\_\_\_**
