# Implementation Checklist

## Setup

- [x] Confirm feature flags (`selectorYieldManagement`, `selectorLookahead`) default to safe values in local env (`server/feature-flags.ts`).
- [ ] Snapshot current planner telemetry payload for reference (logs/tests).

## Core Scoring

- [x] Expose scarcity weight in `SelectorScoringConfig` and planner telemetry.
- [x] Blend table scarcity into combination penalty while preserving total score invariants.
- [x] Ensure score breakdown (`structural`, `combination`, `scarcity`) sums to plan score post-change.

## Lookahead & Telemetry

- [x] Extend `composePlannerConfig` and snapshot types with weights + lookahead metadata.
- [x] Verify lookahead penalties populate `future_conflict_penalty` and diagnostics remain accurate.

## Tests

- [x] Unit: selector scoring scarcity/demand scenarios.
- [x] Integration: auto-assign lookahead scenario ensuring telemetry emissions and penalties.
- [x] Regression: run existing selector test suite (`pnpm test:ops --run tests/server/capacity/selector.scoring.test.ts`).

## Notes

- Assumptions:
- Deviations:
  - Telemetry snapshot not captured pre-change; relied on existing fixture tests for comparison.

## Batched Questions (if any)

-
