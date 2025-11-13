# Assignment Pipeline V3 - Staging Rollout Commands

## Prerequisites

1. Authenticate with Vercel CLI:

   ```bash
   vercel login
   ```

2. Ensure you're in the project directory:

   ```bash
   cd /Users/amankumarshrestha/Downloads/SajiloReserveX
   ```

3. Link to your Vercel project (if not already linked):
   ```bash
   vercel link
   ```

---

## Phase 1: Shadow Mode (Staging)

### Step 1: Set Shadow Mode Environment Variables

Run these commands to enable shadow mode in staging:

```bash
# Enable shadow mode (coordinator stays idle but flags document intent)
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 preview
# When prompted, enter: false

vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW preview
# When prompted, enter: true

vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL preview
# When prompted, enter: 3
```

### Step 2: Deploy to Staging

```bash
# Trigger a new deployment to staging
vercel --target preview

# Or if you prefer to deploy a specific branch:
# git checkout staging  # or your staging branch
# git push origin staging
```

### Step 3: Verify Deployment

After deployment completes (check Vercel dashboard or CLI output):

```bash
# Get the preview URL from the deployment
vercel ls

# Verify the app still uses legacy routing
# Check that bookings route through the legacy planner loop
```

### Step 4: Verify Legacy Routing (Optional)

You can manually trigger a booking assignment and verify only `auto_assign.attempt.start` events appear (no `assignment.coordinator.*` events yet):

```bash
# Run the ops assignment script manually
pnpm run assign:loop
```

---

## Phase 2: Full Mode (Staging)

### Step 1: Flip to Full Mode

**IMPORTANT**: Only proceed after Phase 1 looks healthy and you've reviewed metrics!

```bash
# Enable V3 coordinator
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 preview
# When prompted, enter: true

# Disable shadow mode
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW preview
# When prompted, enter: false

# Keep max parallel at 3
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL preview
# When prompted, enter: 3
```

### Step 2: Deploy to Staging

```bash
# Trigger deployment with new flags
vercel --target preview
```

### Step 3: Monitor Observability Events

**Run these SQL queries against your Supabase database to monitor the rollout:**

#### Query 1: Success/Error Ratio (Last 6 Hours)

```sql
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
```

**Expected Results:**

- You should see `assignment.coordinator.*` events appearing
- Success rate should be ≥97%
- Look for events like: `coordinator.start`, `coordinator.confirmed`, `coordinator.retry`, `coordinator.manual_review`

#### Query 2: Retry Reasons + Delays

```sql
SELECT
  context->>'reason' AS reason,
  avg((context->>'delay_ms')::numeric) AS avg_delay_ms,
  count(*) AS retry_count
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND event_type = 'coordinator.retry'
  AND created_at >= now() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY count(*) DESC;
```

#### Query 3: Manual Review Rate by Restaurant

```sql
SELECT
  restaurant_id,
  count(*) FILTER (WHERE event_type = 'coordinator.manual_review') AS manual_reviews,
  count(*) FILTER (WHERE event_type = 'coordinator.confirmed') AS confirmed,
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
```

**Target Metrics:**

- Success rate ≥97%
- Manual review rate <1%

### Step 4: Monitor for 48 Hours

Keep these queries running periodically (every 6-12 hours) for at least 48 hours to ensure stability.

```bash
# Save query results to artifacts folder
psql "$SUPABASE_DB_URL" -f staging-observability-queries.sql > artifacts/staging-phase2-$(date +%Y%m%d-%H%M%S).txt
```

---

## Verification Checklist

- [ ] Phase 1 (shadow): Flags set correctly in Vercel
- [ ] Phase 1: Deployment successful to staging
- [ ] Phase 1: Legacy routing still active (no coordinator events)
- [ ] Phase 2 (full): Flags flipped to enable V3
- [ ] Phase 2: Deployment successful to staging
- [ ] Phase 2: `assignment.coordinator.*` events appearing in observability
- [ ] Phase 2: Success rate ≥97% for 48 hours
- [ ] Phase 2: Manual review rate <1%
- [ ] State machine events continue working (`assignment.state_machine`)
- [ ] No unexpected errors or circuit breaker trips

---

## Rollback Plan (If Needed)

If you encounter issues:

```bash
# Disable V3 immediately
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 preview
# Enter: false

# Disable shadow mode
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW preview
# Enter: false

# Deploy rollback
vercel --target preview

# Verify legacy planner resumes
# Look for auto_assign.attempt.start logs reappearing
```

---

## Next Steps

After staging is stable for 48+ hours with metrics meeting targets:

1. Proceed to production rollout (same phase sequence)
2. Document findings in `verification.md`
3. Create follow-up task to delete legacy planner loop
