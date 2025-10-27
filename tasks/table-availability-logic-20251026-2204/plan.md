# Implementation Plan: Table Availability Logic

## Objective

Prevent assigned tables from showing as blocked for the entire day by tightening the Supabase status logic so ops staff can reuse tables between non-overlapping reservations.

## Success Criteria

- [ ] `table_inventory.status` transitions to `'reserved'` only while `now()` lies inside an allocation window; outside that window it reverts to `'available'`.
- [ ] Ops manual-assignment view lists the table as selectable once the earlier reservation window ends (verified via API/QA once remote migration runs).
- [ ] No regressions for maintenance and checked-in flows; automation/tests still pass (`pnpm test:ops`).

## Architecture & Components

- `public.refresh_table_status` PL/pgSQL function (`supabase/migrations/20251019102432_consolidated_schema.sql:1229`) is triggered by `allocations` inserts/updates and is solely responsible for mutating `table_inventory.status`.
- Manual assignment UI consumes `ManualAssignmentTable.status` and disables any table whose status is not `'available'` (`src/components/features/dashboard/TableFloorPlan.tsx:69`).
  State: Supabase-backed status; no additional client-side derivation.

## Data Flow & API Contracts

- Table assignment RPC (`assign_tables_atomic_v2`) writes to `allocations` and immediately invokes `refresh_table_status` (`supabase/migrations/20251026180000_fix_assign_tables_atomic_v2_table_id_v2.sql:385`).
- `/api/ops/tables` and `/api/ops/bookings` return `table.status` from the `table_inventory` view with no transformation (`src/services/ops/tables.ts:205`), so database changes propagate to API consumers automatically.

## UI/UX States

- Loading: unchanged.
- Empty: unchanged.
- Error: unchanged.
- Success: tables should read `'reserved'` only during an active allocation, `'occupied'` when a checked-in booking owns the window, `'out_of_service'` for maintenance, and `'available'` otherwise.

## Edge Cases

- Multiple overlapping allocations must still mark tables `'reserved'` before the overlap begins.
- Checked-in bookings override availability with `'occupied'`.
- Maintenance windows continue to set `'out_of_service'` regardless of booking status.

## Testing Strategy

- Unit/Integration: add targeted Vitest covering the manual-assignment context serializer to assert that tables remain in the selectable list when status is `'available'`.
- Regression: run `pnpm test:ops` to ensure existing ops/server suites remain green.
- Manual (post-migration): use Chrome DevTools MCP in staging to assign an early booking, wait until outside the allocation window, and confirm the table reappears.
- Accessibility: no UI changes required; rely on existing coverage.

## Rollout

- Feature flag: not required.
- Exposure: apply new Supabase migration (`supabase/migrations/20251026221500_refresh_table_status_active_window.sql`) to staging, then production.
- Monitoring: watch ops dashboard error logs and allocator metrics for unexpected conflicts; confirm booking assignments continue to succeed.
