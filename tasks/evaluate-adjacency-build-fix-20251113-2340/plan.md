---
task: evaluate-adjacency-build-fix
timestamp_utc: 2025-11-13T23:40:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Selector duplicate evaluateAdjacency fix

## Objective

We will fix the Next.js build failure by eliminating the duplicate `evaluateAdjacency` declaration in `server/capacity/selector.ts` so that the selector logic continues to use the shared helper from `server/capacity/adjacency.ts` without redeclaration conflicts.

## Success Criteria

- [ ] `pnpm run build` succeeds locally without errors.
- [ ] Selector behavior still compiles and the adjacency evaluation referenced in metrics continues to provide `depths` data.

## Architecture & Components

- `server/capacity/adjacency.ts`: authoritative adjacency evaluation helpers.
- `server/capacity/selector.ts`: table selection DFS; remove the redundant helper at the bottom of this file to avoid conflicting declarations.

## Data Flow & API Contracts

- No API changes. Selector continues to pass `selectionIds` and adjacency map to the shared helper and uses returned evaluation for scoring.

## UI/UX States

- Not applicable (server-side build logic only).

## Edge Cases

- Ensure depth map behavior for 0 or 1 tables remains covered by central helper (already handles these cases).
- Confirm no other local references relied on the deleted function signature.

## Testing Strategy

- Run `pnpm run build` to ensure Next.js compilation passes.
- (Optional) Run targeted unit/integration tests if available; at minimum rely on build as regression.

## Rollout

- No flags necessary; change is internal to build.
- Merge normally once verification completes.
