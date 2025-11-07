# Implementation Checklist

## Setup

- [x] Create task folder: `tasks/tenant-rls-foundation-20251107-1430/`
- [x] Document research findings
- [x] Document implementation plan
- [x] Create migration application script
- [x] Create smoke test script

## Database Migrations

- [ ] Make script executable: `chmod +x scripts/apply-tenant-rls-migrations.sh`
- [ ] Set staging DB URL: `export SUPABASE_STAGING_DB_URL="postgresql://..."`
- [ ] Apply migrations to staging: `./scripts/apply-tenant-rls-migrations.sh staging`
- [ ] Verify `set_restaurant_context()` function exists in staging
- [ ] Run smoke tests in staging: `./scripts/smoke-test-tenant-rls.sh staging`
- [ ] Monitor staging for 24-48 hours
- [ ] Apply migrations to production: `./scripts/apply-tenant-rls-migrations.sh production`
- [ ] Verify production deployment successful

## Phase 1: Critical Booking Operations (P0)

- [ ] Convert `/api/ops/bookings/[id]/route.ts` (PATCH handler)
  - [ ] Extract `restaurant_id` from existing booking
  - [ ] Replace `getServiceSupabaseClient()` with `getTenantServiceSupabaseClient(restaurantId)`
  - [ ] Update error handling for RLS denials (42501 → 403/404)
  - [ ] Test: Same-tenant update succeeds
  - [ ] Test: Cross-tenant update blocked

- [ ] Convert `/api/ops/bookings/[id]/route.ts` (DELETE handler)
  - [ ] Use tenant-scoped client for cancellation
  - [ ] Verify audit logs still capture restaurant context
  - [ ] Test: Same-tenant cancel succeeds
  - [ ] Test: Cross-tenant cancel blocked

- [ ] Convert `/api/ops/bookings/[id]/status/route.ts`
  - [ ] Apply tenant-scoped client pattern
  - [ ] Test status updates (confirmed, seated, no-show, etc.)

- [ ] Convert `/api/ops/bookings/[id]/tables/route.ts`
  - [ ] POST: Assign tables with tenant context
  - [ ] DELETE: Release tables with tenant context
  - [ ] Test table assignment isolation

- [ ] Convert `/api/ops/bookings/[id]/check-out/route.ts`
  - [ ] Apply tenant-scoped client
  - [ ] Test check-out flow

- [ ] Convert `/api/ops/bookings/[id]/undo-no-show/route.ts`
  - [ ] Apply tenant-scoped client
  - [ ] Test undo-no-show flow

- [ ] Convert `/api/ops/bookings/[id]/history/route.ts`
  - [ ] Read-only, but still requires tenant scope
  - [ ] Test audit log retrieval

## Phase 2: Dashboard & Analytics (P1)

- [ ] Convert `/api/ops/dashboard/summary/route.ts`
- [ ] Convert `/api/ops/dashboard/heatmap/route.ts`
- [ ] Convert `/api/ops/dashboard/rejections/route.ts`
- [ ] Convert `/api/ops/dashboard/vips/route.ts`
- [ ] Convert `/api/ops/dashboard/changes/route.ts`

## Phase 3: Supporting APIs (P2)

- [ ] Convert `/api/ops/allowed-capacities/route.ts`
- [ ] Convert `/api/ops/occasions/route.ts`
- [ ] Convert `/api/ops/strategies/simulate/route.ts`

## Testing

- [ ] Unit tests for tenant-scoped client usage
- [ ] Integration tests for cross-tenant isolation
- [ ] Run E2E smoke tests in staging
- [ ] Manual QA: Create booking in restaurant A, verify cannot access from restaurant B context
- [ ] Performance profiling: Compare p95 latency before/after

## Deployment

- [ ] Merge PR with tenant-scoped API changes
- [ ] Deploy to staging
- [ ] Run smoke tests post-deployment
- [ ] Monitor error rates and latency for 24-48 hours
- [ ] Deploy to production
- [ ] Monitor production for 7 days
- [ ] Document any incidents or rollbacks

## Post-Deployment

- [ ] Audit background workers for tenant context usage
- [ ] Create follow-up tickets for Phase 2 & 3 if deferred
- [ ] Update AGENTS.md with RLS best practices
- [ ] Retrospective: Lessons learned

## Notes

### Assumptions

- RLS policies will filter rows silently (return empty results, not errors)
- Existing `restaurant_id` columns are non-null and indexed
- Performance overhead from RLS checks is < 10% (verified in profiling)

### Deviations

- None so far

## Batched Questions

- [ ] Should we add a `X-Tenant-Context-Source` header for debugging? (e.g., "user-session" vs "service-override")
- [ ] Do we need a separate client for "sudo" operations that bypass RLS? (e.g., platform admin viewing all bookings)
- [ ] Should background job failures related to missing tenant context trigger PagerDuty?

## Progress Log

- 2025-11-07 14:30 UTC: Task created, research and plan documented
- 2025-11-07 14:45 UTC: Migration and smoke test scripts created
- 2025-11-07 15:00 UTC: Starting Phase 1 API conversions (ops/bookings/[id])
