---
task: booking-email-dedupe
timestamp_utc: 2025-11-16T00:58:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Booking email dedupe

## Objective

Ensure exactly one guest email per booking outcome: a single confirmation when the booking is confirmed, and a single “request received” email only when confirmation fails and the booking remains pending.

## Success Criteria

- No duplicate confirmation emails for newly confirmed bookings (inline auto-assign path).
- Pending bookings continue to send exactly one pending email.
- Confirmation still sent when background auto-assign later confirms a previously pending booking.

## Architecture & Components

- `src/app/api/bookings/route.ts`: inline auto-assign flow currently sends confirmation directly and records inline email result.
- `server/jobs/booking-side-effects.ts`: handles pending/confirmation email dispatch for booking creation.
- `server/jobs/auto-assign.ts`: background confirmation sends confirmation emails.

## Data Flow & API Contracts

- Booking creation POST → inline auto-assign → `finalBooking` status → `enqueueBookingCreatedSideEffects`.
- `processBookingCreatedSideEffects` decides whether to queue/request pending or confirmation emails.
- Background auto-assign updates booking status; confirmation email sent from job after status flip.

## UI/UX States

- Not applicable (backend email flow).

## Edge Cases

- Dev environment where queue is disabled (direct sends) vs enabled.
- `SUPPRESS_EMAILS` / `LOAD_TEST_DISABLE_EMAILS` short-circuit.
- Idempotent booking creation retries should not cause multiple sends.

## Testing Strategy

- Unit/integration: adjust/extend tests around booking creation side-effects and inline auto-assign result to assert single send.
- Manual: trigger a booking in dev; confirm only one confirmation email log; trigger pending path and confirm single pending email.

## Rollout

- Feature-flag independent; ship guarded by existing suppress env vars.
- Monitor logs for duplicate `[resend]` lines in booking creation and auto-assign jobs.

## DB Change Plan (if applicable)

- Not applicable (no schema changes).
