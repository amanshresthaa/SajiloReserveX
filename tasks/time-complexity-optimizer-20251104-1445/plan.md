# Implementation Plan: Time Complexity Optimizations

## Objective

Reduce worst-case compute cost of table selection and lookahead without changing scoring semantics, and eliminate inefficient app-side filtering in legacy hold conflicts.

## Success Criteria

- [ ] Selector DFS enumerates fewer seeds on large inputs; diagnostics reflect `seed_limit`.
- [ ] Lookahead evaluation time bounded; diagnostics include plan/time caps.
- [ ] Legacy conflict query reduces returned rows by joining on members.

## Architecture & Components

- `selector.ts`: heuristic seed limiting inside `enumerateCombinationPlans` with diagnostics.
- `tables.ts`: lookahead guardrails (plan cap, time budget, fast capacity UB precheck).
- `holds.ts`: SQL-side filtering using `table_hold_members!inner` and `.in()`.

## Data Flow & API Contracts

- No external API changes. Internal diagnostics extended (`CandidateDiagnostics.lookahead`).

## UI/UX States

- N/A (server-side behavior only).

## Edge Cases

- Small venues (< 30 candidates) skip seed limit.
- Lookahead disabled → no change.
- Supabase environments lacking nested filter support still return data; we keep app-side overlap guard.

## Testing Strategy

- Unit: selector diagnostics reflect seed limiting; lookahead diagnostics reflect plan/time caps.
- Integration (deferred): verify reduced rows fetched for legacy conflict path with DB available.

## Rollout

- Feature guarded by conservative defaults; monitor selector/allocator perf logs.
- Revert by removing seed limiting and guardrails if unexpected regressions.
