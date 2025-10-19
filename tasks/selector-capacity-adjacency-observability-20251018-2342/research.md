# Research: Selector Quality, Capacity Config, Adjacency Validation, Observability

## Existing Patterns & Reuse

- **Auto-assignment workflow (`server/capacity/tables.ts`)**: `autoAssignTablesInternal` loads tables, bookings, and adjacency data, then delegates to `generateTablePlans` for candidate enumeration and iterates candidates in the returned order. This is the natural insertion point for score-based ordering, deterministic tie-breaking, and capturing structured diagnostics.
- **Candidate generation (`generateTablePlans` in `server/capacity/tables.ts:482-580`)**: Currently supports singles plus specific merge templates (2+4 for 5-6 parties, 4+4 for 7-8) using adjacency membership, with fallback reasons captured. We can extend/replace this to perform adjacency-aware BFS up to k=3 tables while preserving existing constraints (same zone, merge-eligible flags) and fallback semantics so downstream callers stay stable.
- **Table + adjacency loading**: Existing adjacency map is built from `table_adjacencies` symmetric pairs (lines ~908-940). BFS traversal can reuse this map plus `mergeEligible` flags already computed when tables are fetched.
- **Feature flag plumbing**: `server/feature-flags.ts` + `lib/env.ts` expose boolean flags and environment schema. We can add `feature.selector.scoring`, `feature.capacity.config`, `feature.adjacency.validation`, `feature.ops.metrics` alongside existing ones, adhering to naming patterns (ENV var `FEATURE_*`).
- **Metrics pipeline**: `server/capacity/metrics.ts` wraps an RPC call for counters. We can extend/augment this module to expose new helper(s) for OpenTelemetry-like counters or fallback to Supabase RPC increments when telemetry backend unavailable. Downstream tests (`server/capacity/__tests__/transaction.test.ts`) already mock this module.
- **Observability**: `recordObservabilityEvent` (server/observability.ts) ingests JSON contexts into `observability_events`. We can re-use it for structured assignment decisions while also emitting console JSON for log streaming.
- **Ops dashboard UI**: `src/components/features/dashboard` offers cards, charts (e.g., `SummaryMetrics`, `CapacityVisualization`). We can compose a new dashboard module (likely inside `src/components/features/dashboard`) to display skip reasons & metrics, reusing `Card`, `Skeleton`, `LineChart` patterns already present. Query plumbing follows `queryKeys` + React Query (see `CapacityConfigClient`).
- **API conventions**: Ops APIs live under `src/app/api/ops/...` using Zod validation, structured responses, and Supabase auth checks. We'll add endpoints for allowed capacities & observability metrics following that style.
- **Database triggers/policies**: Existing Supabase migrations already create adjacency triggers enforcing same-zone + symmetry, so our new function/trigger can live near lines 240-340 in `20251018103000_inventory_foundations.sql` (or a new migration) to leverage prior patterns (PL/pgSQL with recursive CTE, RLS on tables).

## External Resources

