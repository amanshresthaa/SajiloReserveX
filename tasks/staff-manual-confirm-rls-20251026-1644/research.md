# Research: Manual Hold Confirmation RLS Fix

## Existing Patterns & Reuse

- Existing RLS conventions in `supabase/migrations/20251019102432_consolidated_schema.sql` grant full table access to the `service_role` via `USING (true)` policies and restrict staff access with `public.user_restaurants()` checks (e.g., `table_inventory`, `allocations`).
- Prior task `tasks/staff-manual-confirm-permission-20251026-1631/` added `supabase/migrations/20251026163200_grant_table_hold_access.sql` to grant `SELECT` on `table_holds` / `table_hold_members` to `authenticated`, but no RLS policies were created.
- Manual hold APIs (`src/app/api/staff/manual/{hold,confirm}/route.ts`) use the route handler Supabase client (`authenticated` JWT) to look up hold metadata, mirroring the pattern used for bookings and memberships.

## External Resources

- [Supabase RLS docs](https://supabase.com/docs/guides/auth/row-level-security) – confirm syntax for `CREATE POLICY` and `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

## Constraints & Risks

- Enabling RLS without adding `service_role` policies would block allocator primitives that run with the service client.
- Policies must scope staff access by `restaurant_id` to avoid leaking cross-restaurant data in multi-tenant environments.
- Supabase migrations execute remotely; SQL must be idempotent to survive repeated deploys.

## Open Questions (and answers if resolved)

- Q: Do staff need to read `table_hold_members` directly?
  A: The manual confirm route only selects hold metadata, but shared helpers (e.g., `listActiveHoldsForBooking`) request `table_hold_members(...)`. To keep future queries safe, mirror the same visibility rules on `table_hold_members`.
- Q: Is realtime replication required for `table_holds`?
  A: It is already subscribed via `useManualAssignmentContext`, but publication changes are managed elsewhere; RLS updates do not affect replication.

## Recommended Direction (with rationale)

- Add a new Supabase migration that:
  - Enables RLS on `table_holds` and `table_hold_members`.
  - Grants explicit CRUD privileges to `service_role` and `SELECT` to `authenticated` (harmless to repeat alongside the earlier grant migration).
  - Creates `service_role` policies with `USING (true) WITH CHECK (true)` so allocator helpers keep working under the service client.
  - Creates `authenticated` `SELECT` policies that require `restaurant_id IN (SELECT public.user_restaurants())`, providing least privilege.
  - Adds a matching `SELECT` policy on `table_hold_members` by joining through the parent hold’s `restaurant_id`.
- Update task docs/plan to capture the new verification steps (API regression test, manual confirm happy path).
