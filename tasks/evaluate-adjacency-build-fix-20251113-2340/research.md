---
task: evaluate-adjacency-build-fix
timestamp_utc: 2025-11-13T23:40:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Selector build failure from duplicate adjacency evaluation

## Requirements

- Functional: Restore successful `pnpm run build` by resolving the duplicate `evaluateAdjacency` definition inside `server/capacity/selector.ts`.
- Non-functional (a11y, perf, security, privacy, i18n): No user-facing impact, but ensure existing adjacency evaluation behavior (connected depth map) does not change.

## Existing Patterns & Reuse

- `server/capacity/adjacency.ts` already exports `evaluateAdjacency`, `isAdjacencySatisfied`, and `summarizeAdjacencyStatus`. Selector imports these helpers today.
- Selector previously had an internal `evaluateAdjacency` variant despite already calling the shared helper.

## External Resources

- n/a (internal code inspection sufficient).

## Constraints & Risks

- Must keep the depth map behavior unchanged because downstream scoring relies on depth weighting.
- Removing the duplicate function should not drop any functionality still needed elsewhere in selector.
- Build uses Next.js (Turbopack) which enforces single definitions; TypeScript type checking should remain clean.

## Open Questions (owner, due)

- None identified.

## Recommended Direction (with rationale)

- Delete the redundant local `evaluateAdjacency` implementation inside `selector.ts` and rely exclusively on the shared helper. This removes the redeclaration conflict without altering logic and keeps adjacency evaluation centralized for maintainability.
