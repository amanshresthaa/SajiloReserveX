# Implementation Plan: Strategic Scoring Activation

## Objective

We will enable the selector to apply scarcity, demand, and lookahead penalties by default so that table assignments preserve high-value inventory over the full service window while remaining tunable via configuration.

## Success Criteria

- [ ] Scarcity weight > 0 in plannerConfig telemetry and `scoreBreakdown.scarcity_penalty` populated for scarce tables; weight adjustable via env/config without code changes.
- [ ] Demand multipliers resolved for peak periods (e.g., weekend dinner) yielding non-1.0 `demand_multiplier` and impacting `slack_penalty`; defaults and overrides reloadable at runtime.
- [ ] Lookahead diagnostics show `enabled: true` with `future_conflict_penalty` applied when conflicts detected; window+penalty adjustable via env.
- [ ] Scenario tests cover peak/off-peak scarcity behavior and sequential booking conflicts; all automated suites green.
- [ ] Verification doc captures manual QA (Chrome DevTools) of planner telemetry + configuration toggles.

## Architecture & Components

- `server/capacity/policy.ts`: source for `SelectorScoringConfig`; update to pull scarcity weight from new strategic config helper rather than hard-coded constant.
- `server/capacity/selector.ts`: ensure score breakdown uses injected weight; add dev assertions/tests to prevent zero penalties when scores >0.
- `server/capacity/demand-profiles.ts`: extend loader to support runtime config overrides (env-driven JSON path or Supabase table refresh) and expose cache invalidation hook for tuning session.
- `server/capacity/tables.ts`: compose planner config with runtime strategic settings; ensure lookahead config pulled from shared helper and penalties applied to `scoreBreakdown`.
- `server/feature-flags.ts` + `lib/env.ts` + `config/env.schema.ts`: add env schema for scarcity weight, demand profile path, and set default lookahead flag true while preserving override knobs.
- New `server/capacity/strategic-config.ts` (planned): centralize reads for scarcity weight, demand config path, lookahead defaults, exposing memoized getters + invalidation for tests.
- Tests in `tests/server/capacity` extended/added to validate scoring behavior.

## Data Flow & API Contracts

- Strategically enhanced planner:
  - Input: booking request triggers `quoteTablesForBooking` → loads tables, demand multiplier, scarcity scores, lookahead context.
  - New: runtime config helper provides `weights` (scarcity, lookahead) + demand profile overrides before passing to `buildScoredTablePlans`.
  - Telemetry: `summarizeCandidate` ensures new penalties appear in payload consumed by ops UI (`src/services/ops/bookings.ts`)—no API change, but values now non-zero.
- Config surfaces:
  - Env variables (e.g., `FEATURE_SELECTOR_SCARCITY_WEIGHT`, `STRATEGIC_DEMAND_PROFILE_PATH`) parsed at boot; watchers allow reloading via admin endpoint/cron (document plan; implementation may expose manual invalidation call).
  - Demand profile fallback JSON remains same schema; remote Supabase `demand_profiles` table already supports per-restaurant overrides.

## UI/UX States

- Ops diagnostics view (consumer of `plannerConfig`) should show:
  - Scarcity weight default (e.g., 10–22) and demand multiplier label; confirm no blank states.
  - Lookahead diagnostics list conflicts; ensure logs remain readable.

## Edge Cases

- No scarcity metrics in Supabase → fallback heuristics apply; ensure penalty still >0 for unique tables.
- Demand multiplier path missing/unreadable → fall back to embedded defaults; warn once.
- Lookahead window zero or negative via env → guard to disable gracefully; log and fall back to safe default.
- Large penalty weights causing numeric overflow → clamp in config helper (upper bound ~100k similar to env schema).
- Cache invalidation: ensure manual tuning session can flush caches (expose `clearScarcityCache` (already) + new demand cache clear).

## Testing Strategy

- Unit:
  - `strategic-config` helper ensures env overrides & clamps behave.
  - `buildScoredTablePlans` with injected scarcity map demonstrates non-zero penalty vs zero weight fallback.
  - `resolveDemandMultiplier` with mocked dates/timezones verifying multiplier selection.
  - Lookahead evaluation applying penalty when future booking conflicts.
- Integration:
  - Extend `autoAssignTables` tests with demand/scarcity scenarios (peak vs off-peak) and sequential bookings (lookahead).
  - Add log/telemetry snapshot test verifying plannerConfig weights/demand/penalty.
- E2E:
  - If Playwright harness available, run scenario using seed data toggling env—fallback to integration if E2E heavy.
- Accessibility:
  - N/A (back-end feature) but ensure Ops UI respects semantics when fields change; manual QA in verification.

## Rollout

- Feature flag: default `selectorLookahead.enabled` true; maintain env override for emergency rollback.
- Exposure: start in staging shadow mode via env toggles; confirm telemetry with product stakeholders before prod ramp (10 % → 100 % plan).
- Monitoring: leverage existing selector decision logs; add metrics counter for scarcity/ lookahead penalties triggered.
- Kill-switch: env vars `FEATURE_SELECTOR_SCARCITY_WEIGHT=0`, `FEATURE_SELECTOR_LOOKAHEAD=false`, or revert demand profile multipliers to 1.0; document in verification notes.
