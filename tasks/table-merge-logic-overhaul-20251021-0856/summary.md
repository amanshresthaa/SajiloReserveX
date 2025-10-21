# Table Merge Logic Summary & Acceptance Criteria

## Updated Logic

- **Adjacency Normalisation**: `buildScoredTablePlans` now constructs an undirected adjacency map before the breadth-first search. For every edge `A → B` returned from Supabase, the selector injects the reverse edge `B → A` if it was missing, ensuring merge evaluation sees the full connected component.
- **Diagnostics**: Whenever the selector adds a reverse edge, it increments `diagnostics.skipped["adjacency_asymmetry"]`. If no merge plans survive, the fallback message highlights asymmetric adjacency so data issues surface quickly.
- **Plan Enumeration & Scoring**: Singles are still registered first; adjacency-connected merges (up to three tables, within overage limits, same zone, merge-eligible) follow. Weighted metrics (`overage`, `tableCount`, `fragmentation`, `zoneBalance`, `adjacencyCost`) continue to rank candidates deterministically.
- **Downstream Behaviour**: Merge metadata (`mergeType`, `tableKey`, per-table memberships) remains unchanged. Ops UI keeps rendering each physical table plus the “Merge M…” banner via `inferMergeInfo`, and telemetry receives the new diagnostic inside `emitSelectorDecision`s payload.

## Acceptance Criteria

- [x] Directional adjacency data still produces merge plans; unit test `buildScoredTablePlans` passes for directional edges.
- [x] `adjacency_asymmetry` diagnostic increments when reverse edges were inferred.
- [x] No regression in existing selector tests (`pnpm vitest run tests/server/capacity/selector.scoring.test.ts`).
- [x] Legacy typography/UI behaviour unchanged (no contract shifts for Ops components).
- [x] Feature remains behind `FEATURE_SELECTOR_SCORING`; disabling the flag reverts to legacy merge logic.
