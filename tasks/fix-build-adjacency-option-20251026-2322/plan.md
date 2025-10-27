# Implementation Plan: Fix Build Adjacency Option

## Objective

We will enable builds to complete without type errors by aligning the allocator options interface so that the Next.js build succeeds consistently.

## Success Criteria

- [x] `pnpm run build` succeeds without TypeScript errors.
- [x] Allocator logic continues to behave as before in runtime tests.

## Architecture & Components

- Update `server/capacity/selector.ts`:
  - Extend `BuildCandidatesOptions` and `CombinationPlannerArgs` with `requireAdjacency?: boolean`.
  - Default the flag to `true` inside `buildScoredTablePlans`, pass through to combination enumeration.
  - Allow `RankedTablePlan.adjacencyStatus` to include `"disconnected"` when combos are permitted without adjacency; adjust metrics calculation to penalise disconnected plans instead of rejecting them outright.
- Update `server/capacity/tables.ts` type definitions (`TablePlan`) to include `"disconnected"` so mapping stays type-safe.

## Data Flow & API Contracts

- Selector invocation continues to return `RankedTablePlan[]`; no external API shape change besides union widening for adjacency status.

## UI/UX States

- Not applicable.

## Edge Cases

- Ensure default behaviour still enforces adjacency (`requireAdjacency` undefined → `true`).
- Confirm enumerator respects `kMax`, capacity, and zone filters when adjacency checks are bypassed.

## Testing Strategy

- Update/extend existing unit tests in `tests/server/capacity/selector.scoring.test.ts` to cover:
  - Allowing a disconnected combination when `requireAdjacency` is explicitly `false`.
  - Maintaining rejection when flag is `true`.

## Rollout

- Not applicable.
