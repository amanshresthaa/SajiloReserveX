# Implementation Checklist

## Setup

- [x] Design & publish Supabase migrations for `demand_profiles` and `table_scarcity_metrics` (remote execution plan + rollback notes).
- [x] Define new feature flags (`selector_yield_management`, `selector_dynamic_combinations`, `selector_lookahead`) with defaults and config docs.
- [x] Scaffold demand/scarcity service modules and register with DI / barrel exports.

## Core

- [x] Implement demand multiplier resolver (timezone-aware) and cache strategy.
- [x] Implement table scarcity loader/cache + background recompute job wiring.
- [x] Extend `SelectorScoringConfig`/`SelectorScoringWeights` and plumbing in `tables.ts`/`v2/planner.ts`.
- [x] Update `buildScoredTablePlans` to calculate new metrics, apply dynamic combination penalties, and expose component breakdowns.
- [x] Integrate lookahead conflict evaluation into planner flow with configurable window & penalty.
- [x] Enhance telemetry/logging to emit `slack_penalty`, `scarcity_penalty`, `demand_multiplier`, `combination_penalty`, `future_conflict_penalty` fields.

## UI/UX

- [ ] Document telemetry changes for ops dashboards; ensure manual QA checklist updated (Chrome DevTools focus on logs only).

## Tests

- [x] Unit
- [x] Integration
- [ ] E2E
- [x] Axe/Accessibility checks (N/A, mark in verification)

## Notes

- Assumptions:
  - Demand multipliers default to 1.0 when no profile found.
  - Scarcity penalties pull from `table_scarcity_metrics` when yield management is enabled, falling back to in-memory heuristics otherwise.
- Deviations:
  - Accessibility scope limited to telemetry; no UI impact.

## Batched Questions (if any)

- Pending answers captured in `research.md` open questions.
