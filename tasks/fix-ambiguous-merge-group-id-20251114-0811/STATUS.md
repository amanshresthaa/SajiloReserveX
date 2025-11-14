# Status Update: Fix Ambiguous merge_group_id

## 🎯 Current Status: AWAITING DEPLOYMENT

### ✅ Completed

1. ✅ **SQL Code Fixed** (local files updated)
   - Migration file: `supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql:274`
   - Schema file: `supabase/schema.sql:1597`
   - Change: `merge_group_id` → `tmp.merge_group_id` (qualified reference)

2. ✅ **Process Cleanup Complete**
   - Killed stale Next.js processes (PIDs 81230, 56464)
   - Removed lock file
   - Dev server can start cleanly

3. ✅ **Deployment Artifacts Created**
   - `hotfix-deploy.sql` - Ready-to-run SQL script
   - `URGENT-DEPLOY-INSTRUCTIONS.md` - Step-by-step guide
   - Task documentation complete

### ⏳ Pending (USER ACTION REQUIRED)

**YOU NEED TO: Deploy the SQL to Supabase Remote**

This is a **2-minute task**:

1. Open https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy/paste: `tasks/fix-ambiguous-merge-group-id-20251114-0811/artifacts/hotfix-deploy.sql`
4. Click Run

### 📊 Current Error

Your logs show:

```
[bookings][POST][inline-auto-assign] confirm error {
  error: 'column reference "merge_group_id" is ambiguous'
}
```

This happens because **Supabase is still running the old function**.

### 🎯 Expected After Deployment

Logs will show:

```
[bookings][POST][inline-auto-assign] assignment confirmed ✅
```

And database records will be created:

- ✅ Rows in `booking_table_assignments`
- ✅ Rows in `allocations`
- ✅ Booking status changes to `confirmed`

## 📁 Files Changed

### Local Repository

```
✅ supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql
✅ supabase/schema.sql
```

### Supabase Remote (Needs Deployment)

```
⏳ Function: public.confirm_hold_assignment_tx
   Status: Still has old version with ambiguous reference
   Action: Run hotfix-deploy.sql in Supabase SQL Editor
```

## 🔍 How to Verify Deployment Success

### Option 1: Check Function (SQL)

```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'confirm_hold_assignment_tx'
  AND pronamespace = 'public'::regnamespace;
```

Look for: `tmp.merge_group_id` in the output

### Option 2: Test Booking

1. Submit booking via /reserve
2. Check server logs for "assignment confirmed"
3. No "ambiguous" errors

### Option 3: Query Database

```sql
SELECT COUNT(*) FROM booking_table_assignments
WHERE created_at > NOW() - INTERVAL '5 minutes';
```

Should return > 0 after successful booking

## ⚡ Quick Deploy Command

**No CLI setup needed!** Just use the Supabase dashboard:

1. Dashboard → SQL Editor → New Query
2. Paste script from: `artifacts/hotfix-deploy.sql`
3. Run

That's it! 🎉

## 📞 Support

If you need help:

- See: `artifacts/URGENT-DEPLOY-INSTRUCTIONS.md`
- All task docs: `tasks/fix-ambiguous-merge-group-id-20251114-0811/`

## ⏱️ Timeline

- **00:00** - Issue identified
- **00:05** - Code fixed locally ✅
- **00:10** - Process cleanup done ✅
- **00:15** - Deployment script created ✅
- **NOW** - Waiting for Supabase deployment ⏳
- **+2min** - Deploy to Supabase
- **+5min** - Test and verify
- **DONE** - Bookings working! 🎉
