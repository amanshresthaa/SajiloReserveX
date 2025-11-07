# Implementation Plan: Tenant RLS Foundation

## Objective

Enable database-level tenant isolation using Row Level Security (RLS) policies so that all tenant-scoped database operations respect restaurant boundaries and prevent cross-tenant data leakage.

## Success Criteria

- [x] RLS migration applied to staging and production databases
- [ ] All `/api/ops/*` routes use `getTenantServiceSupabaseClient(restaurantId)`
- [ ] Cross-tenant queries return 0 rows or fail with permission errors
- [ ] Same-tenant queries succeed without modification
- [ ] Smoke tests pass in staging (manual + auto flows)
- [ ] No performance regression (< 10% latency increase)
- [ ] Zero P0/P1 incidents related to tenant isolation in first 7 days

## Architecture & Components

### Database Layer (RLS Policies)

- **`set_restaurant_context(uuid)`** RPC function: Sets session GUC `app.restaurant_id`
- **RLS policies on tenant-scoped tables**: Filter rows by `current_setting('app.restaurant_id')`
- **Tables covered**: `bookings`, `booking_table_assignments`, `table_hold_windows`, `capacity_outbox`, etc.

### Application Layer (Supabase Clients)

- **`getServiceSupabaseClient()`**: Global service-role client (no tenant context)
  - Use for: Cross-tenant admin operations, restaurant CRUD, system-level queries
- **`getTenantServiceSupabaseClient(restaurantId)`**: Tenant-scoped service client
  - Use for: All booking operations, table assignments, holds, capacity management
  - Automatically injects `X-Restaurant-Id` header for RLS context

### API Route Patterns

**Before (Non-scoped)**:

```typescript
const serviceSupabase = getServiceSupabaseClient();
const { data } = await serviceSupabase.from('bookings').select('*').eq('id', bookingId);
```

**After (Tenant-scoped)**:

```typescript
// 1. Extract restaurant_id from existing booking
const serviceSupabase = getServiceSupabaseClient();
const { data: booking } = await serviceSupabase
  .from("bookings")
  .select("restaurant_id")
  .eq("id", bookingId)
  .single();

// 2. Use tenant-scoped client for all subsequent operations
const tenantClient = getTenantServiceSupabaseClient(booking.restaurant_id);
const { data: updated } = await tenantClient
  .from("bookings")
  .update({ ... })
  .eq("id", bookingId);
```

## Data Flow & API Contracts

### Phase 1: Critical Booking Operations

**Priority**: P0 (security-critical)

Routes to convert:

1. `/api/ops/bookings/[id]` (PATCH, DELETE) - Highest traffic
2. `/api/ops/bookings/[id]/status` (PATCH)
3. `/api/ops/bookings/[id]/tables` (POST, DELETE)
4. `/api/ops/bookings/[id]/check-out` (POST)
5. `/api/ops/bookings/[id]/undo-no-show` (POST)
6. `/api/ops/bookings/[id]/history` (GET)

### Phase 2: Dashboard & Analytics

**Priority**: P1 (read-only, lower risk)

Routes to convert:

1. `/api/ops/dashboard/summary` (GET)
2. `/api/ops/dashboard/heatmap` (GET)
3. `/api/ops/dashboard/rejections` (GET)
4. `/api/ops/dashboard/vips` (GET)
5. `/api/ops/dashboard/changes` (GET)

### Phase 3: Supporting APIs

**Priority**: P2 (can defer if needed)

Routes to convert:

1. `/api/ops/allowed-capacities` (GET)
2. `/api/ops/occasions` (GET, POST)
3. `/api/ops/strategies/simulate` (POST)

### Phase 4: Restaurant Management

**Status**: NO CONVERSION NEEDED

`/api/ops/restaurants/*` routes remain non-scoped since they operate cross-tenant (restaurant creation, listing).

## UI/UX States

N/A (Backend-only changes)

## Edge Cases

### 1. Booking with NULL restaurant_id

**Scenario**: Legacy data or corrupted records
**Handling**:

- Return 404 "Booking not found" (graceful degradation)
- Log warning to observability with booking_id

### 2. User attempts cross-tenant operation

**Scenario**: Malicious or buggy client sends wrong restaurantId
**Handling**:

