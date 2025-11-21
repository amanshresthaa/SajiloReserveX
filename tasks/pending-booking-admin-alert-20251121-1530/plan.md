---
task: pending-booking-admin-alert
timestamp_utc: 2025-11-21T15:30:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Pending Booking Admin Alert

## Objective

Email the restaurant admin when auto-assignment fails and a booking stays pending, containing booking reference and details, without spamming duplicates.

## Success Criteria

- [ ] Detect auto-assign failure that leaves booking pending.
- [ ] Send a single admin email with booking details, leveraging existing mailer.
- [ ] Avoid duplicate sends for the same booking failure (idempotent check).

## Architecture & Components

- Hooks: auto-assign job/inline flow in `server/capacity/table-assignment` or booking API routes.
- Email: reuse Resend mailer utility; admin email from `restaurants.contact_email` or fallback.
- State: add a notification flag to booking (e.g., metadata JSON) or check `pending_attention_notified_at` column if exists; else implement a lightweight persistence.

## Data Flow & Contracts

1. On auto-assign job exhausted/no-hold with reason insufficient capacity, mark booking as needing manual attention.
2. Before sending, check if notification already sent for that booking (flag or timestamp field).
3. Send email with booking reference, date/time, party size, contact info; mark as sent.

## Edge Cases

- Missing admin email → log warning; no send.
- Booking already confirmed/cancelled before job exhaust → no email.
- Concurrent job retries → rely on DB update with idempotency (e.g., update with WHERE notified_at IS NULL).

## Testing Strategy

- Unit test/email service call stub for pending notification.
- Integration test of handler path with mock mailer ensuring single send when multiple fail events are triggered.

## Rollout

- Feature flag optional; otherwise ship with idempotent guard. No DB migrations unless we add a column; prefer JSON metadata flag if column absent.

## DB Change Plan

- Prefer zero migrations; only add column if necessary for idempotency. If column required, draft migration and run remotely per policy.
