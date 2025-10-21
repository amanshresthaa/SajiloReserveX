# Implementation Plan: Table Merge Logic Overhaul

## Objective

We will normalise adjacency-driven merge selection so that merge candidates remain available even when Supabase delivers directional edges, improving reliability of auto-assignment without changing Ops UI contracts.

## Success Criteria

- [ ] `buildScoredTablePlans` produces valid merge plans when adjacency data is one-directional in the source map.
- [ ] Diagnostics clearly surface when asymmetry is detected so operations can audit inventory data.
- [ ] Unit test coverage exercises the new behaviour (directional adjacency) with deterministic results.

## Architecture & Components

- `server/capacity/selector.ts`: add adjacency normalisation + updated diagnostics before BFS traversal.
- `server/capacity/tables.ts`: ensure downstream consumption still maps merge types correctly (no behaviour change expected).
  State: selector scoring remains feature-flag driven via `isSelectorScoringEnabled` | Routing/URL state: n/a (server only)

## Data Flow & API Contracts

Endpoint: n/a (pure server module)
Request: `buildScoredTablePlans({ tables, partySize, adjacency, config })`
Response: `{ plans: RankedTablePlan[], fallbackReason?, diagnostics }`
Errors: none thrown; fallbackReason/diagnostics communicate issues

## UI/UX States

- Loading: no UI change; Ops dashboard continues to display assignment metadata.
- Empty: fallback reason text unchanged except richer diagnostics.
- Error: auto-assignment errors remain surfaced via telemetry/logging.
- Success: merge group assignments continue to list individual tables with merge banner.

## Edge Cases

- Tables without adjacency entries should still skip with `no_adjacency`.
- Adjacency asymmetry should be corrected once; ensure we avoid infinite loops or duplicate edges.
- Ensure zone mismatch/merge eligibility checks still enforce constraints after normalisation.

## Testing Strategy

- Unit: extend `tests/server/capacity/selector.scoring.test.ts` with directional adjacency case and diagnostics assertion.
- Integration: rely on existing `autoAssignTables` tests (ensure they still pass under selector scoring flag).
- E2E: none required (server-side change only).
- Accessibility: not applicable (no UI change).

## Rollout

- Feature flag: continue to respect `FEATURE_SELECTOR_SCORING`; change lives behind flag.
- Exposure: manual enablement per environment; recommendation documented.
- Monitoring: watch selector decision telemetry for `adjacency_asymmetry` counts; add to verification checklist.
