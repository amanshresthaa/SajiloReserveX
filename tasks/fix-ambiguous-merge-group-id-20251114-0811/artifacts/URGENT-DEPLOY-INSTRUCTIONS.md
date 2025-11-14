# 🚨 URGENT: Deploy SQL Hotfix to Supabase

## Problem

Your booking flow is failing with:

```
column reference "merge_group_id" is ambiguous
```

The local code has been fixed, but **Supabase still has the old function**.

## ✅ Solution: Deploy via Supabase Dashboard

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Log in to your account
3. Select your **SajiloReserveX** project
4. Click **SQL Editor** in the left sidebar

### Step 2: Run the Hotfix Script

1. Click **New Query** button
2. Copy the ENTIRE contents of this file:
   ```
   tasks/fix-ambiguous-merge-group-id-20251114-0811/artifacts/hotfix-deploy.sql
   ```
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd+Enter)

### Step 3: Verify Success

You should see output like:

```
function_name                  | has_qualified_reference
-------------------------------|------------------------
confirm_hold_assignment_tx     | t
```

The `t` (true) confirms the fix is applied.

### Step 4: Test Your Booking Flow

1. Go back to your running dev server: http://localhost:3000
2. Navigate to `/reserve/r/white-horse-pub-waterbeach`
3. Submit a test booking
4. Watch the server logs - you should now see:
   ```
   ✅ [bookings][POST][inline-auto-assign] assignment confirmed
   ```
   Instead of:
   ```
   ❌ [bookings][POST][inline-auto-assign] confirm error: column reference "merge_group_id" is ambiguous
   ```

### Step 5: Verify Database Records

Run this in Supabase SQL Editor:

```sql
-- Get your most recent booking
SELECT
  b.id,
  b.status,
  b.created_at,
  COUNT(bta.id) as table_assignments,
  COUNT(a.id) as allocations
FROM bookings b
LEFT JOIN booking_table_assignments bta ON bta.booking_id = b.id
LEFT JOIN allocations a ON a.booking_id = b.id
WHERE b.created_at > NOW() - INTERVAL '10 minutes'
GROUP BY b.id, b.status, b.created_at
ORDER BY b.created_at DESC
LIMIT 5;
```

✅ Success indicators:

- `table_assignments > 0`
- `allocations > 0`
- `status = 'confirmed'`

## 🎯 Quick Check

Before deploying:

- [ ] Supabase dashboard is open
- [ ] You're in the SQL Editor
- [ ] You have the hotfix script ready to paste

After deploying:

- [ ] Function updated (verification query returns `t`)
- [ ] Test booking submitted
- [ ] Logs show "assignment confirmed"
- [ ] Database has assignment records

## ⏱️ Time Required

- Deploy: 2 minutes
- Test: 3 minutes
- Total: ~5 minutes

## 🆘 If Still Failing

1. Check which environment variable points to your Supabase:

   ```bash
   grep SUPABASE_URL .env.local
   ```

2. Make sure you deployed to the correct project

3. Check Supabase logs for detailed errors:
   - Dashboard → Logs → Select your project
   - Filter by "Error" level

4. Verify the function exists:
   ```sql
   SELECT proname FROM pg_proc
   WHERE proname = 'confirm_hold_assignment_tx';
   ```
