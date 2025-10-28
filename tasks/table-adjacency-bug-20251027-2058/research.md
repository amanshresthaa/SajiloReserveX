# Research: Table adjacency enforcement bug

## Existing Patterns & Reuse

- `server/capacity/tables.ts` already exposes `evaluateManualSelection`, `buildManualChecks`, and `evaluateAdjacency` utilities for validating manual table assignments.
- Adjacency data for tables is sourced from the Supabase `table_adjacencies` table via the `loadAdjacency` helper in the same module.
- Unit coverage exists in `tests/server/capacity/manualSelection.test.ts`, which expects bidirectional adjacency rows ([tests/server/capacity/manualSelection.test.ts:300](tests/server/capacity/manualSelection.test.ts:300)).

## External Resources

- Next.js MCP runtime (`port 3000`) exposes `get_errors`, which currently reports runtime issues on `/ops` but no direct server crash related to adjacency; manual validation failures surface via API responses rather than dev server logs.

## Constraints & Risks

- Feature flag `allocator.requireAdjacency` defaults to `true` (`server/feature-flags.ts:48`), so multi-table selections will always enforce adjacency unless explicitly disabled.
- Supabase data seems to store only one directed edge per adjacency pair (e.g., `table_a -> table_b`) instead of both directions, meaning BFS checks fail when the first selected table does not own the outgoing edge.
- Supabase RPC `assign_tables_atomic_v2` repeats the same directed-only assumption, so hold confirmation also trips adjacency errors when rows are single-directional.
- Changing adjacency behavior must respect remote Supabase data; we cannot mutate schema locally per repo rules.

## Open Questions (and answers if resolved)

- Q: Why does the manual validation surface "Tables must be adjacent" even when the tables are connected in the floor plan?
  A: The adjacency map built by `loadAdjacency` only includes neighbors sourced from `table_a` rows. If the selection order starts with a table that only appears as `table_b`, the BFS never discovers the rest of the selection, producing a false negative.

## Recommended Direction (with rationale)

- Ensure `loadAdjacency` (or a downstream helper) inserts both directions into the adjacency map so traversal works regardless of selection order. This aligns with existing unit tests, removes reliance on data duplication, and prevents false "not adjacent" errors when adjacency enforcement is enabled.
- Recreate `assign_tables_atomic_v2` so its adjacency enforcement reads edges in either direction, avoiding RPC-level 409s during manual hold confirmation.
- Handle duplicate booking-table rows gracefully in `assign_tables_atomic_v2` by updating existing assignments for the same booking/table instead of throwing `assignment duplicate` errors when re-confirming holds.
