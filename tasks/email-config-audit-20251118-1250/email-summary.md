---
task: email-config-audit
timestamp_utc: 2025-11-18T12:50:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Email Configuration & Flows

## Provider & Config

- Provider: Resend (`libs/resend.ts`), with mock transport option (`RESEND_USE_MOCK=true`).
- Required envs: `RESEND_API_KEY`, `RESEND_FROM` (fallback mock address if mock enabled). Console warns/fails if missing.
- From addresses (built from `config.ts`):
  - Magic links: `config.email.fromNoReply` (e.g., `ShipFast <noreply@{supportDomain}>`).
  - Support/transactional: `config.email.fromSupport` (e.g., `ShipFast Support <support@example.com>`).
  - Reply-To resolution prefers requested → configured support email → fallback to base from; logs warning on fallback.
- Support email: `config.email.supportEmail` from `NEXT_PUBLIC_SUPPORT_EMAIL` (default `support@example.com`).
  Forward replies: `config.email.forwardRepliesTo` from `SUPPORT_FORWARD_EMAIL` (default support email).

## Outbound Email Types & Triggers

- Booking confirmations/updates/cancellations (guests):
  - Functions: `sendBookingConfirmationEmail`, `sendBookingUpdateEmail`, `sendBookingCancellationEmail`, `sendBookingModificationPendingEmail`, `sendBookingModificationConfirmedEmail` in `server/emails/bookings.ts`.
  - Triggered via `server/jobs/booking-side-effects.ts` on booking created/updated/cancelled.
    - Created: pending bookings queue “request_received” email (deferred if auto-assign enabled), confirmed bookings send “confirmation”.
    - Updated: sends update unless just transitioned to/from pending→confirmed; schedules reminders on pending→confirmed; schedules review request on completed.
    - Cancelled: sends cancellation.
  - Queue: BullMQ (`server/queue/email.ts`, worker `scripts/queues/email-worker.ts`), types `request_received` | `confirmation` | `reminder_24h` | `reminder_short` | `review_request`, with DLQ and observability events. Suppression via `LOAD_TEST_DISABLE_EMAILS` or `SUPPRESS_EMAILS`.
  - Templates render venue info, booking status badge, calendar/wallet attachments; Reply-To set to venue/support email.
- Team invitations:
  - Function: `sendTeamInviteEmail` (`server/emails/invitations.ts`).
  - Trigger: when creating a restaurant invite (via team/invitations flow); builds invite URL, includes expiry, role.
- Test endpoints/tools:
  - `POST /api/test-email` (`src/app/api/test-email/route.ts`): sends either simple test email or booking confirmation (mock booking) after `guardTestEndpoint`.
  - Scripts: `scripts/preview-booking-email.ts` (render HTML to stdout/file), `scripts/send-booking-confirmation.ts` (one-off send), queue worker `scripts/queues/email-worker.ts`.

## When/Why Emails Are Sent (Lifecycle)

- Booking created:
  - Status pending/pending_allocation → “request received” email (queued; may be delayed when auto-assign is on).
  - Status confirmed → confirmation email (queued immediately).
- Booking updated:
  - Any meaningful update (not just pending→confirmed transition) → update email.
- Booking cancelled:
  - Any cancellation with customer_email present → cancellation email.
- Booking modification flows:
  - Explicit calls available for modification pending/confirmed (not auto-triggered elsewhere; callable if flow uses them).
- Team invite:
  - When inviting staff to a restaurant; contains accept link and expiry.
- Manual/test:
  - `/api/test-email` for verification; preview/send scripts for ops/testing.

## Safety/Suppression

- Global suppression: `LOAD_TEST_DISABLE_EMAILS=true` or `SUPPRESS_EMAILS=true` skips guest emails (jobs log suppression).
- Queue DLQ captures failed jobs; observability events logged for delivered/skipped/failed.
- Placeholder/invalid reply-to auto-fallback with warning.

## Key Files

- Config: `config.ts` (email fields), `libs/resend.ts` (transport + reply-to logic).
- Booking emails: `server/emails/bookings.ts`; triggers `server/jobs/booking-side-effects.ts`; queue `server/queue/email.ts`; worker `scripts/queues/email-worker.ts`.
- Team invites: `server/emails/invitations.ts`.
- Test/ops: `src/app/api/test-email/route.ts`, `scripts/preview-booking-email.ts`, `scripts/send-booking-confirmation.ts`.
