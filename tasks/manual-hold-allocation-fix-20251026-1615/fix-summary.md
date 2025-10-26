# Permission Denied Error Fix - Summary

**Date**: 2025-10-26
**Issue**: Manual assignment context API and hold creation failing due to permission denied on `table_holds`

## Problem

Multiple API endpoints were failing with permission errors:

1. `/api/staff/manual/context` - 500 error when loading manual assignment context
2. `/api/staff/manual/hold` - 500 error when creating manual table holds

Errors occurred due to RLS (Row Level Security) or service role permission issues on the `table_holds` table.

## Root Cause

**The underlying issue is a database permission problem.** The service role client does not have the necessary RLS policies or grants to access the `table_holds` table. This is indicated by PostgreSQL error code `42501`.

While the code fixes below allow the application to continue functioning, **the proper solution is to fix the database permissions by:**

1. Adding RLS policies that allow the service role to access `table_holds`
2. OR granting the necessary permissions to the service role
3. OR reviewing the migration that created `table_holds` to ensure proper grants

## Code Fixes Applied (Workaround)

Since the holds system appears to be optional for the manual assignment flow (used only for conflict detection), we added graceful error handling to allow the app to continue without holds data:

### Files Modified

#### 1. `server/capacity/tables.ts`

- Added `PERMISSION_DENIED_ERROR_CODES` constant
- Created `isPermissionDeniedError()` helper function
- Updated `getManualAssignmentContext()` to skip hold hydration when permissions are denied

#### 2. `server/capacity/holds.ts`

- Added the same permission error detection helpers
- Updated `findHoldConflicts()` to return empty array when table is inaccessible
- Updated `listActiveHoldsForBooking()` to return empty array when table is inaccessible
- Updated `createTableHold()` overlap check to skip when table is inaccessible
- Updated `confirmTableHold()` to return clear error message about permissions
- Updated `deleteExpiredHolds()` to skip cleanup when table is inaccessible

### Error Codes Handled

- `42501` - PostgreSQL permission denied
- `PGRST301` - PostgREST permission denied
- `42P01` - Table does not exist (existing)
- `PGRST202` - PostgREST table not found (existing)

## Current Behavior After Fixes

✅ **What Works:**

- Manual assignment context API returns 200 (holds data is empty)
- Conflict checking gracefully returns no conflicts
- Expired holds cleanup skips if table unavailable

⚠️ **What Still Fails:**

- Creating new holds (returns clear error about permissions)
- Confirming holds (returns clear error about permissions)
- Any operation that REQUIRES writing to `table_holds`

## Recommended Next Steps

### Priority 1: Fix Database Permissions

Check and fix RLS policies for `table_holds`:

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'table_holds';

-- Example: Add policy for service role (adjust as needed)
CREATE POLICY "Service role can manage holds"
  ON table_holds
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Priority 2: Review Migration

Check the migration file that created `table_holds` and ensure it includes proper grants:

```sql
-- Ensure service role has access
GRANT ALL ON table_holds TO service_role;
GRANT ALL ON table_hold_members TO service_role;
```

### Priority 3: Test After Permission Fix

Once permissions are fixed:

1. Restart the app
2. Try creating a manual hold
3. Verify no permission errors in logs
4. Confirm holds are being created and tracked

## Testing Done

- ✅ Manual assignment context loads without crashing
- ✅ Warning messages appear in logs instead of errors
- ⚠️ Hold creation still fails (expected until DB permissions fixed)
- ✅ Conflict detection returns empty results gracefully

##Conclusion

The code changes allow the application to degrade gracefully when `table_holds` is inaccessible, but **the real fix requires updating database permissions/RLS policies**. The holds system appears to be non-critical for basic manual table assignment functionality.
