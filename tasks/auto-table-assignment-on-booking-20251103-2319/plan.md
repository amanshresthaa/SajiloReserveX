# Implementation Plan: Auto table assignment on booking completion

## Objective

We will automatically assign a table immediately after a guest completes the booking, and send the confirmed email once status flips to confirmed—without any guest interaction.

## Success Criteria

- [ ] New bookings created with flag ON do not send the initial “request received” email.
- [ ] Allocator runs, confirms assignment, updates status to `confirmed`.
- [ ] Guest receives the confirmed “ticket” email once confirmed.

## Architecture & Components

- `server/jobs/auto-assign.ts`: best-effort job to quote ➜ confirm ➜ transition ➜ email.
- Feature flag: `FEATURE_AUTO_ASSIGN_ON_BOOKING` parsed in `lib/env.ts` and exposed via `server/feature-flags.ts`.
- Booking create route `POST /api/bookings`: fire-and-forget the job when flag enabled.
- `server/jobs/booking-side-effects.ts`: suppress created-email when flag + pending.

## Data Flow & API Contracts

- Quote: `quoteTablesForBooking({ bookingId, holdTtlSeconds, createdBy })`.
- Confirm: `confirmHoldAssignment({ holdId, bookingId, idempotencyKey })`.
- Transition: `rpc apply_booking_state_transition(..., p_status='confirmed', p_history_reason='auto_assign')`.
- Email: `sendBookingConfirmationEmail(booking)`.

## UI/UX States

- Guest-facing: unchanged; no table selection UI, only a later confirmed email.

## Edge Cases

- Already confirmed: send ticket and exit.
- No quote: leave pending/pending_allocation; retry per `FEATURE_AUTO_ASSIGN_RETRY_DELAYS_MS`.
- Conflicts/validation: log and exit without guest email.

## Testing Strategy

- Unit/integration where feasible:
  - Mock allocator success: ensure transition and email fire.
  - Mock allocator failure: ensure no email, no crash.
- Manual: Place booking via POST ➜ observe DB assignments and received email with flag ON.

## Rollout

- Feature flag off by default; enable per env.
- Monitor allocator conflicts, email rate, and time-to-confirm metrics.
