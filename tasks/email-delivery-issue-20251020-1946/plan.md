# Implementation Plan: Email Delivery Investigation

## Objective

We will enable users to reliably receive transactional emails so that booking confirmations arrive in their inboxes consistently.

## Success Criteria

- [ ] Identify and document the causes behind “email sent” logs not translating into received messages.
- [ ] Ship configuration/runtime changes that harden sender metadata and reduce spam likelihood.
- [ ] Provide a repeatable diagnostic (CLI/runbook) that confirms Resend delivery status for a target inbox.

## Architecture & Components

- `libs/resend.ts` – ensure sender + reply-to use trustworthy values pulled from configuration and surface warnings when misconfigured.
- `config.ts` / `lib/env.ts` – introduce env-driven support mailbox values instead of hard-coded placeholders.
- New script under `scripts/email/check-resend-status.ts` – leverage Resend SDK to fetch domain verification and latest message events for a given recipient.
- Documentation update (new runbook under `documentation/` or addendum to existing email setup docs) explaining verification steps.

## Data Flow & API Contracts

- Booking flow: `POST /api/bookings` → `enqueueBookingCreatedSideEffects` → `sendBookingConfirmationEmail` → `sendEmail` (calls Resend API).
- Resend SDK: `resend.emails.send(payload)` returns `{ data: { id } }`; diagnostics script will call `resend.domains.list()` and `resend.emails.list/get()` to report `last_event`, timestamps, subject.
- CLI interface: `pnpm email:check --to <address> [--limit N]` outputs JSON/pretty table summarising latest events for that recipient.

## UI/UX States

- Loading: N/A
- Empty: N/A
- Error: N/A
- Success: N/A

## Edge Cases

- Resend domain verified but reply-to left at default `support@example.com` → treat as misconfiguration and fall back to sender domain.
- Address suppressed/bounced in Resend – surface via diagnostics script with clear flag.
- Supabase magic-link emails use separate SMTP; document how to differentiate (logs vs Resend status) to avoid false negatives.

## Testing Strategy

- Unit: add tests for new helper that computes reply-to fallback and validates domains.
- Integration: mock Resend SDK in script tests to ensure CLI handles success, missing recipient, and API errors.
- E2E: manual CLI run against real Resend credentials to confirm output matches dashboard; booking flow smoke-test to verify updated headers.
- Accessibility: N/A (no UI changes expected)

## Rollout

- Feature flag: N/A
- Exposure: N/A
- Monitoring: rely on Resend portal + new CLI; add verification checklist entry referencing the script.
