# Research: Table Merge Assignment Logic

## Existing Patterns & Reuse

- Core merge behaviour is implemented in the Supabase RPC `public.assign_tables_atomic_v2` (latest definition in `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql`), which handles table validation, adjacency enforcement, and merge group creation.
- Server-side helpers (`server/capacity/holds.ts:351` and `server/capacity/tables.ts:1538`) call the RPC for hold confirmations and manual assignments, then post-process assignment rows / idempotency ledgers.
- Merge allocations reuse the existing `public.allocations` table with `resource_type = 'merge_group'` to reserve capacity for a merged block while per-table allocations continue to use `resource_type = 'table'`.
- Idempotency is tracked via `booking_assignment_idempotency` rows (populated within the RPC and updated in server code when windows are normalized).

## External Resources

- Internal appendix doc `appendix.md` sections “RPC v2 core checks” (~L160+) summarises assign_tables_atomic_v2 expectations and merge-group data flow.
- Supabase schema migrations `20251026105000_assign_tables_atomic_v2.sql`, `20251027211000_assign_tables_atomic_v2_undirected.sql`, and `20251028034500_assign_tables_atomic_v2_alias_fix.sql` show the evolution of merge constraints and conflict handling.

## Constraints & Risks

- Merge support is gated by the presence of `booking_table_assignments.merge_group_id`; environments without the column bypass merge enforcement, so logic must remain backward compatible.
- All tables in a merge must be active, share the same restaurant/zone, and (when merged) have `mobility = 'movable'`; violation raises PostgreSQL exceptions (`23514`, `23503`).
- Adjacency enforcement depends on `table_adjacencies` being complete in both directions; the latest migration expands the check to treat edges as undirected, but missing entries still cause hard failures.
- Merge allocations rely on advisory locks per (zone, service_date); failures to acquire locks or conflicting allocations raise `allocations_no_overlap`, bubbling up as RPC errors.
- Idempotency mismatches (reusing a key with different table set) raise `P0003`, so clients must manage keys carefully.

## Open Questions (and answers if resolved)

- Q: How are duplicate booking-table rows handled during reassignments?
  A: The RPC uses `ON CONFLICT` + `COALESCE` updates; if a unique violation still occurs, it fallbacks to an explicit `UPDATE ... RETURNING`, ensuring rows are updated in place (migration `20251028034500`).
- Q: Does merge enforcement protect against partial updates when table inserts succeed but merge allocation fails?
  A: Yes—merge allocation is attempted before per-table inserts; any `unique_violation`/`exclusion_violation` aborts the transaction before individual rows are touched.

## Recommended Direction (with rationale)

- Focus analysis on the latest RPC body plus server callers to map validation, locking, idempotency, and merge-allocation side effects; confirm how failures propagate and where server code diverges (e.g., ledger normalization to `null` merge IDs).
