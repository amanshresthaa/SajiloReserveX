---
task: email-config-audit
timestamp_utc: 2025-11-18T12:50:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Email Journey Brainstorm (When/Why to Send)

## Existing Sends (baseline)

- Booking lifecycle (already implemented): request received/pending, confirmation, update, cancellation, modification pending/confirmed.
- Team invites (staff onboarding).
- Test hooks (ops/dev).

## Candidate Emails & Triggers (guest-facing)

- **Post-visit review ask**
  - Trigger: `status=completed` (or after checkout timestamp) with a 1–3 hr delay.
  - Content: lightweight CTA to leave a review or NPS (link with booking reference/restaurant slug).
  - Safeguards: one review email per booking; respect marketing_opt_in; backoff/suppression flags; skip if `customer_email` missing.
  - Observability: log event `email.review_requested`.
- **Pre-visit reminder**
  - Trigger: 24h (or config) before `start_at`, if status still `confirmed`.
  - Content: date/time, party size, policy highlights, manage/reschedule link, contact info.
  - Safeguards: suppress if cancelled/updated within last X minutes; skip if pending.
- **Last-minute “you’re up soon” heads-up**
  - Trigger: 2–3h before `start_at` (configurable) when `confirmed`.
  - Content: arrival guidance, navigation link, check-in instructions; optional “running late?” CTA.
  - Safeguards: throttle with previous reminder; avoid double-send after modifications.
- **Waitlist/allocation update**
  - Trigger: `pending_allocation` → `confirmed`.
  - Content: “You’re off the waitlist / table secured” message; reuse confirmation template with adjusted headline.
- **No-show follow-up**
  - Trigger: `status=no_show` finalization.
  - Content: polite “we missed you” with rebook CTA; optional penalty notice if policy requires.
  - Safeguards: configurable opt-in; avoid if flagged for misuse.
- **Policy / deposit change notice**
  - Trigger: booking updated where policy/deposit fields change materially.
  - Content: highlight changed terms; require explicit acknowledgment link if needed.
- **Loyalty/points awarded**
  - Trigger: post-checkout when `loyalty_points_awarded > 0`.
  - Content: points earned, balance link, redemption tips.
- **Special occasion upsell**
  - Trigger: booking notes contain patterns (birthday/anniversary) and lead time > 24h.
  - Content: pre-order cake/flowers, upsell packages; require opt-in tag to avoid creepiness.
- **Cancellation waitlist recovery**
  - Trigger: When a cancelled timeslot frees capacity and there’s a pending/waitlist booking for same window.
  - Content: “Spot opened up” with quick confirm CTA; throttle to avoid spam storms.

## Candidate Emails (staff/ops-facing)

- **Orderbook digest**
  - Trigger: daily at venue-local morning; summary of today’s bookings, new/cancelled overnight.
  - Audience: restaurant ops/emails on record.
- **Anomaly/alert**
  - Trigger: high cancellation rate, many auto-assign failures, queue flush failures.
  - Audience: ops/internal; include links to dashboards/logs.
- **Invite reminder**
  - Trigger: team invite still pending N days before expiry.

## How to implement safely

- Reuse queue + suppression flags; add job types (e.g., `review_request`, `reminder`, `late_notice`).
- Add per-email-type feature flags and venue-level toggles.
- Respect `marketing_opt_in` + allow-list for transactional vs. marketing.
- Add idempotency keys per booking per email-type to prevent dupes.
- Provide preview/testing endpoints (like existing `/api/test-email`) for new templates.
- Observability: emit structured events per send/skip/fail; DLQ path already exists.
- Rate limits: cap sends per booking/day and per customer/day; backoff on bounce/complaint signals if available.

## Sequencing (suggested)

1. Reminders (24h + 3h) and waitlist/confirmation transitions.
2. Review request after completion.
3. Loyalty/points and no-show follow-up as optional toggles.
4. Staff digests/invite reminders.

## Unknowns / decisions needed

- Which venues want reminders/reviews on by default? (venue-level config)
- What is acceptable send window (time-of-day constraints, timezone handling)?
- Do we track marketing consent separately from transactional? (honor `marketing_opt_in` minimally)
- Bounce/complaint handling feasibility with Resend (webhooks not wired here yet).
