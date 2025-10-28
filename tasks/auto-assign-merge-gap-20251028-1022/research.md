# Research: Auto Assign Skips Merge Tables

## Existing Patterns & Reuse

- `autoAssignTablesForDate` (`server/capacity/tables.ts:1990-2130`) builds plans via `buildScoredTablePlans` with `enableCombinations` driven by `isCombinationPlannerEnabled()`. When that flag is false, only single-table plans are considered.
- Combination plans also require adjacency (`requireAdjacency: isAllocatorAdjacencyRequired()`), and the Supabase RPC enforces adjacency through `p_require_adjacency` (`supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:174-190`).
- Feature flags: `isAllocatorAdjacencyRequired()` defaults to `true`; `isCombinationPlannerEnabled()` mirrors `FEATURE_COMBINATION_PLANNER` or `allocator.mergesEnabled` (which is `!isProduction` by default).
- Mock-based tests (`tests/server/capacity/autoAssignTables.test.ts`) already highlight skip reasons mentioning “Combination planner disabled,” signalling current behaviour.

## External Resources

- Supabase MCP query shows `table_adjacencies` completely empty (`count = 0`, via `SELECT count(*) FROM public.table_adjacencies`), so adjacency checks always fail when merges are required.
- Planner logic (`server/capacity/selector.ts`) stops evaluating combinations when adjacency constraint is unmet, incrementing `diagnostics.skipped.adjacency`.

## Constraints & Risks

- Enabling merges without adjacency data risks producing plans that staff cannot actually seat, but current behaviour (flat skip) blocks all multi-table bookings.
- Requiring adjacency when the graph is empty causes the Supabase RPC to raise `Table % is not adjacent...`; we must avoid toggling the flag in those cases or populate adjacency before attempting merges.
- Combination planner is feature-gated; any fallback that forces combinations must respect operational guardrails (e.g., only when single-table capacity is insufficient).

## Open Questions (and answers if resolved)

- Q: Is lack of adjacency data the sole reason merges fail?  
  A: Yes—`table_adjacencies` has zero rows; with `requireAdjacency=true` both planner and RPC reject merges.
- Q: Should we bypass the combination planner flag automatically?  
  A: We can attempt a fallback when singles fail and merges are otherwise allowed; still log when the flag was disabled so product can monitor.
- Q: Do we risk regressions by disabling adjacency when graph empty?  
  A: Supabase currently verifies adjacency only when `p_require_adjacency` true; toggling it off per-restaurant when no edges exist prevents runtime exceptions without changing venues that have adjacency configured.

## Recommended Direction (with rationale)

- Detect whether an adjacency graph exists for the target restaurant/day; if none, treat adjacency as optional for both planner and orchestrator calls.
- If single-table planning yields no candidates and the combination planner flag is off, perform a fallback combination pass to recover merge plans, and surface a more precise skip reason when merges still aren’t possible.
- Update `loadAdjacency` to register bidirectional edges (simplifies planner checks) and extend tests to cover merge success when adjacency data is missing.
