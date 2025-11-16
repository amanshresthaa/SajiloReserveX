---
task: booking-email-dedupe
timestamp_utc: 2025-11-16T00:58:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Booking email dedupe

## Requirements

- Functional: avoid duplicate guest emails on booking creation; send one confirmation only when a booking is confirmed; send one “request received” email when auto-assign fails and booking stays pending.
- Non-functional: keep current email templates/branding; avoid breaking auto-assign flows; respect idempotency and suppress flags (`SUPPRESS_EMAILS`, `LOAD_TEST_DISABLE_EMAILS`).

## Existing Patterns & Reuse

- Emails are generated in `server/emails/bookings.ts` and dispatched via `sendBookingConfirmationEmail`/variants.
- Booking creation flow (`src/app/api/bookings/route.ts`) already invokes inline auto-assign and then enqueues `enqueueBookingCreatedSideEffects`, which can send emails.
- Auto-assign job (`server/jobs/auto-assign.ts`) sends confirmation emails after background confirmation; pending emails are handled in `server/jobs/booking-side-effects.ts`.

## External Resources

- None needed beyond current codebase.

## Constraints & Risks

- Must not regress pending email delivery for bookings that remain pending.
- Auto-assign background job currently responsible for confirmation sends when status flips from pending → confirmed; dedupe must not drop that.
- Queue/fallback paths can double-send if both run; need guard.

## Open Questions (owner, due)

- None outstanding.

## Recommended Direction (with rationale)

- Make a single authority per phase: creation side-effects handles both pending and confirmed emails; inline flow should stop sending directly to avoid duplicates. Keep background job path for pending → confirmed and consider dedupe guard to prevent double dispatch.
