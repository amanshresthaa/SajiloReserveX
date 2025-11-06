# Implementation Checklist

## Setup

- [x] Draft Supabase migration for `confirm_hold_assignment_with_transition` RPC and new booking idempotency column/index.
- [ ] Update env schema/docs if new feature flag(s) required (e.g., `FEATURE_ATOMIC_CONFIRM_ENABLED`).
- [x] Enumerate existing call sites of `confirmHoldAssignment` to plan signature updates.

## Core

- [x] Refactor `confirmHoldAssignment` to accept atomic transition options + abort signal.
- [x] Implement `atomicConfirmAndTransition` orchestration invoking new RPC, reconciliation query, and rollback cleanup telemetry.
- [x] Persist deterministic auto-assign idempotency key on booking creation and hydrate into jobs/telemetry.
- [x] Update inline API + background job to call new atomic helper, share idempotency key, and respect cancellation outcomes.
- [x] Ensure compensating hold/table release executed on RPC failure paths.

## UI/UX

- [ ] N/A (no UI changes) — confirm no unexpected client regressions.

## Tests

- [x] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

-
