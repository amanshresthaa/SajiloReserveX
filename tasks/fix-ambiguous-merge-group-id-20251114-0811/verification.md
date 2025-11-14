---
task: fix-ambiguous-merge-group-id
timestamp_utc: 2025-11-14T08:11:00Z
owner: github:@assistant
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Verification Report

## SQL Changes Applied

### Files Modified:

1. `supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql` (line 274)
2. `supabase/schema.sql` (line 1597)

### Change Details:

**BEFORE:**

```sql
'mergeGroupId', (SELECT merge_group_id FROM tmp_confirm_assignments_tx LIMIT 1),
```

**AFTER:**

```sql
'mergeGroupId', (SELECT tmp.merge_group_id FROM tmp_confirm_assignments_tx tmp LIMIT 1),
```

**Rationale:** Fully qualify the `merge_group_id` column reference with table alias `tmp` to eliminate ambiguity when multiple tables in scope have the same column name.

## Process Cleanup Completed

- [x] Killed stale Next.js process PID 81230
- [x] Killed stale Next.js process PID 56464
- [x] Removed `.next/dev/lock` file
- [x] Verified no Next.js processes remain running

## Deployment Status

### Staging Deployment:

- [ ] Connected to Supabase remote staging
- [ ] Ran migration preview/dry-run
- [ ] Captured output to artifacts/db-diff.txt
- [ ] Applied migration to staging
- [ ] Function deployed successfully

### Staging Verification:

- [ ] Dev server restarted cleanly
- [ ] Test booking submitted via /reserve
- [ ] Logs show "assignment confirmed" (not "strict hold enforcement")
- [ ] Query confirmed rows in `booking_table_assignments`
- [ ] Query confirmed rows in `allocations`
- [ ] No "ambiguous column" errors in Supabase logs
- [ ] Verified `merge_group_id` propagated correctly in capacity_outbox

### Production Deployment:

- [ ] Scheduled change window
- [ ] Obtained approval
- [ ] Applied migration to production
- [ ] Monitored first 10 bookings
- [ ] Verified assignments being created
- [ ] No errors detected

## Test Outcomes

### Pre-Fix Behavior:

- Error: `column reference "merge_group_id" is ambiguous`
- Transaction rolls back completely
- No rows written to `booking_table_assignments`
- No rows written to `allocations`
- Logs show "strict hold enforcement"

### Expected Post-Fix Behavior:

- No SQL errors
- Transaction commits successfully
- Rows written to `booking_table_assignments`
- Rows written to `allocations`
- Logs show "assignment confirmed"
- `merge_group_id` properly set in outbox events

## SQL Validation Query

To verify the fix works correctly:

```sql
-- This query should now execute without ambiguity errors
SELECT bta.id,
       tmp.table_id,
       tmp.start_at,
       tmp.end_at,
       tmp.merge_group_id
FROM tmp_confirm_assignments_tx tmp
JOIN public.booking_table_assignments bta
  ON bta.booking_id = '<test-booking-id>'
 AND bta.table_id = tmp.table_id;
```

## Artifacts

- SQL changes: Committed in migration file
- Process cleanup: Confirmed via `ps aux` check
- Deployment logs: To be captured in `artifacts/db-diff.txt`
- Test booking logs: To be captured in `artifacts/booking-test-logs.txt`
- Database query results: To be captured in `artifacts/assignment-query-results.txt`

## Known Issues

- [ ] None identified yet

## Next Steps

1. **Deploy to Supabase staging** using Supabase CLI or dashboard:

   ```bash
   # Option 1: Using Supabase CLI
   supabase db push --dry-run  # Preview
   supabase db push            # Apply

   # Option 2: Via Supabase dashboard
   # Navigate to Database > Migrations and run the updated migration
   ```

2. **Restart dev server**:

   ```bash
   pnpm run dev
   ```

3. **Test booking flow**:
   - Navigate to /reserve
   - Submit a test booking
   - Monitor server logs for "assignment confirmed"
   - Check database for new assignments

4. **Query verification**:

   ```sql
   -- Check booking_table_assignments
   SELECT * FROM booking_table_assignments
   WHERE booking_id = '<test-booking-id>'
   ORDER BY created_at DESC;

   -- Check allocations
   SELECT * FROM allocations
   WHERE booking_id = '<test-booking-id>'
   ORDER BY created_at DESC;

   -- Check capacity_outbox
   SELECT payload->>'mergeGroupId' as merge_group_id
   FROM capacity_outbox
   WHERE booking_id = '<test-booking-id>'
   AND event_type = 'capacity.assignment.sync';
   ```

5. **Monitor for errors**:
   - Supabase logs dashboard
   - Application server logs
   - No "ambiguous column" errors should appear

6. **Deploy to production** (after staging verification):
   - Schedule during low-traffic window
   - Follow same process as staging
   - Monitor first 10-20 bookings closely

## Sign‑off

- [ ] Engineering: SQL fix applied and tested
- [ ] Deployment: Staging and production successful
- [ ] Verification: Assignment flow working end-to-end
- [ ] Documentation: Task artifacts complete
