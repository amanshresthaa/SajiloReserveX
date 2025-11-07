# Implementation Plan: Table Assignment Email Bug

## Objective

We will ensure the staff manual table confirmation flow flips bookings to `confirmed` and notifies guests with the reservation ticket email so operations no longer have to resend confirmations manually.

## Success Criteria

- [ ] POST `/api/staff/manual/confirm` passes the `transition` payload so bookings land in `confirmed` status after successful assignment.
- [ ] When the booking is confirmed (and emails are not suppressed), `sendBookingConfirmationEmail` is invoked with the reloaded booking payload.

## Architecture & Components

- `src/app/api/staff/manual/confirm/route.ts`: orchestrates permissions, invokes `confirmHoldAssignment`, and (after change) handles transition + email dispatch.
  State: server-only route | URL state: n/a

## Data Flow & API Contracts

Endpoint: `POST /api/staff/manual/confirm`
Request: `{ bookingId, holdId, idempotencyKey, contextVersion, requireAdjacency? }`
Response: `{ bookingId, holdId, assignments[] }` (unchanged)
Errors: Maintains existing error codes; new logic should bail early with 409 or skip email if status already `confirmed`.

## UI/UX States

- Loading: ...
- Empty: ...
- Error: ...
- Success: ...

## Edge Cases

- Booking already in `confirmed` state (no duplicate email).
- Email suppression flags active (skip send but still succeed).
- Failure fetching updated booking should not break API response but must log for observability.

## Testing Strategy

- Unit: Extend `tests/server/ops/manualAssignmentRoutes.test.ts` to assert `confirmHoldAssignment` receives `transition` + email helper is called when booking becomes confirmed; cover suppression scenario.
- Integration: n/a (handled by existing RPC tests).
- E2E: not required for API-only change.
- Accessibility: n/a (no UI).

## Rollout

- Feature flag: none (server behaviour change).
- Exposure: immediate.
- Monitoring: confirm via email delivery logs and booking history.
- Kill-switch: revert commit or set `SUPPRESS_EMAILS=true` as emergency stopgap.
