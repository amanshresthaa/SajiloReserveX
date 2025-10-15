# Deployment Guide

**Task**: route-versioning-auth-cleanup-20251015-0704  
**Phase**: 7 - Deployment & Verification  
**Status**: Ready for deployment  
**Date**: 2025-01-15

---

## Prerequisites Checklist

Before deploying, ensure:

- [ ] All code reviewed and approved
- [ ] Tests written and passing locally
- [ ] Database migration reviewed
- [ ] Team notified of breaking change (staff permissions)
- [ ] Rollback plan understood
- [ ] Deployment window scheduled (low-traffic time recommended)

---

## Phase 1: Pre-Deployment

### 1.1 Verify Current State

```bash
# Confirm on main branch
git status
git branch --show-current  # Should be: main

# Confirm all changes committed
git status --porcelain  # Should be clean or show only expected files

# Review all changes
git log --oneline -10
```

### 1.2 Notify Team

**Message Template** (post to team channel):

```
🚀 Deployment Notification: Route Versioning & Auth Hardening

Deployment Window: [Date/Time]
Estimated Downtime: None (zero-downtime deployment)

Changes:
1. New /api/v1/restaurants routes (backward compatible)
2. Guest booking confirmation (no auth required)
3. Owner route permissions tightened (breaking change)

⚠️ Breaking Change:
Staff members will no longer be able to modify:
- Restaurant details (name, slug, timezone, etc.)
- Operating hours
- Service periods

These operations now require Owner or Admin role.

Action Required:
- If you're a staff member and need these permissions, request role upgrade
- If you encounter 403 errors on restaurant settings, this is expected

Migration:
- Database schema changes will be applied
- No data loss expected
- Rollback available if issues arise

Questions? Reply in thread or DM [Your Name]
```

### 1.3 Backup Database

```bash
# Backup via Supabase CLI
npx supabase db dump --remote > backup-$(date +%Y%m%d-%H%M).sql

# Or via Supabase Dashboard:
# Project → Database → Backups → Create Manual Backup
```

---

## Phase 2: Apply Database Migration (Staging)

### 2.1 Connect to Staging

```bash
# Set Supabase project (staging)
export SUPABASE_PROJECT_ID="your-staging-project-id"
export SUPABASE_DB_PASSWORD="your-staging-password"
```

### 2.2 Apply Migration

```bash
# Navigate to project root
cd /path/to/SajiloReserveX

# Apply migration to staging (remote)
npx supabase db push --remote

# Expected output:
# Applying migration: 20250115071800_add_booking_confirmation_token.sql
# ✓ Migration applied successfully
```

**If migration fails**:

- Check error message carefully
- Verify no conflicting columns exist
- Try rollback and reapply:

  ```bash
  # Apply rollback
  psql $DATABASE_URL -f supabase/migrations/20250115071800_add_booking_confirmation_token_rollback.sql

  # Fix issue, then reapply
  npx supabase db push --remote
  ```

### 2.3 Verify Schema Changes

```bash
# Connect to staging database
psql $DATABASE_URL

# Verify columns added
\d bookings

# Expected output should include:
#   confirmation_token              | text                     |
#   confirmation_token_expires_at   | timestamp with time zone |
#   confirmation_token_used_at      | timestamp with time zone |

# Check unique constraint
\d bookings_confirmation_token_key

# Check partial index
\d bookings_active_confirmation_token_idx
```

**Verification SQL**:

```sql
-- Check column existence
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name LIKE 'confirmation_token%';

-- Expected:
-- confirmation_token              | text                     | YES
-- confirmation_token_expires_at   | timestamp with time zone | YES
-- confirmation_token_used_at      | timestamp with time zone | YES

-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'bookings'
  AND constraint_name = 'bookings_confirmation_token_key';

-- Expected: bookings_confirmation_token_key | UNIQUE

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bookings'
  AND indexname = 'bookings_active_confirmation_token_idx';

-- Expected: partial index on (confirmation_token) WHERE confirmation_token_used_at IS NULL
```

### 2.4 Regenerate TypeScript Types

```bash
# Generate types from staging database
npx supabase gen types typescript --remote > types/supabase.ts

# Verify types include new columns
grep "confirmation_token" types/supabase.ts

# Expected output:
# confirmation_token: string | null
# confirmation_token_expires_at: string | null
# confirmation_token_used_at: string | null
```

**Commit type changes**:

```bash
git add types/supabase.ts
git commit -m "chore: regenerate types after confirmation token migration"
```

---

## Phase 3: Deploy Code to Staging

