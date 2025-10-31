# Implementation Checklist

## Setup

- [x] Add strategic scoring config helper (env parsing, clamps, cache invalidation hooks).
- [x] Extend env schema (`config/env.schema.ts`) + `lib/env.ts` for scarcity weight + demand profile path overrides; default lookahead enabled.
- [ ] Document agreed default weights/multipliers from tuning session in config (once provided).

## Core

- [x] Update `server/capacity/policy.ts` & `tables.ts` to consume runtime scarcity weight (ensure telemetry reflects value).
- [x] Enhance `server/capacity/demand-profiles.ts` to honor override path + expose cache clear; ensure multiplier applied to slack penalty remains correct.
- [ ] Ensure `quoteTablesForBooking` passes strategic config + table scarcity scores; guard fallback when metrics missing.
- [x] Flip lookahead default on and ensure penalty injected into score breakdown with configurable weight/window.
- [x] Provide configuration reload hook (CLI or admin call) to refresh demand/scarcity caches post-tuning.

## UI/UX

- [ ] Verify Ops diagnostics (plannerConfig + scoreBreakdown) display new values; update copy/docs if needed.
- [ ] Capture screenshots/log excerpts for stakeholder review.

## Tests

- [x] Unit tests for config helper, scarcity penalty math, demand multiplier resolution.
- [x] Integration tests: peak vs off-peak scenario (Scenario A/B) + sequential booking lookahead scenario.
- [ ] Regression tests ensuring env overrides allow turning features off without code changes.

## Notes

- Assumptions: Tuning session will provide initial weight/multiplier targets before implementation freeze; Supabase tables already populated or fallback heuristic acceptable.
- Deviations: If session delayed, ship with documented default values and mark as follow-up for final calibration.

## Batched Questions (if any)

- Are we expected to expose runtime toggle via admin UI, or are env/config files sufficient for initial rollout?
