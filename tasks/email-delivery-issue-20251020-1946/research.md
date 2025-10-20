# Research: Email Delivery Investigation

## Existing Patterns & Reuse

- Transactional emails are sent through `libs/resend.ts`, which wraps the official `resend` SDK and enforces environment validation via `lib/env.ts`.
- Booking-related notifications originate in `server/jobs/booking-side-effects.ts`; on booking creation it awaits `sendBookingConfirmationEmail` (server/emails/bookings.ts).
- Email templates (HTML/text plus ICS attachment) are produced in `server/emails/bookings.ts`; attachments are base64 encoded before calling Resend.
- A dev utility endpoint exists at `src/app/api/test-email/route.ts` to trigger either a simple test email or a full booking confirmation email for diagnostics.

## External Resources

- Resend API docs (Authentication & email send endpoints) – referenced to confirm expected behaviour when domains/keys are invalid.
- DNS lookups via `dig` for `resend.adtechgrow.com` to validate sender domain configuration.
- Supabase Auth (magic link) relies on Supabase project's SMTP configuration; no local SMTP defined in `.env.local`.

## Constraints & Risks

- `.env.local` ships with `RESEND_API_KEY` and `RESEND_FROM=noreply@resend.adtechgrow.com`; DNS queries for this subdomain return no records, suggesting the domain may not be fully delegated to Resend.
- `config.email.supportEmail` defaults to `support@example.com`; this value is injected as the `replyTo`, which could hurt deliverability or cause provider rejections.
- Supabase magic-link flow depends on remote Supabase SMTP. If that project lacks a verified email provider, auth emails will never leave Supabase although the UI records `auth_magiclink_sent`.
- Remote Supabase credentials in `.env.local` point to the production project; any debugging needs to avoid mutating live data.

## Open Questions (and answers if resolved)

- Q: Is `resend.adtechgrow.com` actually verified with Resend?  
  A: `dig` returns no DNS records for the subdomain, implying the verification CNAME/TXT records might be missing. API calls succeed, so Resend accepts the payload, but mail could be silently dropped due to an unverified or misconfigured domain.
- Q: Are booking emails reaching Resend at all?  
  A: Server logs show `[resend] Email sent successfully. ID: …`. The Resend API accepts manual test sends with the same key, returning an ID, which confirms credentials are valid.
- Q: Why are auth magic links missing?  
  A: Supabase Auth uses its configured SMTP provider. With none specified (no `EMAIL_SERVER` locally, and unknown remote config), Supabase may log success but never deliver messages.

## Recommended Direction (with rationale)

- Audit and correct email sender configuration: ensure `RESEND_FROM` uses a domain that is verifiably delegated to Resend (update `.env.local` and supporting docs accordingly). Add runtime checks to warn when `resendFrom` domain lacks DNS records.
- Replace the `replyTo` fallback with a configurable, valid support mailbox so providers trust the message headers.
- Provide a developer-facing health check (extending `/api/test-email`) that surfaces Resend domain verification status and common misconfigurations to catch setup issues early.
