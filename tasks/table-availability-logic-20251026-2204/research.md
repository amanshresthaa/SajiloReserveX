# Research: Table Availability Logic

## Existing Patterns & Reuse

- Table status in ops flows is sourced directly from Supabase `table_inventory.status`. The value is mutated by the trigger-driven function `public.refresh_table_status` whenever `allocations` rows change, so any logic change must happen there (`supabase/migrations/20251019102432_consolidated_schema.sql:1229`).
- Manual assignment UIs only allow selection when `table.status === 'available'`; otherwise the table is marked inactive/blocked (`src/components/features/dashboard/TableFloorPlan.tsx:69`, `src/components/features/dashboard/TableFloorPlan.tsx:160`).
- The browser table inventory service simply forwards database status without additional filtering, so fixing the database function immediately propagates to the client (`src/services/ops/tables.ts:43`, `src/services/ops/tables.ts:205`).

## External Resources

- [Postgres range operations](https://www.postgresql.org/docs/current/functions-range.html) – confirms `tstzrange @> now()` tests whether the current time falls inside an allocation window.
- `supabase/migrations/20251026180000_fix_assign_tables_atomic_v2_table_id_v2.sql:385` – shows every allocation write calls `refresh_table_status`, so it is the single source of truth for table availability.

## Constraints & Risks

- Supabase migrations are forward-only and must run against the remote instance per `AGENTS.md`; we cannot edit the consolidated migration in place.
- Other statuses (`occupied`, `out_of_service`) rely on the same function and must keep their existing semantics or downstream dashboards will break.
- Allocator conflict protection still depends on range overlap checks—changing the status logic must not weaken overlap enforcement.

## Open Questions (and answers if resolved)

- Q: What currently moves a table into the `'reserved'` state?
  A: The legacy `refresh_table_status` function marks a table reserved whenever `upper(window) > now()`, meaning any future allocation—even hours away—blocks the table for the remainder of the day (`supabase/migrations/20251019102432_consolidated_schema.sql:1272`).
- Q: Why does the UI continue to treat the table as unavailable even with no overlapping bookings?
  A: The floor plan component trusts `table.status`, so once the database sets `'reserved'`, the UI labels the table inactive regardless of conflict calculations (`src/components/features/dashboard/TableFloorPlan.tsx:160`).

## Recommended Direction (with rationale)

- Redefine `refresh_table_status` so tables become `'reserved'` only while the current timestamp lies inside an allocation window (`a."window" @> now()`), leaving them `'available'` before and after the actual seating window while maintaining `occupied` and `out_of_service` branches for checked-in and maintenance states.
- Deliver the change via a fresh Supabase migration (e.g., `CREATE OR REPLACE FUNCTION`) to keep history intact, then coordinate remote execution so ops dashboards immediately reflect accurate availability.
