---
task: fix-ambiguous-merge-group-id
timestamp_utc: 2025-11-14T08:11:00Z
owner: github:@assistant
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Implementation Plan: Fix Ambiguous merge_group_id in confirm_hold_assignment_tx

## Objective

Fix the ambiguous column reference error in `confirm_hold_assignment_tx` RPC function so that table assignments can be successfully committed to the database during /reserve submission flows.

## Success Criteria

- [ ] `confirm_hold_assignment_tx` RPC executes without "ambiguous column" errors
- [ ] Table assignments written to `booking_table_assignments` table
- [ ] Allocations created successfully
- [ ] Logs show "assignment confirmed" instead of "strict hold enforcement"
- [ ] Both inline confirm and auto-assign retry job succeed

## Architecture & Components

### Affected Components:

1. **Supabase RPC Function**: `confirm_hold_assignment_tx`
   - Location: `supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql`
   - Role: Atomically confirm hold and create table assignments
2. **Schema Mirror**: `supabase/schema.sql`
   - Location: Line ~1597
   - Role: Maintains current schema snapshot

3. **Next.js Dev Server**:
   - Stale processes blocking port
   - PIDs: 81230, 56464

### State Management:

- Function uses temp table `tmp_confirm_assignments_tx` for atomic operations
- Joins with `public.booking_table_assignments` in RETURN query
- Both tables have `merge_group_id` column causing ambiguity

## Data Flow & API Contracts

### Call Chain:

```
/reserve endpoint
  → server/capacity/table-assignment/assignment.ts:861
    → Supabase RPC: confirm_hold_assignment_tx(...)
      → Creates tmp_confirm_assignments_tx
      → Calls assign_tables_atomic_v2
      → INSERT capacity_outbox (line ~274: ambiguous merge_group_id)
      → RETURN QUERY with JOIN (line ~359: already qualified)
```

### RPC Signature (unchanged):

```sql
confirm_hold_assignment_tx(
  p_hold_id uuid,
  p_booking_id uuid,
  p_table_ids uuid[],
  p_idempotency_key text,
  p_require_adjacency boolean DEFAULT false,
  p_assigned_by uuid DEFAULT NULL,
  p_start_at timestamp with time zone DEFAULT NULL,
  p_end_at timestamp with time zone DEFAULT NULL,
  p_target_status public.booking_status DEFAULT NULL,
  p_history_changed_by uuid DEFAULT NULL,
  p_history_reason text DEFAULT NULL,
  p_history_metadata jsonb DEFAULT '{}'::jsonb
)
```

### Return Type (unchanged):

```sql
RETURNS TABLE(
  id uuid,
  table_id uuid,
  start_at timestamptz,
  end_at timestamptz,
  merge_group_id uuid
)
```

## Changes Required

### 1. Migration File Update

**File**: `supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql`

**Line ~274**: Change unqualified reference in capacity_outbox INSERT

```sql
-- BEFORE:
'mergeGroupId', (SELECT merge_group_id FROM tmp_confirm_assignments_tx LIMIT 1),

-- AFTER:
'mergeGroupId', (SELECT tmp.merge_group_id FROM tmp_confirm_assignments_tx tmp LIMIT 1),
```

**Note**: Line ~359 in RETURN QUERY already has `tmp.merge_group_id` qualified correctly.

### 2. Schema File Update

**File**: `supabase/schema.sql`

Apply same fix at line ~1597 to keep schema.sql synchronized with migrations.

### 3. Process Cleanup

Kill stale Next.js processes:

```bash
kill -9 81230 56464
# OR
rm -f .next/dev/lock
```

## Edge Cases

- **Concurrent bookings**: Temp table is session-scoped, no cross-contamination
- **Rollback scenarios**: Transaction already handles rollback on any error
- **Migration replay**: Idempotent (CREATE OR REPLACE FUNCTION)
- **Multiple merge groups**: LIMIT 1 gets first group (existing behavior preserved)

## Testing Strategy

### Manual Verification:

1. Deploy migration to remote Supabase staging
2. Restart dev server (after killing stale processes)
3. Submit test booking via /reserve flow
4. Check server logs for:
   - Success: "assignment confirmed"
   - Failure: "strict hold enforcement" or RPC error
5. Query `booking_table_assignments` and `allocations` for inserted rows

### SQL Validation:

```sql
-- Test query to verify no ambiguity
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

## Rollout

### Feature Flags:

- N/A (bug fix, no flag needed)

### Deployment Plan:

1. **Staging First** (remote Supabase):

   ```bash
   # Using Supabase MCP or CLI
   supabase db push --dry-run  # Preview changes
   supabase db push            # Apply to staging
   ```

2. **Verify Staging**:
   - Run test bookings
   - Check assignments created
   - Monitor error logs

3. **Production** (change window):
   - Apply migration during low-traffic window
   - Monitor first 10 bookings
   - Rollback plan: revert function to previous version if errors persist

### Monitoring:

- Supabase logs for RPC errors
- Application logs for "assignment confirmed" messages
- `booking_table_assignments` row count metrics
- `table_holds` expiration/confirmation ratio

### Kill-Switch:

- Revert migration by redeploying previous version of function
- Fallback: Manual table assignment via admin interface

## DB Change Plan

### Target Envs:

- Staging → Production
- Window: Next available low-traffic period (~2-5 AM UTC)

### Backup Reference:

- Supabase automatic PITR (point-in-time recovery) available
- No schema changes, only function body update
- Migration is CREATE OR REPLACE (safe to replay)

### Dry-Run Evidence:

Will capture output in: `tasks/fix-ambiguous-merge-group-id-20251114-0811/artifacts/db-diff.txt`

### Backfill Strategy:

- N/A (no data backfill needed, function-only change)

### Rollback Plan:

If errors occur post-deployment:

1. Immediately revert function to previous version:
   ```sql
   -- Redeploy previous migration version
   -- OR manually restore function body
   ```
2. Investigate root cause with additional qualified columns if needed
3. Test fix in staging before re-deploying to production

### Risk Mitigation:

- Function is idempotent (CREATE OR REPLACE)
- No table structure changes
- Existing calls will use updated function automatically
- Transaction safety preserved (all-or-nothing semantics)
