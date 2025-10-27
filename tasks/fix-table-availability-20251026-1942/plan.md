# Implementation Plan: Fix Table Availability Logic

## Objective

Ensure tables that are already assigned earlier in the day remain selectable for later, non-overlapping reservations so ops staff can maximise seating turns.

## Success Criteria

- [ ] `refresh_table_status` only marks tables as `reserved` while the current time falls within an allocation window.
- [ ] Ops dashboard shows a table as available for a later booking when its earlier assignment ends before the new window (status no longer blocks selection).

## Architecture & Components

- Supabase function `public.refresh_table_status` (currently defined in `supabase/migrations/20251019102432_consolidated_schema.sql`) controls `table_inventory.status` based on allocations.
- Ops dashboard (`src/components/features/dashboard/TableFloorPlan.tsx`) disables selection when `table.status !== 'available'`; updating the status logic rectifies UI behaviour without touching front-end code.

## Data Flow & API Contracts

- Trigger on `allocations` invokes `refresh_table_status` after assignments created via `assign_tables_atomic_v2`.
- The function must preserve existing semantics for maintenance (`out_of_service`) and checked-in tables (`occupied`), returning `'available'` only when no current allocation exists.

## UI/UX States

- Before fix: tables show as “reserved” all day after first assignment.
- After fix: tables stay “available” until the current time enters the reservation window, so the modal lists them for later bookings.

## Edge Cases

- Tables with overlapping allocations should still surface as reserved the moment overlap begins.
- Checked-in bookings must continue to flip status to `occupied`.
- Maintenance blocks (`allocations.is_maintenance`) should override all other states.

## Testing Strategy

- Static analysis: re-run SQL formatter/lint if available (e.g. `pnpm lint:schema`) to validate migration syntax.
- Unit/regression: rely on existing allocator collision logic; optional Vitest coverage for manual context to ensure tables remain in the list (stretch if time permits).
- Manual verification (post-deploy): assign an early booking, confirm status reverts to `available` before the window starts, then assign a later booking.

## Rollout

- Add a forward-only Supabase migration redefining `refresh_table_status` with the corrected `window @> now()` check and explicit fallbacks.
- Coordinate remote migration execution (per AGENTS.md “Supabase: remote only”).
- Communicate requirement to rerun the migration in staging/production.
