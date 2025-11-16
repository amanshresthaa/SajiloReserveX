# Migration Application Plan

**Migration**: `20251116_fix_unassign_tables_atomic.sql`  
**Date**: 2025-11-16  
**Environment**: Production (remote Supabase)  
**Project**: mqtchcaavsucsdjskptc

## Objective

Fix the `unassign_tables_atomic` function to properly handle table unassignment and cleanup of allocations and table inventory status.

## Pre-Migration State

- Existing version of `unassign_tables_atomic` may have issues with proper cleanup
- Dry-run confirms only this migration will be applied

## Migration Contents

The migration creates/replaces the `unassign_tables_atomic` function with:

- Proper handling of NULL or empty table_ids array
- Deletion from `booking_table_assignments`
- Cleanup of related `allocations` records
- Update of `table_inventory` status to 'available' when no longer assigned

## Rollback Plan

If issues arise:

1. The function can be rolled back by restoring the previous version
2. No schema changes are made - only function definition update
3. Safe to revert by re-running previous function definition

## Risk Assessment

- **Risk Level**: Low
- **Impact**: Updates stored procedure only, no data migration
- **Reversibility**: High - function can be easily replaced

## Verification Steps

After migration:

1. Verify function exists: `SELECT proname FROM pg_proc WHERE proname = 'unassign_tables_atomic'`
2. Test function with a test booking
3. Monitor logs for any errors
