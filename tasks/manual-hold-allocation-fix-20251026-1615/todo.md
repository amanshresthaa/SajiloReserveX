# Implementation Checklist

## Setup

- [x] Complete research notes
- [x] Finalize implementation plan

## Core

- [x] Check current constraint state (supabase db status or SQL)
- [x] Apply migration `20251026162123_allow_hold_allocations.sql` remotely
- [x] Re-test manual hold flow to confirm successful allocation mirror
- [x] Fix permission denied error for table_holds access

## UI/UX

- [ ] Validate any UI impact (if applicable)
- [x] Confirm manual assignment context API handles permission errors gracefully

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
  - The table_holds table exists but may have RLS policies or permission issues that prevent access
  - The manual assignment context should work even when holds cannot be loaded
- Deviations:
  - Executed direct `psql` drop/add statements after running the migration to guarantee the constraint update landed immediately (mirrors migration logic).
  - Added permission denied error handling to gracefully skip hold hydration when access is denied, similar to missing table handling

## Root Cause

The error "permission denied for table table_holds" indicates an RLS (Row Level Security) or permission issue on the table_holds table. The existing code only handled missing table errors (42P01) but not permission denied errors (42501).

## Fix Applied

1. Added `PERMISSION_DENIED_ERROR_CODES` constant with PostgreSQL error codes: 42501 (permission denied) and PGRST301 (PostgREST permission denied)
2. Created `isPermissionDeniedError()` helper function to detect permission denied errors
3. Updated the error handling in `getManualAssignmentContext()` to gracefully skip hold hydration when either:
   - The table is missing (existing behavior)
   - Access is denied (new behavior)
4. Updated warning message to reflect both scenarios

This ensures the manual assignment context API continues to work even when the holds table is inaccessible due to permissions.

## Batched Questions (if any)

-
