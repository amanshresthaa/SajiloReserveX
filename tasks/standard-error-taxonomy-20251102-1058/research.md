# Research: Standard Error Taxonomy End‑to‑End (E4-S1)

## Requirements

- Functional:
  - Introduce canonical codes: `HOLD_CONFLICT`, `ADJACENCY_REQUIRED`, `ZONE_MISMATCH`, `CAPACITY_SHORTFALL`, `STALE_CONTEXT`, `POLICY_CHANGED`, `RPC_VALIDATION`, `AUTH_FORBIDDEN`.
  - Map from `AssignTablesRpcError` and holds errors to codes + fields (tables, windows, blockingBookingIds).
- Non‑functional:
  - Clear, actionable, no generic fallback.

## Existing Patterns & Reuse

- Manual routes already return structured codes for some cases but inconsistent.
- `AssignTablesRpcError` carries `code`, `details`, `hint`.
- Validation checks include rich details.

## Constraints & Risks

- Must keep compatibility with existing UI until FE updated.

## Recommended Direction

- Define a mapping table for all known errors to canonical codes and fields.
- Update manual routes and ops routes to emit canonical codes.
- FE: update display components to show specific details.
