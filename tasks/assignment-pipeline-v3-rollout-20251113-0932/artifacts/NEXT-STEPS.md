# Assignment Pipeline V3 Rollout - NEXT STEPS

## ✅ Preparation Complete!

All documentation, SQL queries, and runbooks have been created. The database connection has been tested, and baseline metrics have been captured.

---

## 🚀 Ready to Execute

You are now ready to begin the **Staging Phase 1 (Shadow Mode)** rollout.

---

## Immediate Next Steps (5 minutes)

### 1. Authenticate with Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### 2. Link to Your Project

```bash
cd /Users/amankumarshrestha/Downloads/SajiloReserveX
vercel link
```

Select your project when prompted.

### 3. Verify Connection

```bash
vercel env ls
```

This should list your existing environment variables.

---

## Staging Phase 1: Shadow Mode (30 minutes)

### Set Environment Variables

Run these commands **one at a time** and enter the values as shown:

```bash
# Variable 1
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 preview
# When prompted for value, enter: false

# Variable 2
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW preview
# When prompted for value, enter: true

# Variable 3
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL preview
# When prompted for value, enter: 3
```

### Deploy to Staging

```bash
vercel --target preview
```

Wait for deployment to complete. Note the deployment URL.

### Verify Shadow Mode

After deployment, run this SQL query to confirm no coordinator events appear yet:

```bash
export PGPASSWORD='tHFJ-D.+W+jD6U-'
psql "postgresql://postgres.mqtchcaavsucsdjskptc:tHFJ-D.+W+jD6U-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres" -c "
SELECT source, event_type, count(*)
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND created_at >= now() - INTERVAL '1 hour'
GROUP BY 1, 2
ORDER BY 3 DESC;
"
```

**Expected Result**: Zero rows (no coordinator events yet)

✅ **If you see zero rows**: Shadow mode is working correctly. Proceed to Phase 2.

❌ **If you see coordinator events**: Something is wrong. Check the flag values in Vercel dashboard.

---

## Staging Phase 2: Full Mode (48+ hours)

**⚠️ ONLY proceed after Phase 1 verification is successful!**

### Flip to Full Mode

```bash
# Update the flags to enable V3
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 preview
# Enter: true

vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW preview
# Enter: false

# Deploy
vercel --target preview
```

### Monitor Immediately

Run this query **right after deployment**:

```bash
export PGPASSWORD='tHFJ-D.+W+jD6U-'
psql "postgresql://postgres.mqtchcaavsucsdjskptc:tHFJ-D.+W+jD6U-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres" -c "
SELECT
  event_type,
  count(*) AS total,
  ROUND(100.0 * count(*) FILTER (WHERE context->>'reason' IS NULL) / NULLIF(count(*), 0), 2) AS success_rate_percent
FROM observability_events
WHERE source = 'assignment.coordinator'
  AND created_at >= now() - INTERVAL '1 hour'
GROUP BY 1
ORDER BY 1;
"
```

**Expected Results** (after a few bookings):

- You should see events like `coordinator.start`, `coordinator.confirmed`
- Success rate should be ≥97%

### Monitoring Schedule

Run the above query (or the full query suite from `observability-queries.sql`) at these intervals:

- **T+0h** (deployment): Verify events appearing
- **T+1h**: Check success rate
- **T+6h**: Run full query suite
- **T+12h**: Run full query suite
- **T+24h**: Run full query suite
- **T+48h**: Final verification

Save each query output to the artifacts folder:

```bash
export PGPASSWORD='tHFJ-D.+W+jD6U-'
psql "postgresql://postgres.mqtchcaavsucsdjskptc:tHFJ-D.+W+jD6U-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres" -f tasks/assignment-pipeline-v3-rollout-20251113-0932/artifacts/observability-queries.sql > tasks/assignment-pipeline-v3-rollout-20251113-0932/artifacts/staging-T+6h-$(date +%Y%m%d-%H%M%S).txt
```

---

## Success Criteria for Moving to Production

After **48 hours** of monitoring, verify:

- ✅ Success rate ≥97% sustained
- ✅ Manual review rate <1%
- ✅ No sustained errors or circuit breaker trips
- ✅ State machine transitions working correctly

**If all criteria met**: Proceed to Production Phase 1 (shadow mode)

**If any criteria NOT met**: Investigate issues, fix, and restart staging monitoring

---

## Production Rollout (After Staging Success)

### Production Phase 1: Shadow Mode

