# Implementation Plan: UI Action Locking & Idempotency (E11-S1)

## Objective

Prevent duplicate requests and carry idempotency/context through manual flows.

## Success Criteria

- [ ] Buttons disabled during in‑flight actions.
- [ ] Manual routes receive contextVersion and idempotency where applicable.
- [ ] No duplicates in network panel.

## Architecture & Components

- FE: `ManualAssignmentActions.tsx` props already support disabled states; ensure parent state wiring covers Validate/Hold/Confirm.
- Services: `src/services/ops/bookings.ts` add `contextVersion` to manual validate/hold/confirm payloads; idempotency for confirm already present.
- Routes: validate presence of contextVersion (paired with E3‑S1).
