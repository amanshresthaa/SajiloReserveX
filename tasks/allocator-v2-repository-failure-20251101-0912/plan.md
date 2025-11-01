# Implementation Plan: Allocator v2 Repository Failure

## Objective

Restore ops dashboard table assignment so it succeeds even when legacy capacity overrides (`restaurant_capacity_rules`) are absent, while keeping capacity enforcement intact where data exists.

## Success Criteria

- [ ] `assign_tables_atomic_v2` no longer raises `42P01` when the overrides table is missing (API returns success/failure based on real conflicts only).
- [ ] When overrides are present, post-assignment capacity validation still aborts if limits are exceeded.

## Architecture & Components

- Supabase SQL functions:
  - `public.validate_booking_capacity_after_assignment` (defined in `supabase/migrations/20251101170000_booking_logic_hardening.sql`) – add a `to_regclass` guard and skip querying non-existent tables.
  - `public.update_booking_with_capacity_check` (in `supabase/migrations/20251021152000_add_update_booking_capacity_rpc.sql`) – apply the same guard so booking edits behave consistently.
- Capacity service (`server/capacity/tables.ts`) already surfaces `AssignmentRepositoryError`; no TypeScript changes expected beyond potential logging.

## Data Flow & API Contracts

Endpoint: `POST /api/ops/dashboard/assign-tables` → server calls Supabase RPC `assign_tables_atomic_v2` → RPC invokes `validate_booking_capacity_after_assignment` inside transaction.  
Request: `{ bookingId, tableIds, requireAdjacency?, assignedBy? }` (unchanged).  
Response: `200 OK { assignmentId }` or `500` (failure).  
Errors: we expect `ASSIGNMENT_CONFLICT` / `ASSIGNMENT_VALIDATION` / `ASSIGNMENT_REPOSITORY_ERROR`. After the change, missing table should no longer propagate as repository error.

## UI/UX States

- No UI change; ops dashboard continues to show assignment success/failure toasts.

## Edge Cases

- Table absent in entire environment → functions must treat capacity as unbounded but keep logging.
- Table exists but empty → guard should still allow query (regclass true) returning null results.
- Concurrent assignments while table absent → ensure guard logic doesn’t introduce locks or race conditions.
- Future reintroduction of overrides table → guard must continue to enforce limits normally.

## Testing Strategy

- Unit: N/A (SQL change).
- Integration: Simulate RPC error handling by writing a Vitest case for `translateSupabaseError` with `code: "42P01"` to assert it remains a repository error yet our SQL avoids emitting it.
- Manual / Verification: Run affected Vitest suite (`pnpm test:ops`) to ensure no regressions; if possible, reproduce assignment flow locally after migration by mocking RPC (document steps).
- Accessibility/E2E: Not applicable.

## Rollout

- Feature flag: none.
- Exposure: deploy migration to staging via remote pipeline, verify logs free from `ASSIGNMENT_REPOSITORY_ERROR` due to missing relation, then promote to production.
- Monitoring: Supabase logs + ops dashboard error telemetry (`server/capacity/tables.ts` instrumentation).
- Kill-switch: existing `app.capacity.post_assignment.enabled` setting remains as emergency bypass.
