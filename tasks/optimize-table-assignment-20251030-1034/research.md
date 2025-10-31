# Research: Optimize Table Assignment

## Requirements

- Functional:
  - Revisit auto-assignment prioritization so larger bookings (higher party sizes / revenue) are placed before smaller ones when generating table plans.
  - Improve turnover by preferring assignments that minimize dwell time conflicts and free capacity for subsequent services.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Preserve existing Supabase-backed assignment workflows; no local migrations.
  - Keep telemetry and feature-flag hooks intact (selector diagnostics, planner config events).
  - Ensure algorithm remains deterministic for the same inputs to avoid flapping assignments.

## Existing Patterns & Reuse

- `autoAssignTablesForDate` iterates bookings in the order returned from `loadContextBookings` (`server/capacity/tables.ts:2549`), which currently sorts by `start_at` ascending (`server/capacity/tables.ts:981-1000`).
- Table combination scoring already balances overage, fragmentation, and adjacency via `buildScoredTablePlans` (`server/capacity/selector.ts` exported in consolidated bundle), so we should reuse its scoring rather than replace it.
- Telemetry helpers (`emitSelectorDecision`, `composePlannerConfig`) expect the existing loop semantics; any reordering must still produce the same event payload shape.

## External Resources

- None identified yet; requirements appear internal.

## Constraints & Risks

- Reordering to prioritize large parties must not starve smaller bookings that occur earlier chronologically; need safeguards (e.g., tie-breaking by start time or time window buckets).
- Changes affect operations tooling; unexpected assignment order could surprise staff, so we should guard behind a feature flag or make the prioritization configurable per venue.
- Auto-assign is invoked via API (`src/app/api/ops/dashboard/assign-tables/route.ts`); latencies should remain within current expectations (< ~1s) to keep UI responsive.

## Open Questions (owner, due)

- Q: Do we have per-booking spend projections or should we proxy by `party_size` only? (Assignee: Ops PM, Due: ASAP)
  A: ...
- Q: Should the new prioritization be opt-in per restaurant via config/flag? (Assignee: Eng Lead, Due: before rollout decision)
  A: ...

## Recommended Direction (with rationale)

- Introduce a prioritization strategy that groups candidate bookings by service window start and then orders within each window by descending `party_size`, optionally weighting by duration or spend if available. This preserves temporal fairness while addressing the revenue concern.
- Leverage existing feature flags to gate the new prioritization (e.g., `isAllocatorV2Enabled` or add a dedicated flag) so we can roll out gradually and toggle during ops.
- Consider augmenting scoring with a turnover heuristic (prefer plans that leave more short-term availability) by reusing `slack` metrics already computed by the selector.
