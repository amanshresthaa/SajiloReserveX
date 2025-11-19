# Email Trigger Logic (Source of Truth)

Comprehensive map of where transactional emails are triggered, the conditions applied, and how they are delivered. Paths include line numbers for fast lookup.

## Quick Matrix

| Event / state                                | Job type (if queued)             | Handler                                       | Recipient    | Notes                                                                      |
| -------------------------------------------- | -------------------------------- | --------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| Booking created (pending/pending_allocation) | `request_received`               | `sendBookingConfirmationEmail`                | Guest        | May defer via auto-assign; inline fallback on queue failure.               |
| Booking created (confirmed)                  | `confirmation`                   | `sendBookingConfirmationEmail`                | Guest        | Reminders scheduled immediately (24h + ~2h).                               |
| Booking updated (non-pending transition)     | inline                           | `sendBookingUpdateEmail`                      | Guest        | Sent on edits that don’t move to pending/confirmed from pending.           |
| Pending → confirmed                          | `confirmation`                   | `sendBookingConfirmationEmail`                | Guest        | Triggers reminder scheduling.                                              |
| Modification pending                         | inline                           | `sendBookingModificationPendingEmail`         | Guest        | When reschedule moves to pending while tables reassigned.                  |
| Modification confirmed                       | inline / auto-assign             | `sendBookingModificationConfirmedEmail`       | Guest        | Inline success or auto-assign success; variant set by caller.              |
| Cancellation (guest-initiated)               | inline                           | `sendBookingCancellationEmail`                | Guest        | Customer-initiated cancellations.                                          |
| Cancellation (restaurant/system)             | inline                           | `sendRestaurantCancellationEmail`             | Guest        | Staff/system cancellations now use restaurant-facing copy.                 |
| Reminders                                    | `reminder_24h`, `reminder_short` | `sendBookingReminderEmail`                    | Guest        | 24h before and ~2h before (pref gated).                                    |
| Post-visit review                            | `review_request`                 | `sendBookingReviewRequestEmail`               | Guest        | ~60 min after end_at/start_at (pref gated).                                |
| Team invite                                  | inline                           | `sendTeamInviteEmail`                         | New teammate | On invite creation.                                                        |
| Test-only                                    | inline                           | `sendBookingConfirmationEmail` or simple test | Target email | `src/app/api/test-email/route.ts`, `scripts/send-booking-confirmation.ts`. |

## Global Gates (apply to all sends)

- **Env suppression**: `SUPPRESS_EMAILS` or `LOAD_TEST_DISABLE_EMAILS` short-circuits every send (`server/jobs/booking-side-effects.ts`, `server/bookings/modification-flow.ts`, `server/jobs/auto-assign.ts`, `scripts/queues/email-worker.ts`).
- **Recipient validity**: most paths require non-empty `customer_email`; reminder/review scheduling also needs `start_at` (`server/jobs/booking-side-effects.ts:133-199`).
- **Restaurant prefs**: reminders/review obey `email_send_reminder_24h`, `email_send_reminder_short`, `email_send_review_request` (`server/jobs/booking-side-effects.ts:144-199`, `scripts/queues/email-worker.ts:141-170`).
- **Suppression list**: queue worker skips if `customers.user_profiles.is_email_suppressed` is true (`scripts/queues/email-worker.ts:96-118`).
- **Idempotency**: queue worker marks `email-sent:<jobId>` in Redis for 48h to avoid duplicates (`scripts/queues/email-worker.ts:85-189`).
- **Queue vs inline**: feature flag `isEmailQueueEnabled` controls enqueue vs direct send; BullMQ job types defined in `server/queue/email.ts`.

## Lifecycle Triggers (booking)

### Creation (guest & ops)

- Trigger source: `enqueueBookingCreatedSideEffects` called after insert in guest route `src/app/api/bookings/route.ts:1220-1360` and ops route `src/app/api/ops/bookings/route.ts:780-840`.
- Pending/pending_allocation → queue job `request_received` (delayed by `getAutoAssignCreatedEmailDeferMinutes` when auto-assign is on) or inline confirmation fallback (`server/jobs/booking-side-effects.ts:201-299`).
- Confirmed at creation → queue `confirmation` now or inline send (`server/jobs/booking-side-effects.ts:268-299`).
- Reminders scheduled immediately when status is confirmed: 24h + short variant if prefs allow (`server/jobs/booking-side-effects.ts:301-317`).
- If created as `completed`, schedule review request (`server/jobs/booking-side-effects.ts:319-322`).

### Updates / reschedules (guest & ops)

