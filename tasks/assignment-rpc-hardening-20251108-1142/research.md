# Research: Assignment RPC Hardening

## Requirements

- Functional:
  - Ensure `confirmHoldAssignment` and manual assignment flows never emit duplicate `capacity.assignment.sync` events.
  - Stop returning synthetic assignment IDs; instead, hydrate from storage with bounded retries and surface empty IDs + warnings when data is still missing.
  - Detect cross-tenant hold/booking mismatches before touching allocator RPCs and fail safely.
  - Convert all policy or adjacency drift signals into a dedicated error class so retry telemetry/keyed notifications can rely on type checks rather than brittle code-string comparisons.
  - Expand RPC fallback heuristics to cover Postgres/REST schema cache errors beyond the current limited set.
  - Trim legacy availability scans to only fetch overlapping assignments to cut p95 latency.
- Non-functional:
  - Maintain allocator V2 guardrails; no change to public API surface areas.
  - Keep retry windows <30 ms for assignment rehydration; exhaustive loops forbidden.
  - Preserve existing observability/outbox structures but enrich with new `kind` metadata for drift incidents.

## Existing Patterns & Reuse

- `synchronizeAssignments` already centralizes downstream mutation (assignments, allocations, ledger, outbox) but relied on random UUID fallbacks.
- `assignTableToBooking` triggered a second `capacity.assignment.sync` despite `synchronizeAssignments` emitting one; removal is safe because other flows share the same helper.
- Policy drift handling lived in `confirmWithPolicyRetry`, hinging on `AssignTablesRpcError.code === "POLICY_CHANGED"` string checks, and `publishPolicyDriftNotification` already pushes structured payloads we can extend.
- Legacy availability check simply enumerated all assignment rows; adding `.lt/.gt` filters mirrors SQL strategies used elsewhere in the repo (e.g., holds lookups).

## External Resources

- Spec sections EPIC A/B/C in user brief define acceptance criteria (duplicate outbox removal, drift error class, ranged availability).
- Supabase PostgREST error codes list confirms `42883` (function missing) and `42P01` (relation missing) map to schema cache warmup issues we should treat as fallbacks.

## Constraints & Risks

- Refreshing assignment rows must not hammer the DB; capped at two retries with ≤15 ms delay each.
- Returning empty assignment IDs is temporary; callers must handle this without regressing existing flows.
- Drift classification must not swallow unrelated RPC errors; only explicit policy/adjacency mismatches should map to `PolicyDriftError`.
- Adding range filters could accidentally skip rows with null `start_at`/`end_at`; expectation is production data always sets them.

## Open Questions

- Should we also move outbox insertion into the RPC for total atomicity? (Deferred per EPIC F.)
- Are there legacy environments where `table_holds.restaurant_id` remains null? If so, do we treat that as mismatch?

## Recommended Direction

- Reuse `synchronizeAssignments` but enhance it with bounded refresh + structured warnings; remove downstream random UUID usage.
- Introduce `PolicyDriftError` (extending `AssignTablesRpcError`) in `types.ts`, export `PolicyDriftKind/Details`, and wrap both local snapshot mismatches + upstream RPC `POLICY_CHANGED` responses.
- Expand `confirmWithPolicyRetry` to key off the new class, enrich observability/outbox payloads, and keep existing retry semantics intact.
- Harden schema cache detection by including Postgres codes and textual heuristics so we gracefully fall back to legacy paths when RPCs are unavailable.
- Tighten safety/availability checks inline (restaurant mismatch, range filters) to satisfy EPIC A/C without altering client contracts.
