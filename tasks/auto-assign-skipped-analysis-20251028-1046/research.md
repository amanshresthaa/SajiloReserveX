# Research: Auto Assign Skip Analysis

## Existing Patterns & Reuse

- `server/capacity/tables.ts` implements allocator v2 auto-assign flow with skip reporting (`result.skipped.push`), conflict handling, and telemetry via `emitSelectorDecision`.
- `server/capacity/selector.ts` drives candidate generation with scoring, enforcing `maxOverage`, `kMax`, adjacency, and zone restrictions while logging diagnostics counters for each skip category.
- Observability events (`server/capacity/telemetry.ts`) persist detailed diagnostics (`CandidateDiagnostics.skipped`) that can be mined to rank skip causes without instrumenting new code.
- Prior task `auto-assign-merge-gap-20251028-1022` seeded adjacency data and added merge fallback logic; we should reuse those adjacency loaders and diagnostics rather than creating new heuristics.

## External Resources

- Internal venue policy defaults (`server/capacity/policy.ts`) dictate service windows and turn bands that surface `ServiceOverrunError` skip reasons when reservations exceed service end times.
- Feature flag configuration (`config/env.schema.ts`, `lib/env.ts`, `server/feature-flags.ts`) exposes tunables like `allocator.kMax`, `allocator.requireAdjacency`, and combination planner toggles that influence skip volume.

## Constraints & Risks

- Auto-assignment must keep slack ≤ `maxOverage` (default 2 seats) and limit merges to `kMax` (default 3, capped at 5) which inherently skips large parties when inventory is fragmented.
- Adjacency enforcement kicks in whenever adjacency data exists _and_ `allocator.requireAdjacency` stays true, so missing graph edges directly translate to `adjacency` skips.
- Increasing search space (higher `kMax`, evaluation limit) can impact performance; `enumerateCombinationPlans` caps evaluation at 500 combinations and 50 plans per slack bucket.
- Relaxing service windows risks violating turn times and degrading turnover; any adjustments must align with policy or introduce new monitoring.

## Open Questions (and answers if resolved)

- Q: What are the primary skip reasons surfaced by the orchestrator?
  A: Code review shows explicit skip categories: service overruns, planner fallback (`Combination planner disabled`, `No tables meet capacity requirements`), adjacency/kMax/zone limits, conflicts with active bookings/holds, and Supabase overlap conflicts.
- Q: Could skips stem from Supabase RPC duplicates (e.g., `assign_tables_atomic_v2 assignment duplicate` errors)?
  A: Yes; the auto-assign path now retries via orchestrator only, but Supabase still rejects conflicting rows, leading to skip reason `Auto assign skipped: Supabase reported an overlapping assignment`.
- Q: Does the planner optimise turnover by minimising slack or table count?
  A: `selectorScoring` weights heavily penalise overage (weight 5) and extra tables (weight 3), prioritising tight fits at the expense of spreading load for future bookings; this can exacerbate skips if exact fits aren't available.

## Recommended Direction (with rationale)

- Aggregate telemetry (`capacity.selector.skipped`) to quantify skips by category and venue, then simulate adjustments (e.g., higher `maxOverage`, relaxed adjacency) against historical data before shipping changes.
- Investigate adjacency graph coverage—missing symmetric edges produce `adjacency` diagnostics; we should build tooling to diff inventory vs adjacency rows and surface gaps.
- Explore adaptive scoring: consider time-to-next-service or utilisation metrics to trade a slight overage for fewer skips, but gate behind feature flags to validate turnover impact.
- Add observability for combination search exhaustion (`limit`, `kmax`) to confirm whether raising `kMax` or evaluation limits would materially reduce skips without exceeding SLA.
