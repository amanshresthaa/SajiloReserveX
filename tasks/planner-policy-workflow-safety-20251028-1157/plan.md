# Implementation Plan: Planner Policy & Workflow Safety

## Objective

We will honour policy-driven adjacency thresholds, cap planner search breadth via feature flags, harden hold swap workflows, and propagate table-availability failures so that allocation tooling remains safe under load without surprising operators.

## Success Criteria

- [x] Adjacency enforcement only applies when `allocator.requireAdjacency` is on **and** party size meets the configured minimum; defaults preserve existing behaviour when the new flag is unset.
- [x] Planner invocations log/emit the active combination limits, matching new feature flag inputs.
- [x] Manual hold swaps never leave a window without coverage and retain best-effort cleanup semantics.
- [x] Availability checks surface controlled errors on Supabase failures instead of reporting "available".
- [x] Vitest coverage updated (adjacency threshold, planner limits, hold swap concurrency, availability error propagation) and existing suites stay green.

## Architecture & Components

- `lib/env.ts`, `config/env.schema.ts`, `server/feature-flags.ts`: extend feature flag surface with `allocator.adjacency.minPartySize` and `selector` limit knobs.
- `server/capacity/tables.ts`: centralize adjacency resolution per booking (`resolveRequireAdjacency` helper), adjust planner calls, rework hold swap order, and wrap availability checks.
- `server/capacity/selector.ts`: embed limit data in `CandidateDiagnostics` and honour injected caps.
- `server/capacity/telemetry.ts`: ensure new diagnostics payload shape is persisted.
- Tests under `tests/server/capacity`: add/adjust suites for new behaviours; include concurrency scenario for hold swaps and property/unit checks for adjacency thresholding.

## Data Flow & API Contracts

Function: `partiesRequireAdjacency(partySize: number)`
Returns `true` when:

- `isAllocatorAdjacencyRequired()` is true, and
- `partySize >= allocator.adjacency.minPartySize` when provided, otherwise `true` (legacy mode).

Feature Flag getters:

```ts
getAllocatorAdjacencyMinPartySize(): number | null
getSelectorPlannerLimits(): { maxPlansPerSlack?: number; maxCombinationEvaluations?: number }
```

Planner calls (`quoteTablesForBooking`, `autoAssignTablesForDate`, `findSuitableTables`) pass caps and resolved adjacency booleans. Telemetry diagnostics include:

```ts
limits: {
  kMax: number; // effective cap after clamps
  maxPlansPerSlack: number; // final value used
  maxCombinationEvaluations: number;
}
```

Hold swap flow:

1. Validate & build payload.
2. Create new hold (`createTableHold`).
3. On success, best-effort release `excludeHoldId` with warning logging if it fails.
4. Return new hold + validation.

Availability API:

- `isTableAvailable` wraps `isTableAvailableV2` and rethrows `ManualSelectionInputError` (`TABLE_AVAILABILITY_UNAVAILABLE`) for upstream HTTP handlers, retaining original details in `AssignTablesRpcError` for observability.

## UI/UX States

No UI surface changes; manual validation messages remain consistent, but adjacency error only appears for parties ≥ threshold once flag enabled.

## Edge Cases

- Threshold flag set below 1 → clamp to 1 (avoid disabling adjacency entirely when flag is misconfigured).
- Planner caps set to extreme values → clamp to safe ranges (e.g., maxPlansPerSlack ≤ 200, combination evaluations ≤ 5000).
- Hold release failure after new hold succeed → log warning; ensure new hold stays active.
- Availability check invoked without policy/timezone → defaults continue to resolve via `getVenuePolicy`.

## Testing Strategy

- Unit:
  - `partiesRequireAdjacency` threshold matrix (below/at/above) and override disabling.
  - Planner diagnostics include new `limits` data; limits propagate to enumerate/skip counts.
  - Hold swap concurrency (Promise coordination) ensures old hold not released prior to new hold creation and cleanup attempted afterwards.
  - Availability error propagation returns structured `ManualSelectionInputError` (or wrapped `AssignTablesRpcError`) and does not resolve `true`.
- Integration:
  - Extend `manualSelection.test.ts` to simulate large-party adjacency and concurrency swap.
  - Update selector scoring/perf tests to account for diagnostics shape.
- Property/E2E:
  - Reuse existing fast-check overlap suite; ensure added diagnostics don't break property tests.

## Rollout

- Feature flag: `allocator.adjacency.minPartySize` (default unset) and `selector.maxPlansPerSlack` / `selector.maxCombinationEvaluations` (default clamps).
- Exposure: start disabled (null) to preserve behaviour; enable per venue via env/flag rollouts.
- Monitoring: Telemetry `capacity.selector` payload now includes `limits`; observe dashboards for regressions.
- Kill-switch: disable flags to revert to legacy behaviour instantly.
