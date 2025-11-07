# 🚀 Tenant RLS Quick Start Guide

## Status: Phase 1 Complete ✅

- ✅ Migration scripts ready
- ✅ Smoke test scripts ready
- ✅ Critical booking APIs converted
- ✅ Build passing
- ⏳ **Ready for staging deployment**

---

## Next Steps (Copy & Paste Ready)

### 1️⃣ Set Environment Variables

```bash
# Staging database connection string
export SUPABASE_STAGING_DB_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Staging API base URL
export STAGING_BASE_URL="https://staging.yourdomain.com"

# Optional: Auth token for smoke tests
export AUTH_TOKEN="your-staging-jwt-token"
```

### 2️⃣ Apply Migrations to Staging

```bash
cd /Users/amankumarshrestha/Downloads/SajiloReserveX

# Review what will be applied
cat supabase/migrations/20251107093000_capacity_outbox_indexes.sql
cat supabase/migrations/20251107094000_tenant_rls_foundation.sql

# Apply migrations
./scripts/apply-tenant-rls-migrations.sh staging

# Expected output:
# ✅ Migration 20251107093000_capacity_outbox_indexes.sql applied
# ✅ Migration 20251107094000_tenant_rls_foundation.sql applied
# ✅ Verification: set_restaurant_context function exists
```

### 3️⃣ Deploy Code to Staging

```bash
# (Use your standard deployment process)
# Example:
git add .
git commit -m "feat: add tenant RLS isolation for booking APIs"
git push origin main

# Or Vercel/Netlify deployment
```

### 4️⃣ Run Smoke Tests

```bash
# After code is deployed to staging
./scripts/smoke-test-tenant-rls.sh staging

# Expected output:
# ✅ Test 1: Manual hold within tenant - PASSED
# ✅ Test 2: Cross-tenant hold blocked - PASSED
# ✅ Test 3: Auto hold within tenant - PASSED
# ✅ Test 4: Confirm booking - PASSED
# ✅ Test 5: Tenant-filtered queries - PASSED
# ✅ Test 6: RLS context function - PASSED
# 📊 All tests passed! ✅
```

### 5️⃣ Manual QA (Critical)

```bash
# Test same-tenant booking update
curl -X PATCH "https://staging.yourdomain.com/api/ops/bookings/BOOKING_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startIso": "2025-11-15T19:00:00Z",
    "partySize": 4,
    "notes": "Updated via API"
  }'

# Expected: 200 OK with updated booking data

# Test cross-tenant attempt (should fail)
# (Switch to a different restaurant context and try to update the same booking)
# Expected: 404 Not Found
```

### 6️⃣ Monitor Staging (24-48 Hours)

```bash
# Check error rates
# (Use your observability dashboard)

# Check latency
# Compare p95 latency before/after deployment

# Check logs for RLS errors
# grep "42501" staging-logs.txt  # PostgreSQL permission denied
# (Should be 0 occurrences for legitimate operations)
```

### 7️⃣ Production Deployment (When Staging Clear)

```bash
# Set production environment variables
export SUPABASE_PRODUCTION_DB_URL="postgresql://postgres.YOUR_PROD_PROJECT:PASSWORD@..."

# Apply migrations to production
./scripts/apply-tenant-rls-migrations.sh production
# ⚠️ WILL ASK FOR CONFIRMATION - Type "yes" to proceed

# Deploy code to production
# (Use your standard deployment process)

# Monitor closely for 7 days
```

---

## Emergency Rollback

### If Something Goes Wrong

```bash
# Connect to database
psql "$SUPABASE_STAGING_DB_URL"

# Drop RLS policies
DROP POLICY IF EXISTS tenant_isolation_select ON bookings;
DROP POLICY IF EXISTS tenant_isolation_insert ON bookings;
DROP POLICY IF EXISTS tenant_isolation_update ON bookings;
DROP POLICY IF EXISTS tenant_isolation_delete ON bookings;

# Revert code
git revert HEAD
git push origin main

# Redeploy
```

---

## Key Files Reference

| File                                                           | Purpose               |
| -------------------------------------------------------------- | --------------------- |
| `scripts/apply-tenant-rls-migrations.sh`                       | Apply RLS migrations  |
| `scripts/smoke-test-tenant-rls.sh`                             | Automated smoke tests |
| `tasks/tenant-rls-foundation-20251107-1430/research.md`        | Why we did this       |
| `tasks/tenant-rls-foundation-20251107-1430/plan.md`            | How we did this       |
| `tasks/tenant-rls-foundation-20251107-1430/verification.md`    | Test scenarios        |
| `tasks/tenant-rls-foundation-20251107-1430/summary.md`         | Full summary          |
| `supabase/migrations/20251107094000_tenant_rls_foundation.sql` | RLS migration         |

---

## What Changed (Technical Summary)

**Before**:

```typescript
const serviceSupabase = getServiceSupabaseClient();
const updated = await updateBookingRecord(serviceSupabase, bookingId, {...});
```

**After**:

```typescript
const tenantClient = getTenantServiceSupabaseClient(existingBooking.restaurant_id);
const updated = await updateBookingRecord(tenantClient, bookingId, {...});
```

**Impact**: Database now enforces tenant boundaries via RLS policies + session context.

---

## Success Metrics

- ✅ Build passing
- ⏳ Smoke tests passing (run in staging)
- ⏳ Manual QA passing (same-tenant ✓, cross-tenant blocked ✓)
- ⏳ Latency increase < 10%
- ⏳ Error rate increase < 0.1%
- ⏳ Zero cross-tenant data leaks detected
- ⏳ 7-day production monitoring clean

---

## Questions?

See full documentation:

- `tasks/tenant-rls-foundation-20251107-1430/plan.md` (design decisions)
- `tasks/tenant-rls-foundation-20251107-1430/verification.md` (test scenarios)
- `tasks/tenant-rls-foundation-20251107-1430/summary.md` (comprehensive summary)

---

**Ready to deploy?** Start with Step 1 above! 🚀
