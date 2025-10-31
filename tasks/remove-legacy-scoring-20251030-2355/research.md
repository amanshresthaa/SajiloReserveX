# Research: Remove Legacy Scoring

## Requirements

- Functional:
  - Remove the `selectorYieldManagement` feature flag and always enable scarcity/demand-aware scoring for table selection.
  - Ensure selector demand multipliers and table scarcity scores are resolved on every call and passed through telemetry and scoring.
  - Clean up configuration/env schema so no runtime code references the legacy flag.
  - Update documentation to reflect that yield management is mandatory rather than gated.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain selector latency budget (existing 500 ms guard) despite always loading demand/scarcity resources.
  - Safely handle Supabase or config read failures by relying on existing fallbacks (`loadTableScarcityScores`, `resolveDemandMultiplier`).
  - Keep telemetry schema stable for downstream consumers (weights + demand + lookahead already present).

## Existing Patterns & Reuse

- `server/capacity/tables.ts` already hydrates scarcity/demand conditionally; removing the flag means always calling `resolveDemandMultiplier` and `loadTableScarcityScores` with their built-in fallbacks.
- `server/capacity/policy.ts#getSelectorScoringConfig` centralises scoring weights; updating the default scarcity weight there cascades to all selectors.
- Telemetry plumbing (`composePlannerConfig`, `buildSelectorFeatureFlagsTelemetry`) already carries weights/feature metadata, so removing a flag is mostly schema tweaks.
- Env parsing in `lib/env.ts`/`config/env.schema.ts` handles feature flags; removing one entails schema + type adjustments.

## External Resources

- `server/capacity/demand-profiles.ts` – confirms demand multiplier cache + fallback logic survives when always invoked.
- `server/capacity/scarcity.ts` – details Supabase fetch + heuristic fallback for scarcity scores.

## Constraints & Risks

- Removing the flag means every selector call hits demand/scarcity loaders; Supabase latency must stay acceptable (rely on existing caches, ensure TTL remains).
- Tests or fixtures that assumed scarcity weight defaulted to `0` will need updating to the new default.
- Documentation and ops tooling referencing the flag must be updated to prevent confusion.
- Need to monitor for any external integrations depending on `selectorYieldManagement` flag exposure; ensure no API clients expect it.

## Open Questions (owner, due)

- Q: Should telemetry still expose a `yieldManagementEnabled` boolean, or do we drop it entirely? (Owner: Me, Due: Plan phase)
  A: Removed the field to avoid implying optionality; telemetry consumers will rely on weight/multiplier fields instead.
- Q: Do we need additional caching around Supabase calls once always-on? (Owner: Me, Due: Implementation)
  A: existing 5 min caches may suffice; observe after change.

## Recommended Direction (with rationale)

- Remove the flag plumbing (`isSelectorYieldManagementEnabled`, env schema, feature flag parsing) and always load demand/scarcity prior to scoring.
- Set the default scarcity weight to `YIELD_MANAGEMENT_SCARCITY_WEIGHT` within `getSelectorScoringConfig` so all call sites inherit the new baseline.
- Simplify planner telemetry by removing the yield flag while keeping other metadata intact; update tests accordingly.
- Refresh documentation to describe the always-on behavior and omit flag toggling guidance.