- RLS blocks the query at DB level (returns 0 rows)
- API returns 404 (not 403, to avoid leaking existence)
- Log security event to observability

### 3. Migration rollback needed

**Scenario**: RLS breaks production unexpectedly
**Handling**:

- Run `DROP POLICY` commands (included in migration script)
- Redeploy app code to use non-scoped client temporarily
- Investigate root cause before re-applying

### 4. Background workers/cron jobs

**Scenario**: Jobs need tenant context but have no user session
**Handling**:

- Pass `restaurantId` explicitly to job payload
- Worker calls `getTenantServiceSupabaseClient(restaurantId)` before operations
- Future work: Audit all workers (`lib/jobs/`, `server/jobs/`)

## Testing Strategy

### Unit Tests

- Mock `getTenantServiceSupabaseClient` to verify it's called with correct restaurantId
- Test error handling when restaurant_id is missing

### Integration Tests

- Create bookings in different restaurants (A, B)
- Verify client scoped to A cannot read/update bookings in B
- Verify same-tenant operations succeed

### E2E Tests (Smoke Tests)

See `scripts/smoke-test-tenant-rls.sh`:

1. Manual hold within tenant → 200
2. Manual hold cross-tenant → 403
3. Auto quote within tenant → 200
4. Booking confirm within tenant → 200
5. Bookings query filtered by tenant → 200
6. RLS function exists in DB → verified

### Accessibility

N/A (API-only)

## Rollout

### Feature Flag

**Not applicable** - This is a security feature, not user-facing functionality.
RLS enforcement is binary: ON or OFF at DB level.

### Exposure Plan

1. **Staging**: Apply migrations, deploy API changes, run smoke tests for 24-48h
2. **Production**: Apply migrations during low-traffic window (e.g., 2-4 AM UTC)
3. **Monitoring**: Watch error rates, latency p50/p95/p99 for 7 days
4. **Validation**: Weekly audit of cross-tenant query attempts (should be 0)

### Monitoring

**Metrics**:

- `api.ops.*.latency` (p50, p95, p99) - expect < 10% increase
- `api.ops.*.error_rate` - expect < 0.1% increase
- `db.rls.context_missing` - custom metric for missing restaurant_id (should be 0)

**Dashboards**:

- Supabase Database Performance
- Application Error Rates
- Observability Events (filter: `booking.tenant_isolation`)

**Alerts**:

- Error rate > 1% on any `/api/ops/*` route
- Latency p95 increase > 20% sustained for 5 minutes
- Any `booking.cross_tenant.attempted` event (security alert)

### Kill-switch

**Emergency Rollback**:

```sql
-- Remove RLS policies
DROP POLICY IF EXISTS tenant_isolation_select ON bookings;
DROP POLICY IF EXISTS tenant_isolation_insert ON bookings;
-- (Repeat for all tenant-scoped tables)

-- Revert app code to use getServiceSupabaseClient()
git revert <commit-sha>
pnpm run build && deploy
```

**Trigger conditions**:

- Error rate > 5% sustained for 10 minutes
- Data corruption detected (bookings assigned to wrong restaurant)
- Performance degradation > 50% latency increase

## Dependencies

- ✅ Migration: `20251107093000_capacity_outbox_indexes.sql`
- ✅ Migration: `20251107094000_tenant_rls_foundation.sql`
- ✅ Script: `scripts/apply-tenant-rls-migrations.sh`
- ✅ Script: `scripts/smoke-test-tenant-rls.sh`
- ⏳ Code: Convert `/api/ops/*` routes to tenant-scoped clients

## Risks & Mitigations

| Risk                                            | Impact | Probability | Mitigation                                         |
| ----------------------------------------------- | ------ | ----------- | -------------------------------------------------- |
| Cross-tenant data leak if conversion incomplete | P0     | Medium      | Comprehensive code audit + smoke tests before prod |
| Performance regression from RLS overhead        | P1     | Low         | Indexed restaurant_id; profiling in staging        |
| Breaking existing integrations                  | P1     | Medium      | Gradual rollout; extensive testing; rollback plan  |
| Emergency rollback complexity                   | P2     | Low         | Documented rollback SQL; app code revert ready     |

## Notes

- Staff APIs already converted (6 routes confirmed)
- Ops APIs are the only remaining high-priority targets
- Restaurant management APIs intentionally excluded (cross-tenant by design)
