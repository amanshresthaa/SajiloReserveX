# Research: Tenant RLS Foundation Implementation

## Requirements

### Functional

- Multi-tenant data isolation at the database level
- Row Level Security (RLS) policies to prevent cross-tenant data access
- Tenant context must be set via `set_restaurant_context()` RPC before operations
- All tenant-scoped operations must use `getTenantServiceSupabaseClient(restaurantId)`

### Non-functional

- **Security**: Zero cross-tenant data leakage (P0 requirement)
- **Performance**: Minimal overhead from RLS context switching
- **Compatibility**: Existing staff APIs already converted; ops APIs need conversion
- **Rollback**: Must support immediate disable if issues arise

## Existing Patterns & Reuse

### Already Implemented (✅ Staff APIs)

The following routes already use `getTenantServiceSupabaseClient`:

- `/api/staff/manual/hold` - Manual hold creation/release
- `/api/staff/manual/confirm` - Booking confirmation
- `/api/staff/manual/context` - Context retrieval
- `/api/staff/manual/validate` - Validation checks
- `/api/staff/auto/quote` - Auto quote generation
- `/api/staff/auto/confirm` - Auto confirmation

**Pattern from `staff/manual/hold/route.ts`:**

```typescript
import { getTenantServiceSupabaseClient } from '@/server/supabase';

// Later in handler...
const serviceClient = getTenantServiceSupabaseClient(bookingRow.restaurant_id);
```

### Needs Conversion (❌ Ops APIs)

Routes still using non-tenant-scoped `getServiceSupabaseClient()`:

- `/api/ops/bookings/[id]/route.ts` (PATCH, DELETE)
- `/api/ops/restaurants/route.ts` (GET, POST)
- `/api/ops/bookings/[id]/status/route.ts`
- `/api/ops/bookings/[id]/check-out/route.ts`
- `/api/ops/bookings/[id]/undo-no-show/route.ts`
- `/api/ops/bookings/[id]/tables/route.ts`
- `/api/ops/bookings/[id]/history/route.ts`
- `/api/ops/dashboard/*` routes (summary, heatmap, rejections, vips, changes)
- `/api/ops/allowed-capacities/route.ts`
- `/api/ops/occasions/route.ts`
- `/api/ops/strategies/simulate/route.ts`

## External Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Internal: `supabase/migrations/20251107094000_tenant_rls_foundation.sql`

## Constraints & Risks

### Technical Constraints

- RLS policies must be applied **before** production deployment
- Migrations are **irreversible** without coordinated rollback
- All queries must filter by `restaurant_id` for tenant-scoped tables

### Risks

1. **Cross-tenant data exposure** if conversion is incomplete
   - Mitigation: Comprehensive audit of all API routes before production
2. **Performance regression** from additional RLS checks
   - Mitigation: Indexed `restaurant_id` columns, performance profiling in staging
3. **Breaking existing integrations** if context not set properly
   - Mitigation: Smoke tests verify all critical flows before production
4. **Emergency rollback complexity** if RLS breaks production
   - Mitigation: Migration script includes verification queries, staged rollout

### Open Questions (Resolved)

- **Q**: Should background workers also use tenant-scoped clients?
  - **A**: YES - Any process touching tenant data must set context
- **Q**: What happens if `restaurant_id` is NULL in a query?
  - **A**: RLS policies will block the query; ensure restaurant_id is always provided
- **Q**: Do we need a kill-switch for RLS?
  - **A**: Migration includes `DROP POLICY` commands for emergency rollback

## Recommended Direction

### Phase 1: Migration Application ✅

1. Apply `20251107093000_capacity_outbox_indexes.sql` (prerequisite)
2. Apply `20251107094000_tenant_rls_foundation.sql` (RLS policies + RPC)
3. Verify `set_restaurant_context()` function exists in staging

**Script created**: `scripts/apply-tenant-rls-migrations.sh`

### Phase 2: API Conversion (Current)

Convert all `/api/ops/*` routes to use `getTenantServiceSupabaseClient`:

1. Identify `restaurant_id` from booking/entity
2. Replace `getServiceSupabaseClient()` with `getTenantServiceSupabaseClient(restaurantId)`
3. Update error handling for RLS denials (42501 error code)

### Phase 3: Smoke Testing

Run comprehensive tests to verify:

1. Same-tenant operations succeed
2. Cross-tenant operations fail with 403/404
3. No performance regressions
4. Audit logs capture tenant context

**Script created**: `scripts/smoke-test-tenant-rls.sh`

### Phase 4: Production Rollout

1. Deploy API changes to staging
2. Run smoke tests for 24-48 hours
3. Apply migrations to production (with confirmation prompt)
4. Monitor logs/metrics for RLS-related errors
5. Keep rollback plan ready

## Summary

**Objective**: Enable database-level tenant isolation via RLS policies and tenant-scoped Supabase clients.

**Current State**:

- ✅ Migration scripts created
- ✅ Smoke test script created
- ✅ Staff APIs already converted
- ❌ Ops APIs still use non-scoped client

**Next Steps**:

1. Convert `/api/ops/bookings/[id]/route.ts` (highest priority - most critical)
2. Convert remaining `/api/ops/*` routes systematically
3. Run smoke tests in staging
4. Apply to production after QA sign-off