### 3.1 Deploy Application

**If using Vercel**:

```bash
# Deploy to staging
vercel deploy --target=staging

# Or via git push (if auto-deploy configured)
git push origin staging
```

**If using other platform**:

- Follow your platform's deployment process
- Ensure environment variables are set
- Verify build succeeds

### 3.2 Verify Deployment

```bash
# Check deployment status
curl -I https://staging.yourdomain.com/api/health
# Expected: 200 OK

# Verify v1 routes exist
curl https://staging.yourdomain.com/api/v1/restaurants
# Expected: JSON response with restaurants

# Verify confirmation endpoint exists
curl https://staging.yourdomain.com/api/bookings/confirm?token=invalid
# Expected: 404 or 400 (not 500)

# Verify test endpoints are gated (should still work in staging)
curl https://staging.yourdomain.com/api/test/bookings
# Expected: 400 (needs body) or 200 (if staging ENV is 'development')
```

---

## Phase 4: Smoke Test on Staging

### 4.1 Manual Testing

**Test 1: Create Booking with Token**

```bash
# Create booking
curl -X POST https://staging.yourdomain.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "<valid-restaurant-id>",
    "date": "2025-01-25",
    "time": "19:00",
    "partySize": 2,
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "+1234567890"
  }'

# Expected response should include:
# {
#   "booking": { "id": "...", "reference": "..." },
#   "confirmationToken": "64-char-string"
# }

# Save the confirmationToken for next test
```

**Test 2: Use Confirmation Token**

```bash
# Visit confirmation page
open "https://staging.yourdomain.com/thank-you?token=<confirmationToken>"

# Expected:
# - Loading spinner initially
# - Booking details displayed (reference, date, time, party size)
# - NO customer email or phone visible
# - Success state UI
```

**Test 3: Try Token Again (Should Fail)**

```bash
# Revisit same URL
open "https://staging.yourdomain.com/thank-you?token=<confirmationToken>"

# Expected:
# - "This confirmation has already been viewed" message
# - 410 Gone status (check Network tab)
```

**Test 4: Staff Permission Check**

```bash
# Login as staff user
# Navigate to restaurant settings
# Try to modify restaurant details

# Expected:
# - 403 Forbidden error
# - User notified they don't have permission
```

**Test 5: Owner Permission Check**

```bash
# Login as owner/admin user
# Navigate to restaurant settings
# Modify restaurant details

# Expected:
# - Changes saved successfully
# - No 403 errors
```

### 4.2 Automated Testing

```bash
# Run E2E tests against staging
PLAYWRIGHT_BASE_URL=https://staging.yourdomain.com npm run test:e2e

# Or specific test suites
npm run test:e2e -- tests/e2e/bookings/confirmation.spec.ts
npm run test:e2e -- tests/e2e/ops/restaurant-settings.spec.ts
```

### 4.3 Log Review

```bash
# Check for errors in staging logs
# (Using Vercel as example, adapt to your platform)

vercel logs https://staging.yourdomain.com --since=10m

# Look for:
# - No 500 errors
# - Expected 403 errors from staff users (auth hardening working)
# - Confirmation token generation and validation
# - Auth warning logs with structured context
```

**Expected Log Patterns**:

```
[auth:role] Insufficient permissions {userId: "...", restaurantId: "...", requiredRoles: ["owner","admin"], actualRole: "staff"}
[bookings] Token generated {bookingId: "...", expiresAt: "..."}
[bookings] Token validated {bookingId: "...", reference: "..."}
```

---

## Phase 5: Deploy to Production

### 5.1 Final Checklist

- [ ] All staging tests passed
- [ ] No critical errors in staging logs
- [ ] Team notified (final reminder)
- [ ] Database backup completed
- [ ] Rollback plan ready
- [ ] Monitoring dashboard open

### 5.2 Apply Migration to Production

```bash
# Connect to production
export SUPABASE_PROJECT_ID="your-production-project-id"

# Apply migration (same as staging)
npx supabase db push --remote

# Verify (same SQL queries as staging)
# ... (see Phase 2.3)

# Regenerate types (if needed)
npx supabase gen types typescript --remote > types/supabase.ts
```

### 5.3 Deploy Application Code

```bash
# Deploy to production
vercel deploy --prod

# Or via git push
git push origin main  # If auto-deploy configured
```

### 5.4 Immediate Verification (5 minutes)

