# Implementation Plan: Idempotency Key + Payload Checksum (E2-S1)

## Objective

Derive a deterministic key and checksum to guarantee idempotency across retries; reject mismatches.

## Success Criteria

- [ ] Key derived from tenant, booking, window, sorted tables, policy_version.
- [ ] Payload checksum stored and enforced.
- [ ] Mismatch returns `RPC_VALIDATION/IDEMPOTENCY_MISMATCH`.

## Architecture & Components

- Utility: `createDeterministicIdempotencyKey(...)`, `computePayloadChecksum(payload)` in `server/capacity/v2/utils.ts` or new module.
- Repository: pass key + checksum; update `booking_assignment_idempotency` writes.
- DB: migration for new columns + unique index.

## Data Flow & API Contracts

- No endpoint change; services/headers may surface key for visibility.
- Error payload adds `{ code: 'RPC_VALIDATION', reason: 'IDEMPOTENCY_MISMATCH' }`.

## UI/UX States

- Show specific mismatch error prompting user to retry with original input.

## Edge Cases

- TTL cleanup; duplicate insert race protection kept at DB.

## Testing Strategy

- Unit: key + checksum determinism; policy_version hashing stable.
- Integration: retry with identical payload is idempotent; mutated payload → mismatch.

## Rollout

- Behind feature flag initially; enable in staging first.
