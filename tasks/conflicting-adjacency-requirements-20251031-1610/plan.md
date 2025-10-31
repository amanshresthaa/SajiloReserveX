# Implementation Plan: Conflicting Adjacency Requirements

## Objective

Ensure adjacency storage and query behaviour are consistent: when `adjacency.queryUndirected` is disabled the allocator respects directional edges, and documentation no longer claims automatic symmetry.

## Success Criteria

- [ ] Supabase schema no longer injects reverse edges; new migration drops `sync_table_adjacency_symmetry` trigger/function.
- [ ] `loadAdjacency` honours the feature flag (unit test coverage for both true/false paths).
- [ ] Business rules doc reflects the new storage rule and clarifies the flag behaviour.

## Architecture & Components

- Supabase: remove trigger `table_adjacencies_sync` + function `sync_table_adjacency_symmetry`, keep `validate_table_adjacency`.
- Server allocator (`server/capacity/tables.ts`): update `loadAdjacency` helper and any call sites relying on symmetric map.
- Tests (`tests/server/capacity/manualSelection.test.ts` et al.): add coverage for directional scenario via feature flag override.
- Documentation (`docs/table-assignment-business-rules.md`): update rules and risk notes.

## Data Flow & API Contracts

- `loadAdjacency(tableIds, client)` fetches edges from `public.table_adjacencies`; now conditionally mirrors edges locally based on `isAdjacencyQueryUndirected()`.
- `assign_tables_atomic_v2` already counts edges in both directions—no contract change but verify SQL remains compatible post-trigger removal.

## UI/UX States

- Not applicable (back-end & documentation change only).

## Edge Cases

- Directional adjacency graph where outgoing edges originate from a table other than the first selected (ensure BFS handles order deterministically).
- Restaurants with no adjacency edges (map should remain empty).
- Historical data retaining reverse edges—documented in risks; no automatic cleanup in this change set.

## Testing Strategy

- Unit: extend `tests/server/capacity/manualSelection.test.ts` to assert behaviour when `isAdjacencyQueryUndirected()` returns false.
- Integration: rely on existing allocator integration tests to ensure undirected default path stays green.
- E2E / Accessibility: not applicable for this change.

## Rollout

- Feature flag: `adjacency.queryUndirected` (default true) continues to gate behaviour—no new flag.
- Exposure: deploy migration + code together; flag consumers can opt into directional mode immediately.
- Monitoring: observe allocator logs/telemetry for adjacency validation failures post-deploy.
- Kill-switch: revert flag to true or roll back migration if unexpected directional behaviour occurs.
