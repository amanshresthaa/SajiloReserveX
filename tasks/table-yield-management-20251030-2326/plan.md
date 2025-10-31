# Implementation Plan: Table Yield Management Enhancements

## Objective

We will make the capacity selector yield-aware so it protects scarce inventory, responds to demand multipliers, and reserves tables for imminent bookings while surfacing transparent planner telemetry.

## Success Criteria

- [ ] Selector scoring tests cover Scenario 1 (scarcity) and Scenario 2 (demand) with expected breakdowns and scoreboard weights exposed via telemetry.
- [ ] Combination penalty scales with the rarity of involved tables and is reflected in `scoreBreakdown.combination_penalty` without breaking existing tie-break ordering.
- [ ] Lookahead-enabled flows penalize conflicting plans, populate `future_conflict_penalty`, and emit planner config metadata (weights, multipliers, lookahead settings) in decision logs.
- [ ] Documentation describes configuration (scarcity weight, demand profiles, lookahead window/penalty) with operator guidance.

## Architecture & Components

- `server/capacity/policy.ts`: extend `SelectorScoringWeights` defaults and exported config so scarcity weight is configurable/loggable.
- `server/capacity/selector.ts`: adjust combination-penalty math to blend rarity and keep structural penalties coherent.
- `server/capacity/tables.ts`: pass resolved scarcity scores/demand multipliers, enhance planner telemetry (`composePlannerConfig`) to include weights and lookahead metadata.
- `src/services/ops/bookings.ts` & `server/capacity/telemetry.ts`: update decision snapshot typing/serialization for new planner config fields.
- `tests/server/capacity/selector.scoring.test.ts` & `tests/server/capacity/autoAssignTables.test.ts`: extend coverage for scarcity/demand/lookahead scenarios.
- `DOCUMENTATION.md` (or dedicated config doc): describe tuning instructions for weights, demand profiles, and lookahead feature flags.

## Data Flow & API Contracts

- Auto-assignment / quoting pulls table inventory → loads scarcity metrics (Supabase) & demand multipliers (`demand-profiles`) → calls `buildScoredTablePlans` with updated weights → optional lookahead re-evaluates future bookings → planners emit telemetry capturing weights and penalties.
- No public API contract changes; internal decision payload gains additional metadata fields (`weights`, `lookahead` context).

## UI/UX States

- N/A (service-only change; telemetry consumers reviewed via logs/dashboards).

## Edge Cases

- Feature flags off: ensure legacy scoring path surfaces neutral weights (scarcity=0, demand=1) and skip lookahead without errors.
- Missing scarcity data or demand profiles: fall back to heuristic scores/multiplier=1 while logging warnings, keeping totals stable.
- Extremely rare tables (score≈1): clamp combination-scarcity factor to avoid runaway penalties.
- Lookahead window > available data: gracefully return zero penalties without extra selector latency.

## Testing Strategy

- Unit: selector scoring math (scarcity/demand/combination), demand profile resolution edge cases, lookahead penalty application.
- Integration: auto-assign flow with lookahead enabled to verify telemetry + scoring order; potential snapshot compare for planner config output.
- E2E: re-run simulated booking day scripts post-change (document in verification) to validate telemetry and latency budgets.
- Accessibility: Not applicable (no UI change); note in verification.

## Rollout

- Feature flag: leverage existing `selectorYieldManagement` + `selectorLookahead` toggles; confirm defaults remain safe.
- Exposure: deploy behind flags, run shadow mode, then staged rollout aligned with post-sprint plan.
- Monitoring: watch selector latency, assignment diff dashboards, RevPASH/occupancy metrics, and log volume for telemetry payload size.
- Kill-switch: disable feature flags to revert to previous scoring; ensure documentation captures rollback steps.
