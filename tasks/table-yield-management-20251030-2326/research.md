# Research: Table Yield Management Enhancements

## Requirements

- Functional:
  - Compute and persist per-capacity scarcity scores, expose them to the selector, and reflect penalties in `scoreBreakdown.scarcityPenalty` and planner telemetry.
  - Load demand multipliers from configurable profiles (Supabase + `config/demand-profiles.json` fallback) so slack penalties scale with peak/off-peak demand and the multiplier surfaces in diagnostics.
  - Adjust combination penalties so multi-table plans that consume rare tables are penalized more heavily than those using common inventory.
  - When lookahead is enabled, locate potential conflicts within the configured window, add `future_conflict_penalty`, and demote conflicting plans.
  - Update documentation so operators understand new config knobs (weights, demand profiles, lookahead toggles) and how to tune them.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain selector + lookahead latency under the existing 500 ms P95 target (`server/capacity/selector.ts` guard at 307).
  - Ensure demand/scarcity caches stay TTL-bound (5 min) and handle Supabase outages gracefully (`server/capacity/demand-profiles.ts`, `server/capacity/scarcity.ts`).
  - Telemetry/diagnostics must stay backward compatible for downstream consumers (ops tooling, shadow dashboards).
  - No new PII exposure; continue to load config via secure env/feature flag paths (`server/feature-flags.ts`).

## Existing Patterns & Reuse

- Scoring pipeline in `server/capacity/selector.ts` already produces candidate metrics, including `computeTableScarcityScores`, demand multiplier normalization, and `scoreBreakdown` plumbing.
- Table scarcity metrics can be loaded from Supabase via `server/capacity/scarcity.ts`, falling back to heuristic `1 / count` scoring when remote data is absent.
- Demand resolution is implemented in `server/capacity/demand-profiles.ts`, supporting restaurant-specific overrides, default profiles, caching, and telemetry-ready rule metadata.
- Planner orchestration in `server/capacity/tables.ts` wires together scarcity, demand, and lookahead; telemetry is emitted through `composePlannerConfig` and `summarizeCandidate`.
- Lookahead conflict detection leverages `prepareLookaheadBookings` + `applyLookaheadPenalties`, rebuilding candidate plans for future bookings using the same selector entry-point, which keeps logic consistent with current scoring.

## External Resources

- `config/demand-profiles.json` – default demand multipliers shipped with the repo.
- `tasks/table-selection-yield-management-20251030-1423/plan.md` – prior architectural intent for the same initiative.
- `DOCUMENTATION.md` (root) – central place for operational guidance; needs extension for new config knobs.

## Constraints & Risks

- Scarcity + demand features are gated by `isSelectorYieldManagementEnabled`; lookahead sits behind `isSelectorLookaheadEnabled` – regressions must not affect venues where flags remain off.
- Combination planner already has evaluation limits; adding scarcity-weighted penalties must not lead to negative totals or overflow existing sorting heuristics (tie-breakers rely on overage, table count, etc.).
- Lookahead currently recomputes plans per future booking; excessive windows or low penalty weights could degrade latency while providing little protection.
- Telemetry consumers assume `scoreBreakdown.total` matches `plan.score`; modifications must keep the invariant intact.
- Supabase outages (for scarcity metrics) or malformed demand config must not break selector execution – fall back to neutral values with warnings.

## Open Questions (owner, due)

- Q: Should scarcity influence the existing structural penalty or remain a separate dimension to avoid double counting? (Owner: Me, Due: Prior to implementation)
  A: Blend scarcity into the combination penalty via an average-scarcity multiplier (clamped) when yield management is enabled, keeping structural math readable while highlighting rare merges.
- Q: Do we need additional caching/telemetry for lookahead window stats to monitor performance? (Owner: Me, Due: During plan phase)
  A: Existing diagnostics include lookahead counters; additional telemetry not needed for this iteration.

## Recommended Direction (with rationale)

- Extend `SelectorScoringWeights` + planner telemetry to surface scarcity/demand weights, allowing ops teams to tune via config and confirm at runtime.
- Rework combination penalty calculation in `computeScore` so it incorporates scarcity (e.g., scale by average rarity), ensuring breakdown fields stay interpretable.
- Strengthen demand + scarcity integration by persisting resolved values on each plan (no recomputation) and updating tests covering Scenario 1/2.
- Tighten lookahead diagnostics to prove penalties apply, possibly capturing the conflicting plan keys + applied weight in logs for QA scenarios.
- Update documentation describing new planner config fields, feature flags, and tuning workflows so release + ops teams can manage rollouts confidently.
