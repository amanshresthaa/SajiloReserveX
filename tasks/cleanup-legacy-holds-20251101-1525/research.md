# Research: Cleanup legacy holds code

## Requirements

- Functional: Remove legacy, unused code related to confirming table holds via legacy RPC path.
- Non‑functional: Keep allocator v2 flow intact; no behavior change for current APIs; pass typecheck.

## Existing Patterns & Reuse

- Allocator v2 confirm path: `server/capacity/tables.ts:2260` (`confirmHoldAssignment`) is the active path and used by API routes.
- Legacy confirm path in `server/capacity/holds.ts` (`confirmTableHold`) is not referenced anywhere.

## External Resources

- N/A

## Constraints & Risks

- Must not remove shared error classes (`AssignTablesRpcError`) — used by v2 path.
- Keep conflict detection fallbacks and hold lifecycle utilities.

## Open Questions (owner, due)

- Should we also expose a hold extend endpoint? (owner: maintainers)

## Recommended Direction (with rationale)

- Remove `confirmTableHold` and its specific types/helpers (unused).
- Keep all other exports used by v2 and APIs.