```bash
# Set shadow mode in production
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 production
# Enter: false

vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW production
# Enter: true

vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL production
# Enter: 3

# Deploy to production
vercel --prod
```

Monitor for **24 hours** before proceeding to Phase 2.

### Production Phase 2: Full Mode (CRITICAL)

**⚠️ This is the most critical step. Ensure:**

- Engineering team is available
- Rollback plan is ready
- Monitoring is in place

```bash
# Enable V3 in production
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 production
# Enter: true

vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW production
# Enter: false

# Deploy
vercel --prod

# IMMEDIATELY begin intensive monitoring (every 30-60 minutes for first 6 hours)
```

Monitor intensively for **48 hours** before declaring success.

---

## Emergency Rollback (If Needed)

If you encounter issues at any phase:

```bash
# Disable V3 immediately
vercel env add FEATURE_ASSIGNMENT_PIPELINE_V3 [preview|production]
# Enter: false

# Deploy rollback
vercel --target preview  # for staging
# OR
vercel --prod  # for production
```

Then investigate the issue using the captured SQL query outputs.

---

## Reference Documentation

All the detailed documentation you need is in these files:

1. **Quick Reference**: `ROLLOUT-QUICKSTART.md` (this directory)
2. **Staging Detailed Guide**: `staging-rollout-commands.md`
3. **Production Detailed Guide**: `production-rollout-commands.md`
4. **SQL Queries**: `observability-queries.sql` (10 queries)
5. **Main Runbook**: `../docs/assignment-pipeline-rollout.md`
6. **Verification Tracking**: `verification.md`

---

## Key SQL Commands (Quick Copy-Paste)

### Quick Health Check

```bash
export PGPASSWORD='tHFJ-D.+W+jD6U-'
psql "postgresql://postgres.mqtchcaavsucsdjskptc:tHFJ-D.+W+jD6U-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres" -c "SELECT event_type, count(*) AS total, ROUND(100.0 * count(*) FILTER (WHERE context->>'reason' IS NULL) / NULLIF(count(*), 0), 2) AS success_pct FROM observability_events WHERE source = 'assignment.coordinator' AND created_at >= now() - INTERVAL '6 hours' GROUP BY 1;"
```

### Full Query Suite

```bash
export PGPASSWORD='tHFJ-D.+W+jD6U-'
psql "postgresql://postgres.mqtchcaavsucsdjskptc:tHFJ-D.+W+jD6U-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres" -f tasks/assignment-pipeline-v3-rollout-20251113-0932/artifacts/observability-queries.sql
```

---

## Timeline Estimate

| Phase                                    | Estimated Duration |
| ---------------------------------------- | ------------------ |
| Staging Phase 1 (Shadow)                 | 30 minutes         |
| Staging Phase 2 (Full) + Monitoring      | 48 hours           |
| Production Phase 1 (Shadow) + Monitoring | 24 hours           |
| Production Phase 2 (Full) + Monitoring   | 48 hours           |
| **Total**                                | **~5 days**        |

---

## What to Watch For

### Good Signs ✅

- `coordinator.confirmed` events appearing regularly
- Success rate ≥97%
- Manual review rate <1%
- Low retry counts
- No circuit breaker trips

### Warning Signs ⚠️

- Success rate 90-97% (acceptable but investigate)
- Manual review rate 1-5% (higher than ideal)
- Frequent `coordinator.retry` events (check reasons)
- Some `coordinator.lock_contention` events (may indicate concurrency issues)

### Red Flags 🚨

- Success rate <90% (consider rollback)
- Sustained `coordinator.error` events (rollback immediately)
- `coordinator.circuit_open` events (upstream service issues - rollback)
- Customer-reported booking failures

---

## Support

If you encounter issues:

1. Capture the current state with SQL queries
2. Save output to artifacts folder
3. Execute rollback if needed
4. Review the captured telemetry to diagnose

---

## After Successful Production Rollout

Once production has been stable for **1 week** with success rates ≥97%:

1. Update `verification.md` with final metrics
2. Create the legacy cleanup task (delete `server/jobs/auto-assign.ts` legacy loop)
3. Update `.env.example` to reflect V3 as the default

---

## Ready to Begin?

Run these three commands to start:

```bash
# 1. Authenticate
vercel login

# 2. Link project
vercel link

# 3. Check current env vars
vercel env ls
```

Then proceed with **Staging Phase 1** as documented above.

Good luck! 🚀
