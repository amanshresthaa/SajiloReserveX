# Assignment Pipeline V3 Rollout - Quick Start Guide

## TL;DR

This rollout follows a **shadow → full** flag sequence for both staging and production, with observability monitoring at each step.

---

## Rollout Sequence

```
STAGING Phase 1 (Shadow)
    ↓ (verify legacy still works)
STAGING Phase 2 (Full)
    ↓ (monitor 48h, verify ≥97% success)
PRODUCTION Phase 1 (Shadow)
    ↓ (verify legacy still works)
PRODUCTION Phase 2 (Full)
    ↓ (monitor 48h, verify ≥97% success)
LEGACY CLEANUP
```

---

## Flag States

### Shadow Mode (Phase 1)

```bash
FEATURE_ASSIGNMENT_PIPELINE_V3=false
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=true
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**Effect**: Flags document intent, but coordinator stays idle. Legacy planner still handles all bookings.

### Full Mode (Phase 2)

```bash
FEATURE_ASSIGNMENT_PIPELINE_V3=true
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**Effect**: Coordinator is live. All new bookings route through Assignment Pipeline V3.

---

## Essential Commands

### 1. Authenticate with Vercel

```bash
vercel login
```

### 2. Set Environment Variables (Example for Staging Shadow)

```bash
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 preview
# Enter: false

vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW preview
# Enter: true

vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL preview
# Enter: 3
```

### 3. Deploy

```bash
# Staging (preview)
vercel --target preview

# Production
vercel --prod
```

### 4. Run Observability Queries

```bash
# Connect to database
export PGPASSWORD='tHFJ-D.+W+jD6U-'
psql "postgresql://postgres.mqtchcaavsucsdjskptc:tHFJ-D.+W+jD6U-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

# Run queries
\i tasks/assignment-pipeline-v3-rollout-20251113-0932/artifacts/observability-queries.sql

# Or run specific query
psql "postgresql://postgres.mqtchcaavsucsdjskptc:tHFJ-D.+W+jD6U-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres" -c "SELECT event_type, count(*) FROM observability_events WHERE source = 'assignment.coordinator' AND created_at >= now() - INTERVAL '6 hours' GROUP BY 1;"
```

### 5. Quick Health Check (Phase 2 Full Mode)

```bash
export PGPASSWORD='tHFJ-D.+W+jD6U-'
psql "postgresql://postgres.mqtchcaavsucsdjskptc:tHFJ-D.+W+jD6U-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres" -c "
SELECT
  event_type,
  count(*) AS total,
  ROUND(100.0 * count(*) FILTER (WHERE context->>'reason' IS NULL) / NULLIF(count(*), 0), 2) AS success_rate_percent
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND created_at >= now() - INTERVAL '6 hours'
GROUP BY 1
ORDER BY 1;
"
```

### 6. Emergency Rollback

```bash
# Set V3 to false
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 production  # or preview
# Enter: false

# Deploy immediately
vercel --prod  # or --target preview
```

---

## Success Criteria

### Phase 1 (Shadow)

- ✅ Flags set correctly
- ✅ Deployment successful
- ✅ Legacy routing still active (no coordinator events)

### Phase 2 (Full)

- ✅ `assignment.coordinator.*` events appearing
- ✅ Success rate ≥97% for 48 hours
- ✅ Manual review rate <1%
- ✅ No sustained errors or circuit breaker trips
- ✅ State machine transitions working

---

## Key Events to Monitor

| Event Type                    | What It Means           | Good/Bad                           |
| ----------------------------- | ----------------------- | ---------------------------------- |
| `coordinator.start`           | Coordinator invoked     | ✅ Expected (one per booking)      |
| `coordinator.confirmed`       | Assignment successful   | ✅ Primary success metric          |
| `coordinator.retry`           | Backoff scheduled       | ⚠️ Monitor reason/frequency        |
| `coordinator.manual_review`   | Escalated to ops        | ⚠️ Should be <1%                   |
| `coordinator.error`           | Unexpected exception    | ❌ Investigate immediately         |
| `coordinator.circuit_open`    | Circuit breaker tripped | ❌ Upstream service issue          |
| `coordinator.lock_contention` | Lock acquisition failed | ⚠️ May indicate concurrency issues |

---

## File Reference

- **Staging commands**: `staging-rollout-commands.md`
- **Production commands**: `production-rollout-commands.md`
- **SQL queries**: `observability-queries.sql`
- **Main runbook**: `docs/assignment-pipeline-rollout.md`

---

## Timeline Estimate

| Phase             | Duration    | Notes                                      |
| ----------------- | ----------- | ------------------------------------------ |
| Staging Shadow    | 30 min      | Quick verification that legacy still works |
| Staging Full      | 48 hours    | Main monitoring period                     |
| Production Shadow | 24 hours    | Conservative pre-check                     |
| Production Full   | 48 hours    | Critical monitoring period                 |
| **Total**         | **~5 days** | Minimum safe rollout time                  |

---

## Decision Points

### After Staging Phase 2 (48h)

**Question**: Are metrics healthy?

- ✅ Yes (success ≥97%, manual <1%) → Proceed to Production Phase 1
- ❌ No → Investigate, fix issues, restart staging rollout

### After Production Phase 1 (24h)

**Question**: Is production shadow mode stable?

- ✅ Yes (no issues in shadow) → Proceed to Production Phase 2
- ❌ No → Hold, investigate differences from staging

### After Production Phase 2 (48h)

**Question**: Are production metrics meeting targets?

- ✅ Yes → Document success, create cleanup task
- ❌ No → Rollback, conduct post-mortem

---

## Emergency Contacts

If critical issues arise:

1. Execute rollback immediately (don't debug in production)
2. Notify engineering team
3. Capture telemetry via SQL queries
4. File incident report with captured data

---

## Next Steps After Successful Rollout

1. ✅ Update `verification.md` with evidence
2. ✅ Create follow-up task: "Delete Legacy Planner Loop"
3. ✅ Update `.env.example` to reflect V3 as default
4. ✅ Archive rollout artifacts for future reference
