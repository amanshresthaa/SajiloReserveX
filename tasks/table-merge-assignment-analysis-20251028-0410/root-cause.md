# Root Cause Analysis: Multi-Table Assignment Failure

## Summary

Bookings that require more than one table never reach the merge logic because combination plans are gated behind the `FEATURE_COMBINATION_PLANNER` feature flag. The allocator’s quoting step (`quoteTablesForBooking`) sets `enableCombinations` from `isCombinationPlannerEnabled()`, which is `false` by default (`env.featureFlags.combinationPlanner`). With the flag disabled, `buildScoredTablePlans` only evaluates single-table candidates, so no hold or manual workflow ever attempts a multi-table assignment.

## Evidence

- `buildScoredTablePlans` enumerates combinations only when `enableCombinations` is true (`server/capacity/selector.ts:62-151`).
- `quoteTablesForBooking` passes `isCombinationPlannerEnabled()` to that option (`server/capacity/tables.ts:1704-1713`), and the feature flag defaults to `false` unless explicitly enabled in env (`lib/env.ts:108-136`).
- Manual selection relies on the same filtered candidate set for holds; without combination plans, the UI never receives multi-table offers, so merge confirmation via `assign_tables_atomic_v2` is never invoked.

## Impact

- Guests with party sizes larger than any single table cannot be automatically seated, and operators cannot confirm holds that combine tables because no multi-table hold is generated.
- Downstream telemetry shows no merge attempts, masking the issue as an assignment failure when in reality planning never produced a valid merge candidate.

## Next Steps

1. Enable `FEATURE_COMBINATION_PLANNER` (or flip the default) in environments that need table merges.
2. Add monitoring to surface when the planner falls back to single-table plans despite party sizes exceeding the largest capacity.
3. Extend automated tests in `tests/server/capacity/autoAssignTables.test.ts` to assert that combination plans appear when the flag is enabled and are absent otherwise.
4. Document the dependency between `FEATURE_COMBINATION_PLANNER` and merge support in `appendix.md` and ops runbooks.
