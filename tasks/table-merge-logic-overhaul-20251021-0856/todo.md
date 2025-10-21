# Implementation Checklist

## Setup

- [x] Create task artifacts (research/plan/todo/verification stubs)
- [x] Confirm selector scoring flag context with maintainers (document assumption)

## Core

- [x] Normalise adjacency graph inside `buildScoredTablePlans`
- [x] Capture adjacency asymmetry in diagnostics/fallback messaging
- [x] Ensure downstream merge mapping still resolves `mergeType`

## UI/UX

- [ ] Validate Ops dashboard expectations remain satisfied (no schema/contract changes)

## Tests

- [x] Update/add unit tests for directional adjacency merges
- [x] Run targeted Vitest suite for capacity selector
- [x] Note additional tests required (if any)
- [x] (n/a) Accessibility checks – server only

## Notes

- Assumptions:
  - Selector scoring remains behind feature flag; production rollout coordinated later.
- Deviations:
  - None yet.
  - Additional tests beyond selector unit suite not required; existing auto-assign coverage already exercises merge mapping.

## Batched Questions (if any)

- None currently.
