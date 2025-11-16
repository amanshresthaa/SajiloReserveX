---
task: resend-quota-guard
timestamp_utc: 2025-11-15T15:23:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Resend quota guard for dev/staging

## Requirements

- Functional: prevent local/dev bookings from failing noisily when Resend daily quota is exhausted; keep email side-effects observable for QA; preserve production behavior.
- Non-functional: maintain logging for quota incidents; ensure approach is opt-in/off for production; do not leak secrets; keep API compatible; minimal intrusion.

## Existing Patterns & Reuse

- `libs/resend.ts` already centralizes Resend client access, normalization, and mocking logic. Investigate if there is a mock transport or feature flag we can toggle quickly.
- `.env.example` and config helpers list feature flags; might reuse environment-derived switches.
- Jobs in `server/jobs/booking-side-effects.ts` and API route `src/app/api/bookings/route.ts` rely on `sendBookingConfirmationEmail`, so changes inside Resend helper propagate automatically.

## External Resources

- [Resend quota docs](https://resend.com/docs/emails/send-rate-limits) — confirm behavior when hitting daily limits; we need to mimic success locally or degrade gracefully.

## Constraints & Risks

- Must not mask real delivery failures in production; fallback should be limited to local/dev/staging.
- Bookings API should still return 201 even when email sending is bypassed; ensure we don’t break promise rejections relied on elsewhere.
- Logging must remain informative for support teams.
- Need to ensure we don’t spam Resend once quota returns (should keep ability to toggle real sends).

## Open Questions (owner, due)

- Q: Do we already have a mock toggle env var? (owner: @amankumarshrestha, due: 2025-11-15)

## Recommended Direction (with rationale)

- Add a config flag (env or existing `NODE_ENV`) that, when enabled (default for dev/test), short-circuits `sendEmail` to a mock implementation returning success but also logs the attempted payload. Keep production default to real Resend.
- Optionally store mock emails inside `artifacts` or console for QA but ensure PII sanitized.
- Document in `README` or `.env.example` so teammates can opt-in/out easily.