```bash
# Health check
curl -I https://yourdomain.com/api/health
# Expected: 200 OK

# Test endpoints should be GATED in production
curl https://yourdomain.com/api/test/bookings
# Expected: 404 {"error":"Not available"}

# V1 routes should work
curl https://yourdomain.com/api/v1/restaurants
# Expected: JSON response

# Confirm endpoint exists
curl https://yourdomain.com/api/bookings/confirm?token=invalid
# Expected: 404 or 400 (not 500)
```

### 5.5 Create Test Booking (Production)

**Option A: Via UI** (recommended):

1. Visit your booking page
2. Create a real booking (use your own email)
3. Check email for confirmation link
4. Click link → verify booking details displayed
5. Try link again → verify "already viewed" message

**Option B: Via API**:

```bash
# Create real booking
curl -X POST https://yourdomain.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "<valid-restaurant-id>",
    "date": "2025-01-25",
    "time": "19:00",
    "partySize": 2,
    "customerName": "Your Name",
    "customerEmail": "your-email@example.com",
    "customerPhone": "+1234567890"
  }'

# Get confirmationToken from response
# Visit /thank-you?token=...
# Verify details displayed
```

---

## Phase 6: Post-Deployment Monitoring

### 6.1 First Hour

**Watch for**:

- Error rate spike (should be minimal)
- 403 rate increase (expected initially, should stabilize)
- Customer complaints about confirmation page
- Staff reports of 403 errors (expected, provide support)

**Metrics to Track**:

```bash
# 403 rate
curl "https://your-monitoring-tool.com/api/metrics?metric=http_403_rate&window=1h"
# Expected: < 5% (initial spike, then drop)

# Error rate
curl "https://your-monitoring-tool.com/api/metrics?metric=http_5xx_rate&window=1h"
# Expected: < 0.1% (no change from baseline)

# Confirmation endpoint usage
curl "https://your-monitoring-tool.com/api/metrics?metric=endpoint_requests&path=/api/bookings/confirm&window=1h"
# Expected: Proportional to booking volume
```

**Log Review**:

```bash
# Check production logs
vercel logs https://yourdomain.com --since=1h

# Look for:
# - Auth warning logs (staff trying to access owner routes)
# - Token validation (successes and expected failures)
# - No unexpected errors
```

### 6.2 First 24 Hours

**Daily Checks**:

- [ ] Review 403 rate (should stabilize to < 2%)
- [ ] Check auth failure logs for patterns
- [ ] Verify no customer complaints about confirmation
- [ ] Confirm staff have been notified and understand changes
- [ ] Review any support tickets related to permissions

**Queries to Run**:

```sql
-- Count confirmation token usage (should match new bookings)
SELECT
  COUNT(*) as total_bookings,
  COUNT(confirmation_token) as with_token,
  COUNT(confirmation_token_used_at) as tokens_used
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check for expired unused tokens (users didn't click link)
SELECT COUNT(*) as expired_unused
FROM bookings
WHERE confirmation_token IS NOT NULL
  AND confirmation_token_used_at IS NULL
  AND confirmation_token_expires_at < NOW()
  AND created_at > NOW() - INTERVAL '24 hours';

-- Auth failures by role
SELECT
  actual_role,
  COUNT(*) as denial_count
FROM auth_logs
WHERE
  message LIKE '%[auth:role]%'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY actual_role;
```

### 6.3 First Week

**Weekly Review**:

- [ ] Confirmation token usage rate (% of bookings confirmed)
- [ ] Auth failure rate stabilized
- [ ] No security incidents
- [ ] Staff adapted to new permissions
- [ ] Update team on success metrics

**Metrics to Present**:

- Total bookings created
- % of bookings confirmed via token
- Auth failure rate (baseline vs current)
- Zero security incidents
- Customer satisfaction (if available)

---

## Phase 7: Rollback Plan

### 7.1 When to Rollback

**Rollback immediately if**:

- Critical security vulnerability discovered
- Widespread 500 errors (> 1% error rate)
- Data corruption detected
- Complete feature failure (confirmation page not working)

**Consider rollback if**:

