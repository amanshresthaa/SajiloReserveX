---
task: fix-ambiguous-merge-group-id
timestamp_utc: 2025-11-14T08:11:00Z
owner: github:@assistant
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Create task folder with UTC timestamp
- [x] Document issue in research.md
- [x] Create implementation plan
- [x] Check for other ambiguous references in codebase (none found)
- [x] Create artifacts directory

## Core Fixes

### SQL Function Updates

- [x] Fix migration file: `20251113203000_capacity_overlap_and_confirm_cache.sql` line ~274
- [x] Fix schema mirror: `supabase/schema.sql` line ~1597
- [x] Verify no other unqualified `merge_group_id` references in function body
- [x] Create deployable hotfix SQL script
- [x] Deploy to Supabase remote (COMPLETED)

### Process Cleanup

- [x] Kill stale Next.js process PID 81230
- [x] Kill stale Next.js process PID 56464
- [x] Remove `.next/dev/lock` if still present
- [x] Verify no other Next.js processes running

## Deployment

### Staging

- [x] Connect to Supabase staging environment (remote)
- [x] Run migration dry-run/preview
- [x] Capture dry-run output to artifacts/db-diff.txt
- [x] Apply migration to staging
- [x] Verify function deployed successfully

### Verification (Staging)

- [x] Restart dev server (clean state)
- [x] Submit test booking via /reserve
- [x] Check logs for "assignment confirmed" message
- [x] Query `booking_table_assignments` for new rows (2 found)
- [x] Query `allocations` for new rows (3 found)
- [x] Verify no "ambiguous column" errors in Supabase logs

### Production

- [x] Schedule change window (low-traffic period)
- [x] Get approval for production deployment
- [x] Apply migration to production
- [x] Monitor first 10 bookings
- [x] Verify assignments being created
- [x] Document deployment outcome

## Testing

- [x] Manual QA: Complete booking flow
- [x] Check inline confirm attempt succeeds
- [x] Check auto-assign retry job succeeds
- [x] Verify merge_group_id propagated correctly
- [x] Check capacity_outbox events created

## Documentation

- [x] Update verification.md with test results
- [x] Capture artifacts (logs, queries, screenshots)
- [x] Document any deviations from plan
- [x] Note any additional issues discovered

## Notes

### Assumptions:

- Only two locations need fixing (migration + schema.sql)
- RETURN QUERY already has proper qualification (tmp.merge_group_id)
- No breaking changes to function signature or return type

### Deviations:

- (None yet)

### Additional Observations:

- May want to add SQL linting to catch similar issues in future
- Consider adding test coverage for RPC functions

## Batched Questions

- Should we audit all other SQL functions for similar ambiguity issues?
- Do we need to backfill any failed bookings once fix is deployed?
- Should we add monitoring alerts for RPC failures?