- [PostgreSQL Recursive Queries](https://www.postgresql.org/docs/current/queries-with.html) – confirms approach for `are_tables_connected` (recursive traversal over adjacency edges).
- [WCAG 2.1 Success Criterion 1.4.3](https://www.w3.org/TR/WCAG21/#contrast-minimum) – to ensure any new dashboard visualizations maintain accessible contrast.
- [OpenTelemetry Metrics SDK design](https://opentelemetry.io/docs/specs/otel/metrics/) – reference for naming counters/histograms (`assignments_total`, `skipped_total{reason}`).
- [Graph BFS invariants](https://cp-algorithms.com/graph/bfs.html) – backing reference for candidate generation correctness (ensuring minimal cardinality path discovery).

## Constraints & Risks

- **Process constraints**: Must honor AGENTS.md phases—complete research/plan artifacts before implementation, document deviations in task folder, and avoid UI coding without DevTools MCP QA later.
- **Supabase remote-only**: Cannot run local migrations/seeds; we must craft SQL carefully and note manual verification steps for maintainers.
- **Feature flags**: New behaviour must be guardable (existing code expects legacy order/fallback); need to ensure default OFF to avoid regressions without full rollout.
- **Performance**: BFS candidate generation up to k=3 must remain performant for up to dozens of tables; need to prune via policy (e.g., stop expanding when capacity sum exceeds configured upper bound) to prevent combinatorial explosion.
- **Determinism**: Score/tie-breakers must yield stable ordering even when inputs are shuffled; property tests should cover permutations.
- **Database consistency**: Connectivity trigger must avoid false positives/negatives; recursive function must treat adjacency as undirected and respect zone_id equality to prevent cross-zone merges.
- **Front-end data freshness**: Dashboard metrics likely rely on eventual consistency (logs/metrics). Need caching strategy + failure handling to avoid blocking the Ops UI if telemetry backend lags.
- **Testing**: Property-based tests require deterministic seeding; we must ensure `vitest` config supports `test.each` or custom generator without flakiness. For SQL functions/triggers, direct execution may not be possible—will rely on migration reasoning + maybe unit tests that simulate with `supabase-js` mocks.

## Open Questions (and answers if resolved)

- **Q:** Where should scoring weights be sourced—env, database, or static config?  
  **A:** Requirement explicitly says "Config for weights in `server/capacity/policy.ts`"; we'll expose a typed config (with defaults + optional per-restaurant override hook) in that module, likely allowing injection via feature flag or future DB extension, but initial scope uses config constants.
- **Q:** How to persist allowed capacities for existing venues?  
  **A:** We'll seed `allowed_capacities` from distinct `restaurant_id`s present in `table_inventory` and default to {2,4,5,7}. Seeds (`supabase/seeds/seed.sql`) must populate this new table too.
- **Q:** Do we need to support capacities not currently present (e.g., 3,6)?  
  **A:** Acceptance criteria explicitly include 3 and 6, so endpoints + validations must read dynamic list to avoid hardcoding.
- **Q:** Should adjacency connectivity trigger allow merges for tables without adjacency entries (single-table merges)?  
  **A:** Trigger only applies to entries in `merge_group_members`; single-table groups should pass because `are_tables_connected` will treat single node as connected. We'll confirm the recursive function returns true for 0-1 nodes.
- **Q:** Where to expose metrics for the dashboard?  
  **A:** We'll add backend endpoint (likely `/api/ops/metrics/selector` or extend existing `/api/ops/dashboard` data) to aggregate counters and skip reasons. Implementation detail to be finalized in planning.
- **Q:** Logging backend expectations?  
  **A:** Structured logs should be emitted via `console.log(JSON.stringify(...))` for stream processing, but we can also pipe into `recordObservabilityEvent` for retention. We'll document both in plan.

## Recommended Direction (with rationale)

- **Subtask framing**: Break work into four domains—(1) selector scoring + tests, (2) capacity configuration (DB + API + seeds), (3) adjacency validation (SQL function/trigger + Supabase types), (4) observability (logging, metrics, UI). This aligns with sprint epics and limits cross-cutting risk.
- **Selector redesign**: Implement a dedicated module (e.g., `server/capacity/candidate-generator.ts`) or augment existing functions to (a) generate adjacency-aware combinations via BFS up to three tables, (b) compute score using new configurable weights, (c) return ranked list with deterministic ordering. Keep `generateTablePlans` API outwardly similar but now using scoring metadata, minimizing ripple.
- **Weight config**: Define `SelectorScoringWeights` + getter in `policy.ts`, defaulting to provided W1..W5, and expose a way to override (feature flag gating).
- **Property tests**: Add Vitest suites verifying monotonicity, preference for singles, deterministic order under shuffling, using randomly generated table sets (bounded) and the new scoring function.
- **Allowed capacities**: Introduce migration creating `allowed_capacities(restaurant_id uuid references restaurants, capacity smallint)`, enforcing uniqueness, RLS. Alter `table_inventory` to `ADD CONSTRAINT` referencing the composite key and remove old check. Update API validation to fetch allowed values at runtime (cache per restaurant with simple in-memory map in process or via React Query). Update seeds to insert defaults.
- **Adjacency validation**: Add PostgreSQL function `are_tables_connected(table_ids uuid[])` using recursive CTE over `table_adjacencies`, ensuring `same zone` check (either inside function or trigger). Create `BEFORE INSERT` trigger on `merge_group_members` to enforce connectivity and zone invariants. Document manual QA expectations in `verification.md`.
- **Observability**: Instrument auto-assignment to capture candidate list (top 3), chosen assignment, scores, and skip reasons. Use JSON logs + `recordObservabilityEvent` with new event types (e.g., `capacity.assignment.decision`). Extend metrics module to track counters/histograms; if OpenTelemetry not already wired, provide no-op fallback to avoid runtime failures.
- **Dashboard**: Provide API endpoint to aggregate metrics (counts, overage averages, merge rate, skip reasons by day) guarded by `feature.ops.metrics`. On UI, create new section within Ops dashboard (likely `Operations Insights`) with charts (bar/line) using existing `Card`/`Skeleton`, ensuring accessible colors. Cache via React Query with feature flag gating.
- **Documentation**: Update README/Docs if needed to describe allowed capacities + new features. We'll note any assumptions or follow-ups in task folder.
