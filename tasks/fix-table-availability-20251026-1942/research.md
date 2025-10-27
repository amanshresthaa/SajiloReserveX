# Research: Fix Table Availability Logic

## Existing Patterns & Reuse

- `server/capacity/tables.ts` already computes per-booking windows and exposes `getManualAssignmentContext`, which powers the Ops dashboard table picker. It relies on the Supabase schedule (`allocations`) to flag conflicts.
- `src/components/features/dashboard/TableFloorPlan.tsx` disables selection when a table’s status is not `'available'` or when `manualContext.conflicts` reports an overlap, so any upstream status change immediately affects UI availability.
- Supabase trigger `refresh_table_status` (defined in `supabase/migrations/20251019102432_consolidated_schema.sql#L1234`) writes back to `table_inventory.status` whenever allocations change; the dashboard simply consumes this field.

## External Resources

- [Luxon `@> now()` range checks](https://www.postgresql.org/docs/current/functions-range.html) – confirms `tstzrange @> now()` evaluates to "current time inside window".

## Constraints & Risks

- Status changes are driven by database triggers; front-end has no alternate source of truth. Any logic bug in `refresh_table_status` propagates instantly to every view.
- Supabase migrations must stay forward-only; we cannot edit existing ones in-place. Fix requires a new migration (and coordination with remote Supabase) per `AGENTS.md`.
- We must ensure tables assigned to maintenance (`is_maintenance`) or checked-in bookings still surface as unavailable.

## Open Questions (and answers if resolved)

- Q: Why does the UI think a table is blocked all day after a single assignment?
  A: The current trigger marks `table_inventory.status = 'reserved'` whenever an allocation’s end time is in the future (`upper(window) > now()`), so a lunchtime booking keeps the status at `'reserved'` until midnight.
- Q: Are conflicts coming from schedule calculations instead?
  A: No. `manualContext.conflicts` only considers overlapping windows; the blocks appear even with no overlap (`TableFloorPlan.tsx:226`) because the status remains `'reserved'`.

## Recommended Direction (with rationale)

- Update `refresh_table_status` so it only promotes tables to `'reserved'` when the current time lies inside the allocation window (`window @> now()`), while keeping maintenance and checked-in logic intact. This allows the table picker to show the table as available before/after its actual booking window, eliminating the day-long block without touching front-end code. Apply the change via a fresh Supabase migration as required by the repo’s workflow.
