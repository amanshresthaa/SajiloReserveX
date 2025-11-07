# Research: Auto table assignment fails despite empty restaurant

## Requirements

- Functional:
  - Inline auto assign (triggered during `POST /api/bookings`) must confirm the booking when a valid plan exists.
  - Background job `autoAssignAndConfirmIfPossible` must also succeed using the same plan/hold metadata.
  - Ops manual assignment APIs should remain unaffected by the fix.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain allocator performance (no extra Supabase round-trips per quote).
  - Preserve existing hold conflict safety checks and metadata validation.
  - No leakage of booking PII into logs beyond current behaviour.

## Existing Patterns & Reuse

- Manual assignment flow (`server/capacity/table-assignment/manual.ts`) already builds the required hold metadata:
  - Persists `metadata.policyVersion` via `hashPolicyVersion`.
  - Persists `selection.snapshot.zoneIds` and adjacency edges/hash via `computePayloadChecksum`.
- Hold validation (`server/capacity/table-assignment/supabase.ts::findMissingHoldMetadataFields`) enforces the above fields before `confirmHoldAssignment`.
- `quoteTablesForBooking` currently only writes `metadata.selection.summary` and lacks the snapshot/policy hash, causing later confirmation to fail.

## External Resources

- Internal scripts:
  - `scripts/debug-selector.ts` confirmed that planner finds viable 3-table plans for booking `45a1f44c-7a2a-4bea-9838-8d60555f3a2d`.
  - `scripts/manual-confirm.ts` reproduced `AssignTablesRpcError: HOLD_METADATA_INCOMPLETE`.

## Constraints & Risks

- Supabase is remote-only; no schema tweaks unless coordinated.
- Metadata hashing must remain deterministic—any drift invalidates existing holds.
- Need to avoid re-querying adjacency per candidate to prevent planner slowdowns.
- Existing holds (created before fix) still lack metadata; confirming them will still fail until they expire (TTL 2–3m). Need to document in verification.

## Open Questions (owner, due)

- Q: Should we backfill metadata for active holds that survive longer than TTL?  
  A: Not required now because allocator holds expire within minutes; stale holds will be regenerated on the next attempt. (Owner: AMK, due: when longer-lived holds introduced.)

## Recommended Direction (with rationale)

- Reuse the manual-hold metadata strategy inside `quoteTablesForBooking`:
  - Compute `policyVersion` once per quote (`hashPolicyVersion(policy)`).
  - For each selected plan, derive snapshot payload (`zoneIds`, adjacency edges, undirected flag, checksum) using the already-loaded adjacency map to avoid extra queries.
  - Store snapshot + policy hash inside `createTableHold` metadata.
- This aligns auto-generated holds with the stricter validation enforced by `findMissingHoldMetadataFields`, unblocking both inline and background confirmation without touching RPC contracts.
- Fix the Supabase RPC (`confirm_hold_assignment_with_transition`) by aliasing `assign_tables_atomic_v2` results and the temp table (`tmp_confirm_assignments t`), and ensure we do not re-specify the OUT column definition list when aliasing. Together this prevents PL/pgSQL from treating OUT parameters (`table_id`, `start_at`, etc.) as conflicting identifiers, allowing the RPC to return assignment rows so auto confirm can finish successfully.
