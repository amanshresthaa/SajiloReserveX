# Research: Booking Table Release Bug

## Existing Patterns & Reuse

- Manual assignment context (`server/capacity/tables.ts`) already computes per-table scheduling conflicts via `computeBookingWindow` and `windowsOverlap`.
- The Ops dashboard floor plan (`src/components/features/dashboard/TableFloorPlan.tsx`) consumes those conflicts plus active holds to decide which tables are interactive.
- Supabase function `refresh_table_status` (latest definition in `20251026180000_fix_assign_tables_atomic_v2_table_id_v2.sql`) centralises status updates when allocations change.

## External Resources

- Supabase migration `20251026180000_fix_assign_tables_atomic_v2_table_id_v2.sql` – defines the current `assign_tables_atomic_v2` procedure and triggers `refresh_table_status`.
- Enum definition of `public.table_status` in `supabase/migrations/20251019102432_consolidated_schema.sql` lists valid statuses (`available`, `reserved`, `occupied`, `out_of_service`).

## Constraints & Risks

- No background job re-runs `refresh_table_status` when booking windows elapse, so tables can remain with a `reserved` status after the allocation has ended.
- UI currently treats every non-`available` status as non-interactable, so stale statuses translate into tables that appear blocked all day.
- Need to preserve hard blocks for genuinely inactive tables (`out_of_service`) while continuing to respect conflict/hold data.

## Open Questions (and answers if resolved)

- Q: Why does booking 1 continue to monopolise the table for later bookings?
  A: The DB status remains `reserved` because nothing re-invokes `refresh_table_status` once the window expires; the UI interprets that status as a permanent block despite there being no overlapping conflict in `ManualAssignmentConflict`.

## Recommended Direction (with rationale)

- Shift the Ops UI to derive interactivity from the computed conflicts/holds and only treat structural statuses (e.g., `out_of_service` or inactive tables) as hard blocks. This sidesteps stale status data without requiring DB-side scheduling.
