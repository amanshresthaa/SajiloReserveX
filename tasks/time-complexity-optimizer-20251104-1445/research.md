# Research: Time Complexity Optimizations (selector/lookahead/legacy conflicts)

## Requirements

- Reduce worst-case enumeration cost in `server/capacity/selector.ts` without changing selection correctness for common cases.
- Cap lookahead complexity in `server/capacity/tables.ts#evaluateLookahead` while preserving useful penalization/blocking behavior.
- Push legacy conflict filtering into the database in `server/capacity/holds.ts#findHoldConflictsLegacy` to avoid N\*M in-process scans.

## Existing Patterns & Reuse

- Selector already prunes by capacity bounds, per-slack bucket size, evaluationLimit, and timeout.
- Lookahead reuses `buildScoredTablePlans` and selector limits; no plan/time budget.
- Legacy conflicts path does app-side filtering after broad query.

## External Resources

- Branch-and-bound/beam search heuristics for combinatorial planning — reduce explored seeds.
- PostgreSQL join filter via PostgREST `!inner` and nested filter paths for efficient row reduction.

## Constraints & Risks

- Must keep deterministic ordering and scoring. Heuristic seed limiting must be conservative and well‑instrumented.
- Lookahead must remain optional and bounded; avoid long-tail latency spikes.
- Supabase/PostgREST version differences for nested `!inner` filters; fallback behavior remains unchanged otherwise.

## Open Questions (owner, due)

- Q: Should lookahead consider more than 20 plans in high-value venues?
  A: Defaults to 20; tunable later via feature flag if needed (owner: eng, due: post‑deploy).

## Recommended Direction (with rationale)

- Add heuristic seed limiting in selector DFS: restrict base seeds to top-N by deficit and adjacency degree. Preserves pruning; improves early discovery; avoids full cross product.
- Add lookahead guardrails: plan cap (top 20), time budget, and a fast capacity upper‑bound precheck to skip expensive planning when infeasible.
- Rewrite legacy conflict query to push `table_hold_members` filter into SQL with `!inner` and `.in()` on member ids.
