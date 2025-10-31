# Research: Strategic Scoring Activation

## Requirements

- Functional:
  - Sprint 1 goals: default scarcity weight enabled, runtime scarcity penalties recorded in score breakdown, demand profiles resolved per booking window with multipliers applied to slack penalties, documented calibration session outcomes committed (`plannerConfig` defaults + demand JSON).
  - Sprint 1 tests: prove scarcity causes algorithm to preserve rare tables during peak demand while allowing looser seating off-peak.
  - Sprint 2 goals: enable lookahead flag by default, fetch future-booking conflicts within window, apply `future_conflict_penalty` when conflicts exist, expose diagnostics, ensure configuration adjustable without redeploy (env/config service).
  - Sprint 2 tests: sequential booking scenarios demonstrating lookahead disqualifies conflicting tables; readiness for shadow/A-B configuration.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Planner path must respect existing latency target (<500 ms per `server/capacity/selector.ts:168` warning path).
  - Remote Supabase only—migrations already landed; ensure no local writes.
  - Logging/diagnostics must remain redaction-safe (no PII beyond booking IDs already emitted).
  - Config overrides need deterministic precedence (env -> restaurant override -> default JSON) and hot reload expectations documented.

## Existing Patterns & Reuse

- Scarcity infrastructure in place:
  - `server/capacity/scarcity.ts:16-120` loads Supabase `table_scarcity_metrics` with cache/fallback `computeScarcityScore`.
  - `server/jobs/table-scarcity.ts:1-134` recomputes metrics; weights constant `YIELD_MANAGEMENT_SCARCITY_WEIGHT = 22` in `server/capacity/policy.ts:44-90`.
  - Planner already injects `scarcity: YIELD_MANAGEMENT_SCARCITY_WEIGHT` (`server/capacity/tables.ts:2746-2778`) and logs `scarcity_penalty` (`server/capacity/telemetry.ts:365-405`).
  - Observed telemetry logs (`logs/auto-assign/...json`) still show `scarcity_penalty: 0`, implying runtime inputs hit zero—likely due to feature flags/weight overrides or scarcity map populating 0; need to root-cause.
- Demand profiles pipeline:
  - Resolver `server/capacity/demand-profiles.ts:1-320` reads `config/demand-profiles.json`, caches for 5 min, falls back to embedded defaults including multipliers 0.85–1.35.
  - `quoteTablesForBooking` wires multiplier into scoring (`server/capacity/tables.ts:2740-2790`) but telemetry shows `demand_multiplier: 1` during peak (log review) → verify timezone/service detection vs rule matching.
- Lookahead workflow:
  - Feature flag gating via `isSelectorLookaheadEnabled` (`server/feature-flags.ts:36-59`); default false because env fallback returns `FEATURE_SELECTOR_LOOKAHEAD ?? false`.
  - `evaluateLookahead` pipeline (`server/capacity/tables.ts:901-1084`) penalizes plans and populates `future_conflict_penalty`.
  - Tests currently mock lookahead disabled (`tests/server/capacity/autoAssignTables.test.ts:31-65`), so new scenarios required.
- Config surfaces:
  - `src/services/ops/bookings.ts:170-230` exposes plannerConfig+diagnostics to ops UI; once weights toggled, UI will show non-zero defaults automatically.
  - Env schema already defines `FEATURE_SELECTOR_LOOKAHEAD_*` entries (`config/env.schema.ts:54-56`).

## External Resources

- [Supabase migration 20251030142300_add_yield_management_tables.sql](supabase/migrations/20251030142300_add_yield_management_tables.sql) — confirms remote tables/indices.
- [config/demand-profiles.json](config/demand-profiles.json) — baseline multipliers; tuneable via session.
- Appendix rule-of-thumb (`appendix.md:20-109`) — documents scarcity heuristics, useful for stakeholder review framing.

## Constraints & Risks

- Performance: Enabling lookahead + higher penalties increases planner work; must measure `enumerateCombinationsMs` to ensure <500 ms (selector warns at `server/capacity/selector.ts:168`). Need guardrails for penalty weight magnitude to avoid overflow and ensure sort stability.
- Data freshness: Scarcity cache TTL 5 min; if job lags, fallback heuristics used. Acceptable but must communicate in calibration notes.
- Configuration drift: Demand JSON currently static file; enabling runtime overrides requires environment variable injection or config service integration—must design precedence and reload strategy.
- Telemetry regression: Non-zero penalties adjust decision outcomes; need to verify downstream consumers (Ops UI, analytics) expect new fields.
- Session scheduling (chore) may not fit coding timeline—capture assumed outputs (agreed weights) in repo; ensure product stakeholders sign off.

## Open Questions (owner, due)

- Q: Should `YIELD_MANAGEMENT_SCARCITY_WEIGHT` remain 22 or be updated per tuning session? (Owner: Product/ops session, due before Sprint 1 code freeze.)
  A: Pending calibration; implementation must accept env override (e.g., `FEATURE_SELECTOR_SCARCITY_WEIGHT`?) or config service entry.
- Q: Do we prioritize restaurant-specific demand overrides now or rely on defaults? (Owner: PM, due prior to Sprint 2 testing.)
  A: Defaults only today; ensure resolver respects Supabase profile rows when present.
- Q: What is acceptable lookahead window/penalty baseline for launch? (Owner: Tuning session, due Sprint 2 start.)
  A: Proposed default 120 min window, penalty 500 (current fallback) unless session revises.
- Q: How will shadow-mode toggles be orchestrated (env var vs remote flag service)? (Owner: Engineering, due before Deploy task.)

## Recommended Direction (with rationale)

- Make strategic scoring on by default, while keeping configuration tunable:
  - Introduce env-backed overrides for scarcity weight and demand multiplier scaling (ensures Post-session updates ≠ redeploy).
  - Confirm `plannerConfig.weights.scarcity` pulls from runtime config rather than constant; ensure non-zero default validated via unit test.
  - Investigate telemetry zeros: add targeted unit test covering `computeScarcityScore` + `buildScoredTablePlans` to prove penalty >0 when counts differ; instrument diagnostic logging in dev to validate.
- Demand profiles:
  - Ensure resolver picks correct rule by testing weekday/weekend boundaries; add coverage for timezone edge cases.
  - Allow JSON (or Supabase table) to be refreshed without restart—maybe watch file or expose reload command; document interim manual step.
- Lookahead:
  - Flip default `FEATURE_SELECTOR_LOOKAHEAD` to true in env schema fallback while preserving override path; update telemetry/test fixtures accordingly.
  - Optimize conflict query path by reusing `loadContextBookings` results (already executed) to avoid duplicate Supabase calls—validate indexes adequate.
  - Apply penalty weight from config and ensure `future_conflict_penalty` logs align via tests simulating sequential bookings.
- Testing & verification:
  - Extend unit tests for planner scoring to cover scarcity/demand interplay and future penalty; design scenario-based integration tests replicating acceptance criteria.
  - Prepare manual QA checklist for ops UI to confirm new plannerConfig fields propagate.
- Shadow rollout:
  - Centralize strategic parameters (weights, demand profile path, lookahead window/penalty) in config module with env + JSON fallback. Document process in `tasks/.../plan.md`.
