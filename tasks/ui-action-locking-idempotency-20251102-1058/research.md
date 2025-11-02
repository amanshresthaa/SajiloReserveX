# Research: UI Action Locking & Idempotency Plumbing (E11-S1)

## Requirements

- Functional:
  - Disable Validate/Hold/Confirm buttons during in‑flight.
  - Pass idempotency key and `contextVersion` for manual flows.
- Non‑functional:
  - No duplicate network requests; predictable UI state.

## Existing Patterns & Reuse

- `ManualAssignmentActions.tsx` already accepts `validating`/`confirming` and disable flags.
- `src/services/ops/bookings.ts` generates an `Idempotency-Key` header for ops assign; manual flows do not include context versions yet.
- Manual routes accept payloads without `contextVersion`.

## Recommended Direction

- Extend `services/ops/bookings.ts` manual calls to include `contextVersion` (and idempotency for confirm if not present).
- Ensure UI disables actions while `validating`, `holding`, `confirming` promises are in‑flight.
