---
task: capacity-overlap-migration
timestamp_utc: 2025-11-13T20:30:00Z
owner: github:@amanshresthaa
reviewers: []
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Capacity Overlap & Confirm Cache Migration

## Objective

Apply migration `20251113203000_capacity_overlap_and_confirm_cache.sql` to strengthen allocations overlap enforcement and add confirmation result caching, enabling better tenant isolation and audit trails.

## Success Criteria

- [ ] Migration applies successfully to staging without errors
- [ ] New constraint enforces tenant partitioning correctly
- [ ] Confirmation cache table operational with RLS
- [ ] Existing assignment tests pass against staging
- [ ] Performance metrics within acceptable range
- [ ] Migration artifacts captured for PR evidence
- [ ] Production deployment completes without incidents

## Pre-Migration Checklist

### Backup & Safety

- [ ] Verify recent PITR backup exists (Supabase Dashboard)
- [ ] Capture current schema snapshot: `pg_dump --schema-only`
- [ ] Document rollback steps
- [ ] Identify maintenance window (low-traffic period)
- [ ] Alert on-call team of deployment

### Environment Validation

- [ ] Confirm database connection: `psql $SUPABASE_DB_URL -c "\dt allocations"`
- [ ] Verify no long-running transactions: Check `pg_stat_activity`
- [ ] Check allocations table size: `SELECT pg_size_pretty(pg_total_relation_size('allocations'))`
- [ ] Verify btree_gist extension available

## Deployment Steps

### Stage 1: Staging Deployment

#### 1.1 Pre-Migration Validation

```bash
# Connect to staging database
export SUPABASE_DB_URL="postgresql://postgres.mqtchcaavsucsdjskptc:tHFJ-D.+W+jD6U-@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

# Capture current state
psql "$SUPABASE_DB_URL" <<'SQL' > artifacts/pre-migration-state.txt
SELECT
  count(*) as allocation_count,
  count(DISTINCT restaurant_id) as restaurant_count,
  min(created_at) as earliest,
  max(created_at) as latest
FROM allocations;

SELECT conname, contype, condeferrable, condeferred
FROM pg_constraint
WHERE conrelid = 'allocations'::regclass;
SQL

# Check for constraint violations before migration
psql "$SUPABASE_DB_URL" <<'SQL' > artifacts/pre-migration-violations.txt
SELECT
  a1.id as alloc1,
  a2.id as alloc2,
  a1.resource_id,
  a1.window as window1,
  a2.window as window2
FROM allocations a1
JOIN allocations a2
  ON a1.restaurant_id = a2.restaurant_id
 AND a1.resource_type = a2.resource_type
 AND a1.resource_id = a2.resource_id
 AND a1.window && a2.window
 AND a1.id < a2.id
 AND NOT a1.shadow
 AND NOT a2.shadow
LIMIT 10;
SQL
```

#### 1.2 Apply Migration

```bash
# Apply migration to staging
psql "$SUPABASE_DB_URL" < supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql 2>&1 | tee artifacts/staging-migration.log

# Capture migration status
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "✅ Migration applied successfully" | tee -a artifacts/staging-migration.log
else
  echo "❌ Migration failed with exit code ${PIPESTATUS[0]}" | tee -a artifacts/staging-migration.log
  exit 1
fi
```

#### 1.3 Post-Migration Validation

```bash
# Verify new constraint exists
psql "$SUPABASE_DB_URL" <<'SQL' > artifacts/post-migration-constraints.txt
SELECT
  conname,
  contype,
  condeferrable,
  condeferred,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'allocations'::regclass
  AND conname = 'allocations_no_overlap';
SQL

# Verify new table exists
psql "$SUPABASE_DB_URL" <<'SQL' > artifacts/post-migration-tables.txt
\d booking_confirmation_results
SQL

# Capture diff
psql "$SUPABASE_DB_URL" --schema-only > artifacts/post-migration-schema.sql

# Generate diff summary
diff -u artifacts/pre-migration-state.txt artifacts/post-migration-constraints.txt > artifacts/db-diff.txt || true
```

#### 1.4 Functional Testing

```bash
# Run assignment tests against staging
SUPABASE_DB_URL="$SUPABASE_DB_URL" pnpm test:integration -- tests/server/capacity/assignTablesAtomic.test.ts 2>&1 | tee artifacts/tests.txt

# Check test results
if grep -q "FAIL" artifacts/tests.txt; then
  echo "❌ Tests failed - review artifacts/tests.txt"
  exit 1
else
  echo "✅ All tests passed"
fi
```

#### 1.5 Performance Validation

```bash
# Measure constraint check performance
psql "$SUPABASE_DB_URL" <<'SQL' > artifacts/performance-test.txt
EXPLAIN ANALYZE
SELECT *
FROM allocations
WHERE restaurant_id = (SELECT id FROM restaurants LIMIT 1)
  AND resource_type = 'table'
  AND resource_id = (SELECT id FROM table_inventory LIMIT 1)
  AND window && tstzrange('2025-11-15 18:00:00+00', '2025-11-15 20:00:00+00');
SQL

# Check for slow queries
psql "$SUPABASE_DB_URL" <<'SQL'
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%allocations%'
ORDER BY mean_exec_time DESC
LIMIT 5;
SQL
```

### Stage 2: Production Deployment

#### 2.1 Pre-Production Checklist

- [ ] Staging validation complete
- [ ] All tests passing
- [ ] Performance within SLA
- [ ] Rollback plan documented
- [ ] Maintenance window scheduled
- [ ] On-call team notified

#### 2.2 Apply to Production

```bash
# Switch to production DB URL
export SUPABASE_DB_URL="<production-db-url>"

# Repeat validation steps from staging
# ... (same as staging, different URL)

# Apply migration
psql "$SUPABASE_DB_URL" < supabase/migrations/20251113203000_capacity_overlap_and_confirm_cache.sql 2>&1 | tee artifacts/production-migration.log
```

