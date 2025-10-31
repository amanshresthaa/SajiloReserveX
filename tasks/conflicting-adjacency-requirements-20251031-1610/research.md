# Research: Conflicting Adjacency Requirements

## Requirements

- Functional:
  - Ensure the allocator honours the `adjacency.queryUndirected` feature flag—when disabled, adjacency should behave directionally end-to-end without hidden reverse edges.
  - Keep existing workflows (manual selection, quoting, automatic assignment) functional when the flag remains at its default (`true`).
  - Update published business rules so operators understand the new behaviour.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Preserve allocator performance characteristics (no additional round-trips to Supabase).
  - Maintain data integrity constraints enforced by `validate_table_adjacency`.

## Existing Patterns & Reuse

- `supabase/schema.sql` defines trigger `sync_table_adjacency_symmetry` that auto-inserts/delete reverse edges, and trigger `table_adjacencies_sync` wires it up.
- `supabase/schema.sql` → function `assign_tables_atomic_v2` already checks adjacency in both directions via a single query (line ~1638 onwards), so it can tolerate directional storage.
- `server/capacity/tables.ts` function `loadAdjacency` currently pulls both `table_a` and `table_b` sets and always builds a symmetric map—ignores the feature flag.
- `server/feature-flags.ts` exposes `isAdjacencyQueryUndirected()`, already injected into telemetry.
- `docs/table-assignment-business-rules.md` documents the symmetric trigger and the feature flag; needs alignment with the new behaviour.
- Seeds at `supabase/seeds/capacity-fixtures.sql` intentionally mix directed/undirected inserts to exercise the flag.

## External Resources

- [docs/table-assignment-business-rules.md](../../docs/table-assignment-business-rules.md#6-feature-flags--runtime-toggles-serverfeature-flagsts) – documents current policy language for adjacency symmetry and the query flag.
- [supabase/seeds/capacity-fixtures.sql](../../supabase/seeds/capacity-fixtures.sql) – shows expected data shapes (directed chain vs. dense cluster) used in tests.

## Constraints & Risks

- Supabase is remote-only; changes must be delivered as migrations and not applied locally.
- Removing the symmetry trigger leaves historical reverse edges in place; downstream clean-up may be required to fully eliminate auto-generated pairs.
- Directional graphs can block merges if operators relied on implicit reverse edges; rollout must emphasise that `adjacency.queryUndirected` defaults true.
- Need to ensure TypeScript tests that currently assume undirected adjacency remain green (default flag true) while adding coverage for the directional path.

## Open Questions (owner, due)

- Q: Do we need a follow-up data migration to remove previously auto-inserted reverse edges? (Owner: Ops Eng, 2025-11-05)
  A: Pending confirmation from data stewardship team—outside scope for this code change but should be tracked.

## Recommended Direction (with rationale)

- Drop `sync_table_adjacency_symmetry` and its trigger via a Supabase migration, leaving `validate_table_adjacency` as the sole guard; this removes implicit edge creation so the feature flag can control behaviour transparently.
- Update `loadAdjacency` (and any shared helpers) to branch on `isAdjacencyQueryUndirected()`—when false, return edges exactly as stored; when true (default) continue to surface an undirected map.
- Add regression tests covering both flag states to ensure manual validation and planner logic respect directional graphs.
- Refresh business rules documentation to explain the removal of the symmetry trigger and clarify how operators should manage edge directionality.
