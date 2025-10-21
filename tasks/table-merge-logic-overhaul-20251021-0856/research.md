# Research: Table Merge Logic Overhaul

## Existing Patterns & Reuse

- **Scored candidate generation** (`server/capacity/selector.ts:72`): `buildScoredTablePlans` enumerates single tables first, then breadth-first expands adjacency-connected sets (max `config.maxTables`, default 3) while enforcing merge eligibility, same zone, and overage caps. This produces `RankedTablePlan` objects sorted by weighted metrics (`overage`, `tableCount`, `fragmentation`, `zoneBalance`, `adjacencyCost`).
- **Legacy merge fallback** (`server/capacity/tables.ts:519`): When `selectorScoring` feature flag is off, the system still returns deterministic two-table merge templates (2+4 or 4+4) with handcrafted fallback reasons, ensuring backwards compatibility.
- **Table loading & merge eligibility** (`server/capacity/tables.ts:1000`): Tables are considered mergeable only when `category="dining"`, `seating_type="standard"`, `mobility="movable"`, and capacity is 2 or 4. Adjacency is built from `table_adjacencies` rows into a `Map<string, Set<string>>` that the selector uses.
- **Assignment loop & diagnostics** (`server/capacity/tables.ts:728`): Auto-assignment pulls the ranked plans from `generateTablePlans`, tries each combo atomically against Supabase, and logs structured telemetry via `emitSelectorDecision`, including plan metrics and skip reasons.
- **UI representations** (`src/components/features/dashboard/BookingsList.tsx:62`, `src/components/features/dashboard/BookingDetailsDialog.tsx:32`): The Ops dashboard surfaces merged tables as multiple rows with an aggregated “Merge M{capacity}” banner, relying on `inferMergeInfo` (`src/utils/ops/table-merges.ts:46`) to infer labels/patterns from capacity pairs.
- **Test coverage** (`tests/server/capacity/selector.scoring.test.ts:16`, `tests/server/capacity/selector.performance.test.ts:3`): Unit tests assert scoring preferences (exact fits, permutation determinism, adjacency-limited merges) and verify performance bounds for dense adjacency graphs to prevent combinatorial blow-ups.
- **Feature flag plumbing** (`server/feature-flags.ts:20`, `lib/env.ts:72`): `FEATURE_SELECTOR_SCORING` toggles the new BFS-based selector; fallback to legacy logic remains available for gradual rollout or emergency disable.

## External Resources

- Internal module documentation: `server/capacity/README.md` outlines service responsibilities and integration points, reinforcing that selection logic feeds the wider capacity engine.
- PostgreSQL adjacency data source: Supabase table `table_adjacencies` is treated as directed; merge traversal assumes reciprocal entries exist (enforced by DB constraints/migrations documented in `supabase/migrations`).
- Prior architectural analysis: `tasks/selector-capacity-adjacency-observability-20251018-2342/research.md` and `plan.md` capture historical rationale for moving to scoring-based merges and highlight observability expectations—useful to avoid regressions.
- Front-end contract tests: `tests/ops/bookings-list.badges.test.tsx:73` demonstrates expected UI copy once a merge occurs (“Tables … · Merge M6 (2+4)”), ensuring any backend changes preserve information needed for rendering.

## Constraints & Risks

- **Process**: Must follow AGENTS.md phases, document assumptions in `todo.md`, and provide DevTools MCP QA for any Ops UI adjustments. Coding cannot begin until plan is approved.
- **Performance ceilings**: BFS expansion must stay under ~250 ms for dense adjacency graphs (see `tests/server/capacity/selector.performance.test.ts:38`). Increasing max tables or relaxing pruning risks exponential blow-up.
- **Data integrity**: Adjacency map assumes symmetric edges. Missing reverse edges cause `no_adjacency` skips, so new logic must either enforce symmetry or tolerate asymmetry without blocking valid merges.
- **Operational safety**: Auto-assignment runs in production; regressions could double-book tables. Need strong unit tests plus, ideally, integration tests or feature flag guardrails.
- **UI expectations**: Ops dashboard expects each physical table separately so staff can unassign individually while still showing merge metadata. Any proposal to collapse into synthetic “merged table” entities would require broader UI change.
- **Supabase remote-only**: Schema or data changes must target remote DB and be coordinated; avoid introducing logic requiring new migrations unless planned with maintainers.
- **Telemetry**: `emitSelectorDecision` consumers likely depend on existing payload shape. Extending diagnostics should be backward compatible or feature-flagged.

## Open Questions (and answers if resolved)

- Q: Should merge logic enforce adjacency symmetry internally rather than trusting the DB?  
  A: Current loader reads only edges where the table is `table_a`; we may need to augment logic to add reverse edges to avoid missing neighbours due to data asymmetry.
- Q: Do we need to support three-table merges in UI representations?  
  A: UI currently assumes multiple member rows; while badges focus on two-table patterns, the copy still handles arbitrary `members.length`, so backend can emit three-table merges with consistent metadata.
- Q: How is overage limit configured and can it be per restaurant?  
  A: `getSelectorScoringConfig` returns a hard-coded config (`maxOverage=2`, `maxTables=3`, weight constants). No per-venue overrides exist yet; any changes require config plumbing.
- Q: Does telemetry differentiate between single and merge assignments?  
  A: `emitSelectorDecision` receives `mergeType` from plan metadata (`server/capacity/tables.ts:671`), so instrumentation already captures type; ensure new merge types remain compatible.

## Recommended Direction (with rationale)

- **Document current behaviour comprehensively**: Capture BFS constraints, scoring weights, diagnostics, and UI dependencies within task artifacts to inform future maintainers.
- **Enhance adjacency handling**: Consider normalising the adjacency map to ensure undirected edges and enrich diagnostics when asymmetry is detected (prevents silent merge failures).
- **Refine scoring/constraints**: Explore dynamic weighting or additional metrics (e.g., party-to-capacity ratio) while maintaining deterministic ordering; adjust `maxOverage`/`maxTables` via config for flexibility.
- **Augment tests & telemetry**: Add regression tests covering three-table merges, asymmetric adjacency, and zone-specific merges; extend diagnostics to highlight data issues (e.g., missing reverse edge, zone mismatch counts).
- **Observe rollout safety**: Gate new merge logic behind existing `selectorScoring` flag or introduce granular flag to allow phased deploy, and document verification steps in `verification.md` for Ops QA.
