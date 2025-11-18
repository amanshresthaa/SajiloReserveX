---
task: email-config-audit
timestamp_utc: 2025-11-18T12:50:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Email Journey Expansion

## Objective

Stand up psychologically-safe email journeys (reminders, review requests, waitlist confirmations) with scheduling, dedupe, and opt-in controls, reusing existing queue and templates.

## Success Criteria

- [ ] New email job types for reminders and review requests wired into queue/worker with idempotent job IDs.
- [ ] Booking side-effects enqueue appropriate jobs based on status/timing; suppress on quiet hours/past events.
- [ ] Safeguards: suppression flags respected; one send per booking per type; default timing sensible (24h + 2h, 1–3h post-completion).

## Architecture & Components

- Config/flags: new feature flags for reminders/reviews defaults (env-driven in `lib/env` + `server/feature-flags`).
- Queue: extend `EmailJobType` union + worker switch in `scripts/queues/email-worker.ts` / `server/queue/email.ts`.
- Triggers: extend `server/jobs/booking-side-effects.ts` to schedule jobs (`enqueueEmailJob`) with computed delays, idempotent jobIds (`{type}:{bookingId}`).
- Sending: implement handlers (reminder, review) in `server/emails/bookings.ts` (reuse base rendering) with appropriate copy.

## Data Flow & Contracts

- Booking created/updated events supply booking.id, status, start_at, restaurant_id.
- Queue job fetches fresh booking to avoid stale data, checks status/timing before send.
- Job payload: `{ bookingId, restaurantId, type, scheduledFor? }`.

## UI/UX States

- Email copy: reassuring reminders, low-friction review ask; avoid urgency/shame.
- No user-facing UI changes; only outbound emails.

## Edge Cases

- Quiet hours: skip if scheduled send time already passed or start_at within minimal window.
- Missing customer_email: skip.
- Suppression flags (`SUPPRESS_EMAILS`, `LOAD_TEST_DISABLE_EMAILS`) skip sends.
- Prevent double-send on rapid status changes via jobId dedupe + runtime checks.

## Testing Strategy

- Unit-ish: add/adjust tests if present, otherwise rely on typecheck and controlled enqueue + mock send logs.
- Manual: use `/api/test-email` for sanity; log outputs from worker in mock mode.

## Rollout

- Enable behind flags; default off for new types if needed.
- Start with reminders + review ask; extend to additional journeys later.
