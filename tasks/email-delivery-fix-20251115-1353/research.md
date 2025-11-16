---
task: email-delivery-fix
timestamp_utc: 2025-11-15T13:53:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Booking emails not delivered

## Requirements

- Functional: ensure booking confirmation/cancellation/update flows fail fast when Resend declines a send request so ops can rely on email delivery status; surface real send identifiers in logs for debugging.
- Non-functional: no regressions to existing email templates; retain current logging style; solution must be testable without live Resend calls and should not require additional infrastructure.

## Existing Patterns & Reuse

- `libs/resend.ts` centralizes Resend integration; all server email helpers call `sendEmail` exported from this module.
- `server/jobs/booking-side-effects.ts` and `server/jobs/auto-assign.ts` already rely on `sendEmail` errors to decide whether to fall back or retry—so improving `sendEmail` error handling should automatically propagate.
- Tests already stub `@/lib/env` and import from `@/libs/resend` (`tests/server/libs/resend-reply-to.test.ts`), so we can follow that pattern to exercise new behavior.

## External Resources

- [Resend send API docs](https://resend.com/docs/api-reference/emails/send-email) — response always includes `data` or `error`, never both; today we ignore the error branch.

## Constraints & Risks

- Resend SDK returns `{ data: null, error: {...} }` without throwing; our code currently treats that as success and logs `ID: undefined`, misleading operators and silently dropping mail.
- Need to avoid crashing entire booking flow with ambiguous message; errors should carry Resend name + message for actionable alerting.
- Logging must not leak PII beyond what we already log (emails already printed today) and should still avoid secrets.

## Open Questions (owner, due)

- None — root cause understood from logs and SDK docs.

## Recommended Direction (with rationale)

- Update `sendEmail` to inspect the SDK response: throw a descriptive error (and log) when `result.error` exists or when no email ID is returned, so upstream callers can handle failures and ops see the truth instead of "success".
- Record the Resend error code/message in logs and include the request metadata (subject, recipients) that is already safe today for debugging.
- Add a focused unit test that exercises the new branch via a mocked Resend client to prevent regressions.
