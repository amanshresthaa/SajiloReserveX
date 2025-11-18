---
task: booking-manual-assignment-map
timestamp_utc: 2025-11-17T20:17:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

> Backend-focused change; manual UI QA pending.

## Test Outcomes

- [x] Type check: `pnpm -s tsc --noEmit`
- [ ] Additional automated/manual tests pending

## Artifacts

- Lighthouse: `artifacts/lighthouse-report.json`
- Network: `artifacts/network.har`
- Traces/Screens: `artifacts/`
- DB diff (if DB change): `artifacts/db-diff.txt`
- **Migration Verification**: `artifacts/migration-verification-report.md` ✅

## Database Migration Verification

### Migrations Applied to Production (Remote Supabase)

**Environment**: mqtchcaavsucsdjskptc.supabase.co
**Verification Date**: 2025-11-17

#### Migration 1: `20251114140643_allocator_backtracking_and_merge_graph.sql`

- ✅ `table_merge_graph` table created with proper structure
- ✅ All indexes verified: pk, restaurant_idx, reverse_idx
- ✅ Foreign key constraints to restaurants and table_inventory
- ✅ `allocations.restaurant_id` column exists (uuid, NOT NULL)
- ✅ 9 indexes on allocations table including GIST for overlap detection

#### Migration 2: `20251116_fix_unassign_tables_atomic.sql`

- ✅ `unassign_tables_atomic(uuid, uuid[])` function exists
- ✅ Returns TABLE(table_id uuid)
- ✅ Proper signature with optional table_ids parameter
- ✅ Function type: plpgsql, SECURITY DEFINER

**Full verification report**: See `artifacts/migration-verification-report.md`

## Session Endpoint Setup (2025-11-17)

### Additional Migrations Applied

**Migration 3**: `20251117190000_manual_assignment_sessions.sql`

- ✅ Created `manual_assignment_sessions` table
- ✅ Created session state enums
- ✅ Extended `table_holds` with session_id, status, last_touched_at
- ✅ Added indexes for session and hold queries

**Migration 4**: `20251117205000_manual_assignment_topology_versions.sql`

- ✅ Added topology version tracking columns
- ✅ Added performance indexes for active sessions/holds
- ✅ Optimized queries with partial indexes

### Feature Flags Verified

- ✅ `FEATURE_MANUAL_ASSIGNMENT_SESSION_ENABLED=true`
- ✅ `NEXT_PUBLIC_FEATURE_MANUAL_SESSION_ENABLED=true`

### Session Infrastructure Status

- ✅ Database tables created and verified
- ✅ Indexes optimized for session queries
- ✅ Feature flags enabled
- ✅ Verification script created: `scripts/verify-session-endpoint.mjs`

**Next**: Start dev server to test POST /api/staff/manual/session endpoint

## Known Issues

None identified during migration verification.

## Sign-off

- [x] Engineering - Migration verified on production database
- [x] Engineering - Session endpoint infrastructure configured
- [ ] Design/PM
- [ ] QA