- High customer complaint rate (> 10% of users)
- Unexpected auth failures (staff can't access necessary features)
- Performance degradation (> 2x latency increase)

**DO NOT rollback for**:

- Expected 403 errors (staff trying to access owner routes)
- Individual customer issues (can be resolved via support)
- Minor UI bugs (can be fixed with hotfix)

### 7.2 Rollback Steps

**Step 1: Revert Code Deployment**

```bash
# Find previous deployment
vercel ls

# Rollback to previous version
vercel rollback <previous-deployment-url>

# Or via git revert
git revert <commit-hash>
git push origin main
```

**Step 2: Verify Code Rollback**

```bash
# Check if old code is running
curl https://yourdomain.com/api/v1/restaurants
# Should return 404 (v1 routes don't exist in old version)

# Confirm endpoint should not exist
curl https://yourdomain.com/api/bookings/confirm
# Should return 404
```

**Step 3: Database Rollback (if necessary)**

⚠️ **WARNING**: Only rollback database if data corruption occurred. This will:

- Drop confirmation_token columns (data loss)
- May affect bookings created during deployment

```bash
# Connect to production database
psql $DATABASE_URL

# Apply rollback migration
\i supabase/migrations/20250115071800_add_booking_confirmation_token_rollback.sql

# Verify columns dropped
\d bookings
# confirmation_token columns should be gone
```

**Step 4: Verify Rollback**

```bash
# Test booking creation (should work without token)
curl -X POST https://yourdomain.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# Response should NOT include confirmationToken

# Owner routes should allow staff again
# (Test via UI or API)
```

**Step 5: Notify Team**

```
🔄 Rollback Notification

Deployment has been rolled back to previous version.

Reason: [Brief explanation]

Impact:
- Features removed: [List]
- Permissions restored: [List]

Next Steps:
- Root cause analysis
- Fix and redeploy: [Timeline]

Questions? [Contact info]
```

### 7.3 Post-Rollback Actions

- [ ] Document rollback reason in incident log
- [ ] Root cause analysis (RCA)
- [ ] Fix issues identified
- [ ] Test fixes thoroughly on staging
- [ ] Reschedule deployment

---

## Phase 8: Success Criteria

### 8.1 Acceptance Criteria (All Must Pass)

| Criterion                                     | Status | Verification Method                                   |
| --------------------------------------------- | ------ | ----------------------------------------------------- |
| `/api/v1/restaurants` returns restaurant list | ☐      | `curl https://yourdomain.com/api/v1/restaurants`      |
| Guest can confirm booking via token           | ☐      | Create booking → click link → see details             |
| Token expires after 1 hour                    | ☐      | Wait 1 hour → try link → see expired message          |
| Token is one-time use                         | ☐      | Use token twice → second attempt fails                |
| Staff cannot modify restaurant details        | ☐      | Login as staff → try to modify → get 403              |
| Owner can modify restaurant details           | ☐      | Login as owner → modify → success                     |
| Test endpoints gated in production            | ☐      | `curl https://yourdomain.com/api/test/bookings` → 404 |
| Auth failures logged with context             | ☐      | Check logs for `[auth:role]` entries                  |
| No customer PII in confirmation page URL      | ☐      | Inspect URL → only token, no email/phone              |
| No 500 errors in logs                         | ☐      | Review logs for error rate                            |

### 8.2 Performance Benchmarks

| Metric                       | Target         | Actual | Status |
| ---------------------------- | -------------- | ------ | ------ |
| Confirmation page load time  | < 2s           | \_\_\_ | ☐      |
| Token validation latency     | < 100ms        | \_\_\_ | ☐      |
| 403 rate after stabilization | < 2%           | \_\_\_ | ☐      |
| Error rate (5xx)             | < 0.1%         | \_\_\_ | ☐      |
| Database query performance   | No degradation | \_\_\_ | ☐      |

### 8.3 Sign-off

- [ ] Engineering lead approved
- [ ] QA testing complete
- [ ] Product owner sign-off
- [ ] Security review passed
- [ ] All acceptance criteria met
- [ ] No critical issues in logs
- [ ] Team trained on new permissions

---

## Contact Information

**Deployment Lead**: [Your Name]
**On-Call Engineer**: [Name/PagerDuty]
**Slack Channel**: #deployments
**Emergency Contact**: [Phone/Email]

---

## Appendix: Environment Variables

### Required for Deployment

| Variable                        | Purpose              | Example                   |
| ------------------------------- | -------------------- | ------------------------- |
| `DATABASE_URL`                  | Supabase connection  | `postgresql://...`        |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase API         | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key       | `eyJ...`                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-side admin    | `eyJ...`                  |
| `MAILGUN_WEBHOOK_SIGNING_KEY`   | Webhook verification | `abc123...`               |
| `INNGEST_SIGNING_KEY`           | Inngest verification | `xyz789...`               |

### Verification

```bash
# Check all required env vars are set
node -e "
  const required = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  required.forEach(key => {
    if (!process.env[key]) {
      console.error('Missing:', key);
    } else {
      console.log('✓', key);
    }
  });
"
```

---

**End of Deployment Guide**
