# Quick Deployment Guide

## ✅ Code Changes Complete

Both SQL files have been fixed with qualified `merge_group_id` references:

- ✅ Migration: `supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql:274`
- ✅ Schema: `supabase/schema.sql:1597`
- ✅ Process cleanup: Stale Next.js processes killed, lock file removed

## 🚀 Next Steps (REQUIRED)

### Step 1: Deploy to Supabase Remote Environment

⚠️ **IMPORTANT**: Per AGENTS.md, use REMOTE ONLY. Never run local Supabase.

**Option A: Using Supabase CLI**

```bash
# Preview changes
supabase db push --dry-run

# Apply to remote environment (staging first)
supabase db push
```

**Option B: Using Supabase Dashboard**

1. Log in to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Database > Migrations**
4. Click **Run migrations** or manually execute the updated function

**Option C: Direct SQL Execution**

1. Go to Supabase **SQL Editor**
2. Copy the updated function from the migration file
3. Execute to replace the existing function

### Step 2: Restart Dev Server

```bash
cd /Users/amankumarshrestha/Downloads/SajiloReserveX
pnpm run dev
```

The server should start cleanly now (no lock errors).

### Step 3: Test the Fix

1. **Navigate to /reserve** in your browser
2. **Submit a test booking**
3. **Check server logs** for this message:
   - ✅ Success: `"assignment confirmed"`
   - ❌ Failure: `"strict hold enforcement"` or SQL errors

4. **Verify database records**:

   ```sql
   -- Get your test booking ID from the booking creation response

   -- Check assignments were created
   SELECT * FROM booking_table_assignments
   WHERE booking_id = '<your-test-booking-id>';

   -- Check allocations were created
   SELECT * FROM allocations
   WHERE booking_id = '<your-test-booking-id>';

   -- Verify merge_group_id in outbox
   SELECT
     event_type,
     payload->>'mergeGroupId' as merge_group_id,
     payload->>'bookingId' as booking_id
   FROM capacity_outbox
   WHERE booking_id = '<your-test-booking-id>'
   ORDER BY created_at DESC;
   ```

### Step 4: Monitor for Issues

Watch for these indicators:

- ✅ No "ambiguous column" errors in Supabase logs
- ✅ Bookings proceeding to "confirmed" status
- ✅ Table assignments showing up in database
- ✅ Allocations being created correctly

## 🔄 If Issues Persist

If you still see errors after deployment:

1. **Check Supabase logs** in the dashboard for detailed error messages
2. **Verify the migration was applied**:
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations
   WHERE version = '20251113203000';
   ```
3. **Manually verify the function definition**:

   ```sql
   SELECT pg_get_functiondef(oid)
   FROM pg_proc
   WHERE proname = 'confirm_hold_assignment_tx';
   ```

   - Look for `tmp.merge_group_id` in the output

4. **Rollback if needed**:
   - Supabase has automatic PITR (point-in-time recovery)
   - Or manually redeploy previous function version

## 📝 Task Documentation

Full documentation available in:

```
tasks/fix-ambiguous-merge-group-id-20251114-0811/
├── research.md         # Problem analysis
├── plan.md            # Implementation plan
├── todo.md            # Checklist (update as you go)
├── verification.md    # Test results (fill in after testing)
└── artifacts/
    └── fix-summary.txt
```

## ⏱️ Estimated Time

- Deployment: 2-5 minutes
- Testing: 5-10 minutes
- Total: ~15 minutes

## 🎯 Success Criteria

- [x] SQL files fixed
- [x] Process cleanup done
- [ ] Migration deployed to Supabase remote
- [ ] Dev server running
- [ ] Test booking succeeds with "assignment confirmed"
- [ ] Database records created correctly
