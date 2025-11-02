# Research: Deterministic Idempotency Key + Payload Checksum (E2-S1)

## Requirements

- Functional:
  - Derive idempotency key from `(tenant_id, booking_id, sorted table_ids, window, policy_version)`.
  - Compute `payload_checksum` (SHA‑256) of the full request payload.
  - DB: extend `booking_assignment_idempotency` with `payload_checksum text not null`, `expires_at timestamptz null`, unique composite index `(tenant_id, key)`.
  - Reject if same key appears with different checksum (return `RPC_VALIDATION/IDEMPOTENCY_MISMATCH`).
- Non‑functional:
  - Stable across retries; robust to field ordering.
  - Avoid storing PII in checksums (hash only; no raw payload storage).

## Existing Patterns & Reuse

- `server/capacity/v2/utils.ts#createPlanSignature` deterministically hashes `(bookingId, tableIds, startAt, endAt[, salt])` → 16‑hex short signature; used for idempotency defaults.
- `server/capacity/v2/supabase-repository.ts` sends `p_idempotency_key` to `assign_tables_atomic_v2` but no checksum.
- `server/capacity/tables.ts#synchronizeAssignments` updates `booking_assignment_idempotency` (no checksum yet).
- Policy has no explicit version; can hash `getVenuePolicy()` as `policy_version`.

## External Resources

- SHA‑256 via Node `crypto.createHash('sha256')` (already used).

## Constraints & Risks

- `tenant_id`: Treat `restaurant_id` as tenant in our schema.
- Schema change requires remote migration (Supabase remote‑only rule).
- Backwards compatibility: accept legacy rows with null checksum until fully migrated; or gate by feature flag.

## Open Questions (owner, due)

- Expiry policy for idempotency ledger? (DBA) – Proposed: default 24–48h via cleanup job.
- Where to compute policy_version? (BE2) – Proposed: stable JSON canonicalization and SHA‑256 of `getVenuePolicy()` result.

## Recommended Direction (with rationale)

- Add `createDeterministicIdempotencyKey(tenantId, bookingId, tableIds, window, policyVersion)` utility (reuse normalization + SHA‑256 → short hex).
- Add `computePayloadChecksum(payload)` using stable JSON stringify and SHA‑256.
- Extend repository to pass both to RPC or ledger and enforce mismatch rejection in DB function or app layer with clear `RPC_VALIDATION/IDEMPOTENCY_MISMATCH`.
- Write migration for `booking_assignment_idempotency` with new columns and unique composite `(tenant_id, key)`.
