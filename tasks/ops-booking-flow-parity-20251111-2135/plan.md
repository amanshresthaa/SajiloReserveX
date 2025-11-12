# Implementation Plan: Ops Booking Flow Parity

## Objective

Bring the `/ops/bookings/new` walk-in flow back in sync with the customer booking lifecycle while keeping ops-only conveniences (optional contact fields). Ensure ops-created bookings emit the same pending/confirmation notifications as customer bookings and fail over to the restaurant’s contact email when guests provide none.

## Success Criteria

- [ ] Ops-created bookings enter the system with `status="pending"` (or `pending_allocation` via unified validator) and trigger the “request received” email path.
- [ ] When the email field is blank, the booking record stores the restaurant contact email so notifications still send; guest-provided emails remain unchanged.
- [ ] Unified + legacy validation paths share the same fallback behavior and continue to accept optional phone/email.
- [ ] Updated Vitest coverage passes for `tests/server/ops/bookings-route.test.ts`.
- [ ] Lint (at least for touched files) runs clean.

## Architecture & Components

- `src/app/api/ops/bookings/route.ts`
  - Fetch restaurant contact info (contact email, optionally phone) once per request.
  - Adjust fallback logic so identity (`customers` table) still uses synthetic addresses while outbound notifications default to the restaurant email when needed.
  - Ensure insert payload uses `status="pending"` for legacy path; unified path already inherits BookingValidationService defaults but we will align fallback handling there as well.
- `server/jobs/booking-side-effects.ts` (no code changes anticipated if booking records always contain a valid `customer_email`).
- Tests: `tests/server/ops/bookings-route.test.ts` needs new assertions for pending status + fallback recipients.

## Data Flow & API Contracts

- POST `/api/ops/bookings`
  - Request: unchanged schema.
  - Response: unchanged.
  - Side effects: booking rows now store `customer_email = restaurant.contact_email` when staff omit email. Identity fallback for `customers` and history remains synthetic.

## UI/UX States

- Wizard already handles pending states. No visual changes expected beyond the booking status shown in confirmation cards (should now display pending).

## Edge Cases

- Restaurant contact email missing → fall back to existing synthetic `walkin+<slug>@system.local`.
- Restaurant contact phone missing → continue generating dummy `000-<slug>` so unique customer identity persists.
- Idempotent submissions should continue to short-circuit before inserts; ensure fallback logic respects duplicates (i.e., do not double-insert).

## Testing Strategy

- Unit/Vitest: extend `tests/server/ops/bookings-route.test.ts` to cover:
  1. Defaulting to pending status and verifying `customer_email` equals restaurant contact when staff omits email.
  2. Existing success + idempotency cases still pass.
- Manual: after API changes, run lint + targeted tests. (Full wizard QA deferred until verification phase.)

## Rollout

- No feature flagging required; change is limited to ops endpoint.
- Monitor logs for ops booking creation errors and ensure staff confirm that pending emails arrive.
