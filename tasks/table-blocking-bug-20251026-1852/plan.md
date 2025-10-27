# Implementation Plan: Table blocking for partial-day reservations

## Objective

We will diagnose why partially reserved tables remain blocked all day so that we can restore accurate availability windows.

## Success Criteria

- [x] Identify the code path responsible for table blocking duration
- [x] Document root cause and propose fix plan (if needed)

## Architecture & Components

- Supabase trigger `refresh_table_status` (defined in `supabase/migrations/20251019102432_consolidated_schema.sql`) mutates `table_inventory.status` when `allocations` change.
- Allocation windows originate from the `assign_tables_atomic_v2` RPC invoked by `server/capacity/tables.ts` during manual/automatic table assignment flows.

## Data Flow & API Contracts

- `/api/ops/bookings` → `server/ops/bookings.ts` consumes `table_inventory.status` to color/flag tables in the Ops dashboard; status currently flips to `reserved` for any future allocation.
- `assign_table` actions call `assign_tables_atomic_v2`, which writes to `allocations` with a `tstzrange` window; the `refresh_table_status` trigger reacts to those writes.

## UI/UX States

- Ops dashboard table list should reflect “available” until the reservation window actually begins; only during the scheduled block should the table read as “reserved”.

## Edge Cases

- Maintenance (`allocations.is_maintenance = true`) still forces `out_of_service`.
- Checked-in bookings must continue to mark tables `occupied`.
- Tables with overlapping allocations must remain protected by allocator logic even if their status stays `available` before the window.

## Testing Strategy

- Unit/E2E: rely on existing allocator overlap tests; manual SQL inspection if needed.
- Regression: run migration lint (`pnpm lint:schema` if available) or ensure SQL compiles.
- Manual: verify that `allocations` rows with future start/end leave `status` as `available` until `now()` enters the window.

## Rollout

- Create forward-only SQL migration to redefine `refresh_table_status`.
- After deploying, run Supabase migration remotely; monitor Ops dashboard for expected status transitions.

## UI/UX States

- Not in scope yet

## Edge Cases

- TBD

## Testing Strategy

- TBD

## Rollout

- TBD