#### 2.3 Post-Production Monitoring

```bash
# Monitor for errors in next 15 minutes
watch -n 30 'psql "$SUPABASE_DB_URL" -c "SELECT count(*) FROM pg_stat_activity WHERE state = '\''active'\'' AND query LIKE '\''%allocations%'\''"'

# Check Supabase logs
# Dashboard → Logs → Filter for "allocations_no_overlap"

# Monitor assignment success rate
psql "$SUPABASE_DB_URL" <<'SQL'
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  count(*) as confirmations,
  count(DISTINCT booking_id) as unique_bookings
FROM booking_confirmation_results
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
SQL
```

## Rollback Plan

### If Migration Fails (During Apply)

```bash
# Transaction will auto-rollback due to BEGIN/COMMIT wrapper
# No manual rollback needed if migration script fails

# Verify rollback
psql "$SUPABASE_DB_URL" -c "SELECT conname FROM pg_constraint WHERE conrelid = 'allocations'::regclass AND conname = 'allocations_no_overlap';"
# Should return empty if rolled back
```

### If Issues After Successful Migration

```sql
-- Rollback script (if needed)
BEGIN;

-- Drop new table
DROP TABLE IF EXISTS public.booking_confirmation_results CASCADE;

-- Restore old constraint
ALTER TABLE public.allocations
  DROP CONSTRAINT IF EXISTS allocations_no_overlap;

ALTER TABLE public.allocations
  ADD CONSTRAINT allocations_no_overlap
  EXCLUDE USING gist (
    resource_id WITH =,
    window WITH &&
  )
  WHERE (shadow = false);

-- Restore redundant index (if needed)
CREATE INDEX IF NOT EXISTS allocations_resource_window_idx
  ON public.allocations USING gist (resource_id, window);

-- Revert confirm_hold_assignment_tx to previous version
-- (restore from previous migration backup)

COMMIT;
```

## Feature Flag Configuration

### FEATURE_ALLOCATOR_ADJACENCY_MODE

**Location**: `.env.local` or environment variables

**Values**:

- `connected` — Strict BFS connectivity (default, safest)
- `pairwise` — Adjacent pairs only
- `neighbors` — Direct neighbors only

**Rollout Plan**:

#### Phase 1: Staging Validation (Immediate)

```bash
# .env.staging
FEATURE_ALLOCATOR_ADJACENCY_MODE=connected
```

#### Phase 2: Production Rollout (After Migration)

```bash
# .env.production
FEATURE_ALLOCATOR_ADJACENCY_MODE=connected

# Monitor assignment success rate for 48 hours
# If stable, no change needed (connected is default)
```

#### Phase 3: Per-Venue Rollout (Optional)

If specific venues need different modes:

```sql
-- Use feature_flag_overrides table
INSERT INTO feature_flag_overrides (
  restaurant_id,
  flag_key,
  flag_value,
  enabled,
  created_at
) VALUES (
  '<venue-uuid>',
  'allocator.adjacency_mode',
  'pairwise',
  true,
  NOW()
);
```

## Observability

### Metrics to Monitor

1. **Assignment Success Rate**

   ```sql
   SELECT
     DATE_TRUNC('hour', created_at) as hour,
     count(*) as total_confirmations,
     count(DISTINCT booking_id) as unique_bookings,
     count(*) FILTER (WHERE metadata ? 'error') as errors
   FROM booking_confirmation_results
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY hour
   ORDER BY hour DESC;
   ```

2. **Constraint Violations Prevented**

   ```sql
   -- Check logs for constraint violation errors
   -- These indicate the constraint is working correctly
   SELECT count(*)
   FROM pg_stat_database_conflicts
   WHERE datname = 'postgres';
   ```

3. **Cache Hit Rate**
   ```sql
   SELECT
     count(*) as cached_confirmations,
     count(DISTINCT idempotency_key) as unique_keys
   FROM booking_confirmation_results
   WHERE created_at > NOW() - INTERVAL '1 day';
   ```

### Alerts

- **Alert 1**: Assignment error rate > 5%
- **Alert 2**: Database constraint violations spike
- **Alert 3**: Query latency on allocations > 200ms P95

## Testing Strategy

### Unit Tests

- Test constraint enforcement in isolation
- Verify confirmation cache CRUD operations
- Validate RLS policies

### Integration Tests

```bash
# Run full assignment test suite
pnpm test tests/server/capacity/assignTablesAtomic.test.ts
pnpm test tests/server/capacity/confirmHoldAssignment.test.ts

# Capture results
pnpm test 2>&1 | tee artifacts/tests.txt
```

### Smoke Tests (Post-Deployment)

```bash
# Create test booking and assign table
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"restaurant_id":"test","party_size":4,"booking_date":"2025-11-15","start_time":"19:00"}'

# Verify assignment succeeds
# Check booking_confirmation_results table for entry
```

## Documentation Updates

- [ ] Update `TABLE_ASSIGNMENT_BUSINESS_LOGIC.md` with new constraint details
- [ ] Add `booking_confirmation_results` to data model section
- [ ] Document rollback procedure in runbook
- [ ] Update migration history appendix

## Sign-Off

- [ ] Engineering: Migration tested on staging
- [ ] QA: Assignment tests pass
- [ ] DevOps: Monitoring configured
- [ ] On-Call: Rollback plan reviewed

---

**Estimated Duration**:

- Staging: 30 minutes
- Validation: 1 hour
- Production: 30 minutes
- Monitoring: 24 hours

**Risk Level**: Medium (constraint changes require careful validation)

**Go/No-Go Decision Point**: After staging validation and test results
