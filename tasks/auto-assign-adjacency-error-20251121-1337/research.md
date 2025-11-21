---
task: auto-assign-adjacency-error
timestamp_utc: 2025-11-21T13:37:47Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Auto-assign adjacency error

## Requirements

- Functional: auto-assignment should select a valid adjacent table set for new bookings; confirmation should not fail when adjacency rules allow available tables.
- Non-functional (a11y, perf, security, privacy, i18n): reliability of background job; clear logging for failure reasons; no customer impact beyond fallback email confirmation.

## Existing Patterns & Reuse

- Auto-assign pipeline already implemented in booking service (inline flow + background job). Reuse existing adjacency graph and selection heuristics; avoid changing contract unless necessary.

## External Resources

- N/A yet (domain logic internal). Will consult code-level docs once identified.

## Constraints & Risks

- Adjacency validation may be strict; incorrect metadata or algorithm could reject valid combinations.
- Background job retries limited (maxAttempts:1); failures immediately surface to users.

## Open Questions (owner, due)

- Is the adjacency map for restaurant `cbdea463-1fc8-43a2-9909-b0393f530e94` correct? (owner: assistant, due: ASAP)
- Are we mixing inline quote/confirm logic with job re-run leading to stale holds? (owner: assistant, due: ASAP)

## Findings

- `assign_tables_atomic_v2` throws the observed `"Table ... is not adjacent to the selected set"` only when `p_require_adjacency` is true and at least one table in the selection has zero neighbor edges in `table_adjacencies`. Inline and job confirmations both hit this path, so adjacency enforcement is active.
- Auto-assign quoting can relax adjacency if no adjacent plan is found (fallback to `requireAdjacency=false`), but confirmation always re-enforces adjacency via `resolveRequireAdjacency`, so any non-adjacent fallback plan will later fail during confirm.
- Given the hold ID `f9820bc8-96f2-4b83-8b60-10dfd7603357` succeeded at quote but failed at confirm, the selected set likely contained `d1f34cf1-07da-4171-84f7-71b4490a7276` without an adjacency edge in `table_adjacencies` for restaurant `cbdea463-1fc8-43a2-9909-b0393f530e94`.

## Recommended Direction (with rationale)

- Inspect inline auto-assign confirm path and adjacency validation to identify why table `d1f34cf1-07da-4171-84f7-71b4490a7276` is considered non-adjacent despite available capacity.
- Cross-check restaurant table graph/config for adjacency entries; verify selection set and hold composition.
- Add instrumentation or constraints fix to prevent false non-adjacent errors and allow successful assignment.
