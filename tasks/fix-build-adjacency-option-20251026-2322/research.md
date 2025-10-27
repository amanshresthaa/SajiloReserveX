# Research: Fix Build Adjacency Option

## Existing Patterns & Reuse

- `server/capacity/selector.ts:29` defines `BuildCandidatesOptions` without a `requireAdjacency` flag, yet `generateTablePlans` (see `server/capacity/tables.ts:752`) now forwards `requireAdjacency`, causing the type error.
- Combination enumeration in `selector.ts` currently enforces adjacency unconditionally through `isAdjacentToSelection` and rejects disconnected combos, so behaviour already assumes adjacency is required.
- Telemetry models (`server/capacity/telemetry.ts:14`) already allow an `adjacencyStatus` of `"disconnected"`, so downstream consumers can surface non-adjacent combinations if selector emits them.

## External Resources

- None needed; behaviour is established in local selector implementation.

## Constraints & Risks

- Relaxing adjacency enforcement must not regress existing scoring logic—connected plans should remain preferred when adjacency is optional.
- Type updates must stay compatible with callers (e.g. `server/capacity/tables.ts` and any tests referencing `RankedTablePlan`).
- Need to ensure new flag defaults preserve current behaviour (require adjacency unless explicitly disabled).

## Open Questions (and answers if resolved)

- Q: Do downstream structures accept `"disconnected"` adjacency status?  
  A: Yes; telemetry types already include it (`server/capacity/telemetry.ts:14`), and plan summaries derive status dynamically.
- Q: How should adjacency cost be computed for disconnected plans when allowed?  
  A: Penalise them with a higher adjacency cost (e.g., fall back to table count) so scoring still favours connected layouts without blocking the option.

## Recommended Direction (with rationale)

- Extend `BuildCandidatesOptions` with `requireAdjacency?: boolean` defaulting to `true` inside `buildScoredTablePlans`, update combination enumeration to respect the flag, and propagate adjacency status `"disconnected"` when applicable. This satisfies the new caller contract while keeping legacy behaviour unchanged unless explicitly overridden.
