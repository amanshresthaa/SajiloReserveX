# Research: Table Selection Yield Management

## Requirements

- Functional:
  - Complete pre-sprint groundwork: finalize data models for demand profiles and table scarcity calculations, collect stakeholder input on high-value table attributes, and validate performance feasibility of lookahead queries.
  - Sprint 1 focus: calculate and expose per-table scarcity scores, design a configurable demand profile store (per venue / service window multipliers), refactor the scoring function to combine slack, scarcity, and demand multipliers, add configurable weights, expand unit/integration tests, and enhance logging with score breakdowns.
  - Sprint 2 focus: introduce dynamic combination penalties that react to scarcity, prioritize adjacent table merges, refactor planner diagnostics to surface combination scoring inputs, and extend QA coverage for combination-heavy scenarios.
  - Sprint 3 focus: implement configurable lookahead windows that inspect future confirmed bookings, apply conflict penalties that protect scarce table inventory, profile & optimize query paths to maintain SLA, and create end-to-end scenario tests covering an entire service period.
  - Rollout: support shadow-mode evaluation, targeted A/B rollout, monitor KPIs (occupancy, rejected bookings, RevPASH), and prepare for full deployment when metrics improve.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Preserve existing latency targets (selector P95 < 500 ms) even after adding demand/lookup logic and lookahead queries.
  - Maintain deterministic behavior for identical inputs to avoid oscillating assignments when shadow-mode compares decisions.
  - Ensure telemetry/log payloads avoid PII (current sanitization in `server/capacity/telemetry.ts`) while adding score breakdown fields.
  - Follow Supabase remote-only policy for schema changes; coordinate migrations and document rollback plans.
  - Keep configuration multi-tenant ready (per-restaurant overrides) and localizable schedule definitions (timezones already handled via `luxon`).

## Existing Patterns & Reuse

- `server/capacity/selector.ts` already calculates candidate metrics (overage/slack, tableCount, fragmentation, zoneBalance, adjacencyCost) and ranks plans via configurable weights—ideal insertion point for scarcity/demand weighting without rewriting enumeration.
- `SelectorScoringConfig` and `SelectorScoringWeights` in `server/capacity/policy.ts` expose defaults and cloning helpers consumed across services (`server/capacity/tables.ts`, `server/capacity/v2/planner.ts`, exported via `server/capacity/types.ts`), so extending these types keeps downstream consumers aligned.
- Table metadata loading (`loadTablesForRestaurant` in `server/capacity/tables.ts`) already fetches capacity, category, zone, seating type—inputs we can reuse to derive scarcity classifications without new queries.
- Telemetry utilities (`server/capacity/telemetry.ts`) centralize candidate logging and sanitization; augmenting `CandidateSummary` and decision events here will propagate to shadow-mode logging and diagnostics automatically.
- Feature-flag helpers (`@/server/feature-flags`) govern combination planner, adjacency requirements, and selector scoring toggles, providing a mechanism to gate new behaviors for controlled rollout.

## External Resources

- Pending stakeholder interviews with restaurant managers/ops to validate demand profiles and critical table attributes (window seats, booths, etc.).
- Supabase schema documentation (`supabase/schema.sql`) will guide migration shape for demand/lookup tables.
- Prior task artifacts (e.g., `tasks/optimize-table-assignment-20251030-1034`) describe planner priorities that we should align with when changing scoring.

## Constraints & Risks

- Introducing new weights risks regressions in auto-assignment ordering; must support feature flag toggles and shadow comparisons before enforcing decisions.
- Scarcity scoring needs a consistent definition of “table type” (capacity vs. category vs. zone); inconsistency could misallocate valuable tables.
- Demand multipliers may vary by restaurant/timezone, requiring careful cache invalidation and timezone conversions to avoid off-by-one service windows.
- Lookahead queries over future bookings could increase load on `bookings`/`table_assignments`; need indexes and bounded windows to protect API latency budgets.
- Logging additional score components increases payload size; ensure observability ingestion limits are respected and sensitive data stays redacted.
- Remote-only Supabase migrations mean coordination and rollback plans are mandatory; any mistakes impact shared staging/prod environments.

## Open Questions (owner, due)

- Q: What dimensions define a “table type” for scarcity (capacity, category, zone, physical attributes)? (Owner: Product Owner, Due: before Sprint 1 kickoff)
  A: …
- Q: Are demand multipliers global, per restaurant, or per service segment, and how frequently will ops adjust them? (Owner: Product Owner, Due: before schema finalization)
  A: …
- Q: What weights should default scarcity vs. slack vs. demand contributions use, and do they require per-venue overrides? (Owner: Product Owner + Eng Lead, Due: mid Sprint 1)
  A: …
- Q: For lookahead, which booking statuses qualify as “future conflicts” and what default time window should apply? (Owner: QA Engineer + Product Owner, Due: Sprint 3 planning)
  A: …
- Q: Do we surface new telemetry fields in existing dashboards, and who will consume the shadow-mode comparison output? (Owner: Analytics, Due: before shadow rollout)
  A: …

## Recommended Direction (with rationale)

- Model demand profiles and scarcity data in Supabase: create normalized tables for demand multipliers (per restaurant, day-of-week, service window) and a cached table scarcity table keyed by restaurant_id/table_type, computed by a scheduled job that runs on inventory changes—keeps runtime scoring lightweight.
- Extend `SelectorScoringConfig` with new fields (`scarcityWeight`, `demandWeight`, default demand multiplier fallback) while preserving backwards compatibility by defaulting to neutral values when feature flags disabled.
- Augment `buildScoredTablePlans` to accept precomputed table metadata (scarcity score, demand multiplier for the request window) and calculate component scores alongside existing metrics; maintain the current enumeration logic and only adjust ranking via new weighted terms.
- Introduce a scoring diagnostics structure that captures slack, scarcity, demand, and combination penalties per candidate; log these via `telemetry.ts` to satisfy enhanced logging/analytics requirements and support shadow comparisons.
- Implement new behavior behind feature flags (e.g., `isSelectorYieldManagementEnabled`, `isSelectorLookaheadEnabled`) and add a shadow execution pathway that logs recommended assignments without committing them, enabling A/B and progressive rollout.
- For lookahead, leverage existing `table_assignments`/`bookings` queries with bounded windows and appropriate indexes; reuse the planner’s adjacency/capacity checks to simulate future conflicts without duplicating logic.
- Plan unit/integration tests around representative fixture data covering peak/off-peak demand, scarcity preservation, and combination strategies, and expand QA automation to incorporate the new logging assertions.
