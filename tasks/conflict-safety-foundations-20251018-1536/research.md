# Research: Conflict Safety Foundations & Manual Path

## Existing Patterns & Reuse

- `supabase/migrations/20251018103000_inventory_foundations.sql` already creates `public.allocations` with `block_start`/`block_end`, `resource_type`, `resource_id`, `shadow`, and exposes helper `public.allocations_overlap(resource uuid, rtype text, start_at timestamptz, end_at timestamptz)`. No EXCLUDE constraint exists yet.
- `supabase/migrations/20251016092000_create_booking_table_assignments.sql` introduces `booking_table_assignments` plus RPCs `assign_table_to_booking` and `unassign_table_from_booking`, but they assign tables sequentially and lack concurrency safety or idempotency.
- `table_inventory` schema (20251016091800) already tracks `status`, `zone_id`, `category`, and enforces RLS via `public.user_restaurants()`. Merge infrastructure (`merge_groups`, `merge_group_members`) exists but is unused.
- Frontend manual assignment flow lives in `BookingDetailsDialog` + `useOpsTableAssignmentActions`, calling `/api/ops/bookings/[id]/tables` and `/api/ops/bookings/[id]/tables/[tableId]`, which proxy to the server helpers above.
- Feature-flag plumbing is centralized in `config/env.schema.ts` + `lib/env.ts`, exposing booleans under `env.featureFlags.*`.

## External Resources

- [PostgreSQL EXCLUDE constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION) — confirm syntax for `DEFERRABLE INITIALLY DEFERRED` range-overlap prevention.
- [PostgreSQL range types](https://www.postgresql.org/docs/current/rangetypes.html) — verify `[start,end)` half-open semantics and `tstzrange` behaviour with `btree_gist`.

## Constraints & Risks

- Altering `public.allocations` removes `block_start`/`block_end`; must backfill into `tstzrange` before dropping to avoid NULL violations if data already exists (repo suggests empty table, but cannot assume).
- EXCLUDE constraint will reject overlapping writes immediately; need to wrap new RPC logic in a transaction so conflict errors roll back merge + assignments atomically.
- Manual path must remain stable with feature flag off (legacy RPC) and auto-assignment still depends on old helpers; introducing breaking changes to `assignTableToBooking` signature would cascade.
- Computing booking windows on the route relies on `start_at`/`end_at`; if absent we must derive from `booking_date`, `start_time`, `end_time`, and restaurant timezone, otherwise RPC will lack a valid range.
- `Idempotency-Key` uniqueness must accommodate retries without blocking legitimate reassignments; partial unique index `(booking_id, idempotency_key)` should filter NULL values.
- Need to keep RLS aligned with `user_restaurants()`; staff must never observe allocations from other restaurants, yet service_role still requires unrestricted write access.

## Open Questions (and answers if resolved)

- Q: How should we compute the `window` argument when `start_at` / `end_at` are null?  
  A: Fall back to combining `booking_date` + `start_time`/`end_time` with the restaurant timezone. If `end_time` is missing, derive via duration helpers used during booking creation.
- Q: Can we extend `assign_tables_atomic` signature to accept `idempotency_key` even though spec omits it?  
  A: Yes—make it optional (`DEFAULT NULL`) so we can persist the header in `booking_table_assignments` without breaking future consumers.
- Q: Do existing migrations already enable `btree_gist`?  
  A: `20250101000000_remote_schema.sql:20` creates the extension. Migration can still issue `CREATE EXTENSION IF NOT EXISTS` to guard environments.

## Recommended Direction (with rationale)

- Add a dedicated migration that reshapes `public.allocations` to the target schema, migrates existing timestamps into `tstzrange`, enforces the EXCLUDE constraint, replaces the helper with `allocations_overlap(a tstzrange, b tstzrange)`, and tightens RLS to `user_restaurants()`. Ensures conflict detection lives at the database layer.
- Extend `booking_table_assignments` with `idempotency_key` + partial unique index, preserving existing `(booking_id, table_id)` uniqueness, and update Supabase-generated types accordingly.
- Implement new RPCs `assign_tables_atomic` / `unassign_tables_atomic` (SECURITY DEFINER) that encapsulate validation, merge-group persistence, dual writes to `allocations`, booking assignment upserts, and table status updates in one transaction. Include optional `idempotency_key`.
- Introduce feature-flagged server helpers so manual routes call the new RPCs when `FEATURE_ASSIGN_ATOMIC` is enabled, propagating `Idempotency-Key` and precomputing the booking window while falling back to legacy RPC otherwise.
- Update ops UI to surface a non-blocking conflict warning (instead of disabling options) by leveraging existing `conflictingTableIds`, aligning operator expectations with stricter backend enforcement.
