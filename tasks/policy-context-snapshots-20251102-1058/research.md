# Research: Policy + Context Snapshots (E3-S1)

## Requirements

- Functional:
  - Add `policyVersion` to `evaluateManualSelection` result; persist into hold summary.
  - `confirm` must compare and emit `POLICY_CHANGED` if drifted.
  - Add `contextVersion` (hash of holds + assignments + flags for window) returned by `getManualAssignmentContext`.
  - Clients must include `contextVersion` in validate/hold/confirm requests; server rejects stale (`STALE_CONTEXT`).
- Non‑functional:
  - Hashing fast and stable; avoid large payloads.

## Existing Patterns & Reuse

- `server/capacity/tables.ts` has `evaluateManualSelection`, `createManualHold`, `getManualAssignmentContext` but no versions.
- Policy object from `getVenuePolicy()` can be hashed to derive `policyVersion`.
- Busy map and window already computed; context inputs available for hashing.

## External Resources

- Hashing via Node `crypto` (already used).

## Constraints & Risks

- Must align UI to send `contextVersion` for each action.
- Consider feature flags in context (e.g., holds.strict, adjacency, allocator toggles) as part of hash to detect drift.

## Open Questions (owner, due)

- Exact fields composing `contextVersion`? (BE1) – Proposed: sorted holds for window, current assignments for selected tables/window, critical feature flags values, and booking window.

## Recommended Direction (with rationale)

- Add helpers to compute `policyVersion` (canonicalize policy) and `contextVersion` (canonicalize inputs + SHA‑256).
- Extend manual routes to require `contextVersion` in payload/header and compare with fresh server computed value; return `STALE_CONTEXT` if mismatch with suggested refresh.
- Persist `policyVersion` into hold metadata for confirmation comparison; emit `POLICY_CHANGED` when mismatched.
