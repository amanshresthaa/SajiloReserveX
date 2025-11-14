---
task: capacity-overlap-migration
timestamp_utc: 2025-11-13T20:30:00Z
owner: github:@amanshresthaa
reviewers: []
risk: medium
flags: []
related_tickets: []
---

# Research: Capacity Overlap & Confirm Cache Migration

## Requirements

### Functional

- Strengthen allocations overlap enforcement with tenant partitioning
- Add confirmation result caching for idempotency
- Improve constraint performance by including restaurant_id
- Add new `booking_confirmation_results` table for audit trail

### Non-functional

- Performance: Constraint must be deferrable for batch operations
- Security: RLS policies for tenant isolation
- Reliability: Migration must be reversible
- Compatibility: Maintain existing assignment logic

## Migration Details

**File**: `supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql`

### Key Changes

1. **Enhanced Overlap Constraint**

   ```sql
   ALTER TABLE public.allocations
     ADD CONSTRAINT allocations_no_overlap
     EXCLUDE USING gist (
       restaurant_id WITH =,
       resource_type WITH =,
       resource_id  WITH =,
       "window"     WITH &&
     )
     WHERE (NOT shadow)
     DEFERRABLE;
   ```

   - Adds `restaurant_id` to partition constraint by tenant
   - Makes constraint `DEFERRABLE` for transaction batching
   - Maintains shadow allocation exclusion

2. **New Confirmation Cache Table**

   ```sql
   CREATE TABLE public.booking_confirmation_results (
     booking_id uuid NOT NULL,
     hold_id uuid NOT NULL,
     restaurant_id uuid NOT NULL,
     idempotency_key text NOT NULL,
     table_ids uuid[] NOT NULL,
     assignment_window tstzrange NOT NULL,
     created_at timestamptz NOT NULL,
     actor_id uuid,
     metadata jsonb NOT NULL,
     PRIMARY KEY (booking_id, idempotency_key),
     UNIQUE (hold_id)
   );
   ```

   - Caches confirmation results for faster lookups
   - Enables audit trail for all confirmations
   - Foreign keys to bookings and restaurants
   - RLS policies for tenant isolation

3. **Updated confirm_hold_assignment_tx**
   - Persists confirmation evidence to cache table
   - Emits capacity.assignment.sync events
   - Emits capacity.hold.confirmed events
   - Maintains idempotency via cache

## Existing Patterns & Reuse

### Constraint Pattern

- Follows existing GiST exclusion pattern from `allocations_no_overlap`
- Similar to time overlap constraints in `booking_table_assignments`

### RLS Pattern

- Matches existing tenant isolation via `require_restaurant_context()`
- Consistent with other capacity tables

### Outbox Pattern

- Reuses `capacity_outbox` for event emission
- Graceful degradation if outbox table missing

## External Resources

- [PostgreSQL GiST Exclusion Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION) — Multi-column exclusion
- [Deferrable Constraints](https://www.postgresql.org/docs/current/sql-set-constraints.html) — Transaction-level deferrals

## Constraints & Risks

### Risks

1. **Medium**: Constraint rebuild may lock allocations table briefly
2. **Low**: Index drop may impact concurrent queries
3. **Low**: New table requires grants/RLS setup

### Mitigation

- Apply during low-traffic window (staging first)
- Use `DEFERRABLE` to avoid blocking batch operations
- Graceful degradation for missing outbox/cache tables

## Open Questions

- Q: Should confirmation cache have TTL/archival policy?
  A: Not in this migration; can add retention policy later

- Q: Impact on existing assignment flows?
  A: None - constraint is stricter but maintains same semantics

## Recommended Direction

**Proceed with staged rollout:**

1. Apply to staging and run validation suite
2. Capture db-diff.txt artifact
3. Run assignment tests against staging
4. If green, apply to production during maintenance window
5. Monitor allocations query performance post-migration

**Rationale:**

- Constraint improvement is critical for tenant isolation
- Confirmation cache enables better observability
- Deferrable constraint maintains batch operation compatibility
- Low risk due to backward-compatible changes
