# Assignment Pipeline V3 - Production Rollout Commands

⚠️ **IMPORTANT**: Only proceed with production rollout AFTER staging has been stable for 48+ hours with success rates ≥97% and manual review rates <1%.

---

## Prerequisites

1. Verify staging metrics meet thresholds:
   - Success rate ≥97% for 48 hours
   - Manual review rate <1%
   - No sustained errors or circuit breaker trips

2. Ensure rollback plan is ready and tested

3. Schedule rollout during a staffed window with engineering support available

---

## Phase 1: Shadow Mode (Production)

### Step 1: Set Shadow Mode Environment Variables

Run these commands to enable shadow mode in production:

```bash
# Enable shadow mode (coordinator stays idle but flags document intent)
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 production
# When prompted, enter: false

vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW production
# When prompted, enter: true

vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL production
# When prompted, enter: 3
```

### Step 2: Deploy to Production

```bash
# Trigger production deployment
vercel --prod

# Monitor deployment in Vercel dashboard
# Ensure deployment completes successfully
```

### Step 3: Verify Legacy Routing

After deployment:

```bash
# Verify bookings still route through legacy planner
# Check observability_events for only auto_assign.* events
# No assignment.coordinator.* events should appear yet
```

### Step 4: Monitor for 24 Hours

Run observability queries to ensure production is stable before proceeding to Phase 2:

```bash
# Connect to production database
psql "$SUPABASE_DB_URL"

# Run queries from observability-queries.sql
\i tasks/assignment-pipeline-v3-rollout-20251113-0932/artifacts/observability-queries.sql
```

---

## Phase 2: Full Mode (Production)

### ⚠️ Pre-Flight Checklist

Before enabling V3 in production, verify:

- [ ] Staging has been stable for 48+ hours
- [ ] Production shadow mode is healthy (24+ hours)
- [ ] Engineering team is available for monitoring
- [ ] Rollback plan is documented and ready
- [ ] Database monitoring is active
- [ ] Alert channels are configured

### Step 1: Flip to Full Mode

**IMPORTANT**: This is the critical step. Proceed with caution.

```bash
# Enable V3 coordinator in production
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 production
# When prompted, enter: true

# Disable shadow mode
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW production
# When prompted, enter: false

# Start with conservative concurrency
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL production
# When prompted, enter: 3
```

### Step 2: Deploy to Production

```bash
# Deploy with V3 enabled
vercel --prod

# IMMEDIATELY begin monitoring (see Step 3)
```

### Step 3: Intensive Monitoring (First 6 Hours)

Run these queries every 30-60 minutes for the first 6 hours:

```sql
-- Quick health check
SELECT
  event_type,
  count(*) AS total,
  ROUND(
    100.0 * count(*) FILTER (WHERE context->>'reason' IS NULL) /
    NULLIF(count(*), 0),
    2
  ) AS success_rate_percent
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND created_at >= now() - INTERVAL '1 hour'
GROUP BY 1
ORDER BY 1;
```

**Red Flags** (immediate rollback if any occur):

- Success rate drops below 90%
- Sustained `coordinator.error` events
- `coordinator.circuit_open` events appearing frequently
- Manual review rate >5%

### Step 4: Extended Monitoring (48 Hours)

After the first 6 hours, if metrics are healthy:

- Continue monitoring every 6-12 hours
- Run full observability query suite
- Save results to artifacts folder:

```bash
# Capture production metrics
psql "$SUPABASE_DB_URL" -f tasks/assignment-pipeline-v3-rollout-20251113-0932/artifacts/observability-queries.sql > tasks/assignment-pipeline-v3-rollout-20251113-0932/artifacts/production-phase2-$(date +%Y%m%d-%H%M%S).txt
```

### Step 5: Scale Concurrency (Optional)

**ONLY** after 48+ hours of stable operation with success rate ≥97%:

```bash
# Gradually increase concurrency if needed
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL production
# When prompted, enter: 4 (increase by 1 at a time)

# Deploy
vercel --prod

# Monitor for 6+ hours before next increase
# Max recommended: 5 (per runbook)
```

---

## Rollback Plan (CRITICAL)

### Immediate Rollback (If Issues Detected)

```bash
# 1. Disable V3 immediately
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 production
# Enter: false

# 2. Disable shadow mode
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW production
# Enter: false

# 3. Deploy rollback ASAP
vercel --prod

# 4. Verify legacy planner resumes
# Check for auto_assign.attempt.start events reappearing
```

### Post-Rollback Actions

1. Capture error logs:

   ```bash
   psql "$SUPABASE_DB_URL" -c "SELECT * FROM observability_events WHERE source = 'assignment.coordinator' AND event_type = 'coordinator.error' AND created_at >= now() - INTERVAL '1 hour' ORDER BY created_at DESC;" > tasks/assignment-pipeline-v3-rollout-20251113-0932/artifacts/rollback-errors-$(date +%Y%m%d-%H%M%S).txt
   ```

2. File incident report referencing captured data
3. Leave coordinator telemetry on for 30 minutes to ensure no straggling jobs
4. Schedule post-mortem to investigate root cause

---

## Success Criteria

Production rollout is considered successful when:

- [ ] Success rate ≥97% sustained for 48 hours
- [ ] Manual review rate <1%
- [ ] No sustained errors or circuit breaker trips
- [ ] State machine transitions working correctly
- [ ] No customer-reported issues
- [ ] Booking confirmation emails sent properly

---

## Post-Rollout Actions

After production success criteria are met:

1. **Document findings**:
   - Update `verification.md` with production metrics
   - Include query results from artifacts folder
   - Note any issues encountered and resolutions

2. **Create legacy cleanup task**:
   - File follow-up task to delete legacy planner loop
   - Reference: `server/jobs/auto-assign.ts` (while loop + helpers)
   - Scope: Remove `auto_assign.*` telemetry events
   - Cleanup: Unused `server/capacity/planner-*` helpers

3. **Update documentation**:
   - Mark V3 as default in `.env.example`
   - Update architecture docs
   - Remove shadow mode guidance (no longer needed)

---

## Environment Variable Reference

| Variable                                      | Shadow Mode | Full Mode | Production Target           |
| --------------------------------------------- | ----------- | --------- | --------------------------- |
| `FEATURE_ASSIGNMENT_PIPELINE_V3`              | `false`     | `true`    | `true`                      |
| `FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW`       | `true`      | `false`   | `false`                     |
| `FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL` | `3`         | `3`       | Start `3`, scale to `5` max |

---

## Contact & Escalation

If issues arise during production rollout:

1. Immediately execute rollback plan (above)
2. Notify engineering team via established channels
3. Capture all relevant telemetry and logs
4. Do NOT attempt to debug in production - rollback first, investigate later
