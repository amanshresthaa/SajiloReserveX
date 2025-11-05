# Implementation Plan: Confirm email after table assignment

## Objective

Ensure bookings can transition to `confirmed` and trigger the confirmed email reliably.

## Success Criteria

- [x] Function `apply_booking_state_transition` no longer errors with ambiguous status.
- [x] Existing affected booking transitions to `confirmed` with history row.
- [x] Confirmed email delivered for affected booking.

## Architecture & Components

- DB function (PL/pgSQL): `public.apply_booking_state_transition(...)`.
- Email sender: `server/emails/bookings.ts#sendBookingConfirmationEmail`.

## Data Flow & API Contracts

- Transition via function; history written to `booking_state_history`.
- Email uses Resend with venue details, ICS attachment, and status-dependent template.

## UI/UX States

- No UI changes. Thank-you page remains unchanged.

## Edge Cases

- Concurrent state changes handled by function’s compare (history_from vs current).

## Testing Strategy

- Manual SQL invocation to verify transition and history.
- One-off script to send email for the affected booking.

## Rollout

- Remote DB function replaced in-place; stored as migration for traceability.
