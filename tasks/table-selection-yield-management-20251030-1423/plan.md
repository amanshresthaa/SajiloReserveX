# Implementation Plan: Table Selection Yield Management

## Objective

Enable the capacity selector to make revenue-aware table assignments by incorporating table scarcity, demand multipliers, dynamic combination penalties, and lookahead conflict avoidance—while preserving latency SLAs and surfacing transparent diagnostics.

## Success Criteria

- [ ] Scarcity and demand data models exist in Supabase with documented rollout/rollback steps; selector requests can resolve multipliers and scarcity scores for a restaurant/time window.
- [ ] Updated scoring algorithm prioritizes protecting scarce tables during peak demand and is validated via unit/integration tests covering Sprint 1 and Sprint 2 scenarios.
- [ ] Shadow-mode telemetry logs per-candidate score breakdowns (`slack_penalty`, `scarcity_penalty`, `demand_multiplier`, `combination_penalty`) and matches production decisions within acceptable tolerance before full rollout.
- [ ] Lookahead window prevents assignments that block higher-priority future bookings without pushing API latency beyond 500 ms P95 (benchmarked via automated tests).

## Architecture & Components

- Supabase schema additions (`demand_profiles`, `table_scarcity_metrics`) with migration scripts, backfill jobs, and documentation for remote execution.
- `server/capacity/scarcity.ts` (new): load/cache scarcity scores per restaurant + table type; expose helpers for selector and logging.
- `server/capacity/demand-profiles.ts` (new): resolve demand multipliers by restaurant, timezone-adjusted service window, and fallback defaults.
- `server/capacity/policy.ts`: extend `SelectorScoringConfig`/`SelectorScoringWeights` with scarcity/demand weights and lookahead penalties.
- `server/capacity/selector.ts`: augment candidate metrics & scoring pipeline (including combination penalty hook) and expose breakdown metadata.
- `server/capacity/tables.ts` & `server/capacity/v2/planner.ts`: wire demand/scarcity inputs into planner invocation, run lookahead checks, and propagate diagnostics/telemetry.
- `server/capacity/telemetry.ts`: enrich `CandidateSummary` and decision payload with score components for shadow/A/B analysis.
- `server/jobs/table-scarcity.ts` (new) and scheduler wiring: recompute scarcity cache on inventory changes; reuse job infrastructure in `server/jobs`.

## Data Flow & API Contracts

- Auto-assignment / quoting requests load table inventory → fetch scarcity cache + adjacency → resolve demand multiplier for booking window → call enhanced `buildScoredTablePlans` with new weights/context → optionally run lookahead against `bookings`/`table_assignments` within configured window → emit telemetry with score breakdowns → return ranked plans / holds.
- New Supabase RPC or SQL views (if needed) must stay read-optimized; no public API contract changes, but internal modules must document inputs/outputs for demand & scarcity helpers.

## UI/UX States

- No direct UI changes; operational dashboards consume telemetry. Manual QA will review DevTools logs and selector telemetry exports for correctness.

## Edge Cases

- Missing demand profile: default multiplier of 1.0 with warning telemetry to avoid null scores.
- Scarcity cache stale or absent: recompute on-demand and fall back to neutral score to prevent blocking assignments.
- Low-demand windows should not over-penalize slack; ensure multipliers clamp to sensible bounds.
- Lookahead conflicts must ignore cancelled/no-show bookings and respect service boundaries/timezone conversions.
- Combination planner must respect adjacency-disabled venues and cap evaluation limits even with new penalties.

## Testing Strategy

- Unit: selector scoring math, demand multiplier resolution (timezone/day-of-week), scarcity aggregation, lookahead penalty calculations.
- Integration: auto-assignment flow with seeded demand/scarcity data, ensuring telemetry reflects decisions; shadow-mode diff tests.
- E2E: service-period scenario tests (QA + automated) validating preservation of scarce tables and future booking protection across a booking sequence.
- Accessibility: Not applicable (service-only change); document in verification report.

## Rollout

- Feature flag: introduce `selector_yield_management`, `selector_dynamic_combinations`, and `selector_lookahead` flags to gate each sprint’s behavior.
- Exposure: deploy in shadow mode, then staged A/B rollout (5% → 25% → 100%) per restaurant cohort.
- Monitoring: track selector latency, conflict logs, occupancy, rejected bookings, RevPASH, and telemetry volume; set alert thresholds before exposure increases.
- Kill-switch: feature flags revert to legacy scoring instantly; retain migration rollback scripts for schema changes.