- Trigger source: `enqueueBookingUpdatedSideEffects` in guest PUT `src/app/api/bookings/[id]/route.ts:720-820` and ops PATCH flows `src/app/api/ops/bookings/[id]/route.ts:360-430,500-560`.
- Transition pending→confirmed → send/queue confirmation + schedule both reminders (`server/jobs/booking-side-effects.ts:327-389`).
- Transition to pending from another state → no email; flow exits (`server/jobs/booking-side-effects.ts:336-393`).
- Other edits (time/party/contact/etc. without pending transition) → send booking update email immediately (`server/jobs/booking-side-effects.ts:395-401`).
- Status completes for first time → schedule review_request if enabled (`server/jobs/booking-side-effects.ts:403-406`).

### Cancellations

- Trigger source: customer DELETE `src/app/api/bookings/[id]/route.ts:880-940` and ops DELETE `src/app/api/ops/bookings/[id]/route.ts:650-740` which call `enqueueBookingCancelledSideEffects`.
- Side effect sends cancellation email when not suppressed and email present (`server/jobs/booking-side-effects.ts:409-435`).

### Guest/ops modification flow (reschedules requiring table realignment)

- Entry: `beginBookingModificationFlow` used by guest PUT when table realignment needed `src/app/api/bookings/[id]/route.ts:700-810` and ops PATCH `src/app/api/ops/bookings/[id]/route.ts:360-430`.
- Flow sets status to pending and clears assignments; if inline auto-assign succeeds within timeout → send `sendBookingModificationConfirmedEmail` immediately (`server/bookings/modification-flow.ts:83-182`).
- If inline attempt fails/times out → send `sendBookingModificationPendingEmail` and schedule background auto-assign with modified email variant (`server/bookings/modification-flow.ts:185-212`).
- Background auto-assign may later send modification confirmed or standard confirmation once tables allocated (`server/jobs/auto-assign.ts:178-220,480-535,649-690`).

### Auto-assign background confirmations

- Job `autoAssignAndConfirmIfPossible` (invoked after creation retries, modification flow, or background schedulers) sends:
  - If booking already confirmed and no inline email sent → resend confirmation or modification-confirmed depending on `emailVariant` (`server/jobs/auto-assign.ts:178-203`).
  - On successful background confirmation → send confirmation or modification-confirmed unless suppressed or already sent inline (`server/jobs/auto-assign.ts:480-520` and coordinator shortcut `server/jobs/auto-assign.ts:649-690`).
- Skips when status is cancelled/no_show/completed (`server/jobs/auto-assign.ts:271-343` via earlier guards).

### Scheduled reminders & post-visit review

- Scheduling occurs in side-effects on creation/confirmation (see above).
- Execution happens via queue worker job types `reminder_24h`, `reminder_short`, `review_request` with state/pref/clock guards (`scripts/queues/email-worker.ts:141-170`).

### Queue worker send-time gating

- Handles `request_received`, `confirmation`, `reminder_*`, `review_request`, plus scaffolding for `booking_rejected` and `restaurant_cancellation` (no enqueues found in code) (`scripts/queues/email-worker.ts:123-184`).
- Skips reminders when start time is past (15m buffer) or booking not confirmed; review requires status `completed`.

## Other Email Paths

- Team invites: creating a restaurant invite sends `sendTeamInviteEmail` immediately (`server/team/invitations.ts:80-115`).
- Test-only utilities:
  - `src/app/api/test-email/route.ts` can send a simple email or a mock booking confirmation for diagnostics.
  - `scripts/send-booking-confirmation.ts` sends a confirmation email for a given booking id via CLI.

## Unused/Manual Job Types

- Queue supports `booking_rejected` and `restaurant_cancellation`, but no enqueuers are present; these would only send if a job is manually added to the email queue (`scripts/queues/email-worker.ts:171-179`, `server/queue/email.ts`). Decide: wire real enqueues, deprecate, or document as ops-only.

## Template/Content Source of Truth

- Booking templates (subjects, headings, calendar/wallet attachments): `server/emails/bookings.ts` (render + handlers near bottom).
- Team invite template: `server/emails/invitations.ts`.
- Subject lines and CTA labels live alongside handlers; update there to change content.

## Timing Reference (reminders & post-visit)

- Reminder windows: 24h before start (`REMINDER_24H_MINUTES = 1440`), ~2h before start (`REMINDER_SHORT_MINUTES = 120`) when prefs allow.
- Review request: ~60 minutes after `end_at` (fallback `start_at` or timestamps) (`REVIEW_DELAY_MINUTES = 60`).

## Coverage Gaps (existing backend surface area, no new impl)

- Queue job type `booking_rejected` exists but nothing enqueues it; only manual/ops queue entries would send.
- Status transitions `checked_in`, `no_show`, `completed` have no guest-facing email except the post-visit review when `completed`.
- Staff/ops are not emailed on guest actions (create/update/cancel); notifications are guest-only.
- Auto-assign failures/timeouts do not emit guest emails; guests only get pending/confirmed variants.
