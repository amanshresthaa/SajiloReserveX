---
task: pending-booking-admin-alert
timestamp_utc: 2025-11-21T15:30:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Pending Booking Admin Alert

## Requirements

- Functional: When auto-assign/hold fails (e.g., "Insufficient filtered capacity" and job exhausted), automatically email the restaurant admin with booking reference/details indicating the booking is pending and needs attention.
- Non-functional: Respect AGENTS policies (no secrets in code, Supabase remote only, Conventional Commits), reuse existing email infrastructure, avoid duplicate notifications.

## Existing Patterns & Reuse

- Email sending via Resend in logs (subject "Reservation request received – White Horse Pub (Waterbeach)") likely implemented in `/src/app/api/bookings` or shared mailer utilities.
- Auto-assign flow logs: `[bookings][POST][inline-auto-assign]` and `[auto-assign][job]` indicate job-based attempts; status reason `Insufficient filtered capacity`.
- Booking status enums include `pending`, `pending_allocation`, `confirmed`, etc.; RLS and assignments in Supabase.
- Likely an assignment queue/worker source under `server/capacity/table-assignment` and API routes under `src/app/api/bookings`.

## External Resources

- None needed beyond existing repo patterns; Resend is already configured.

## Constraints & Risks

- Must ensure email sends once per pending booking (avoid spamming repeated job attempts).
- Need restaurant admin email source (probably `restaurants.contact_email`); must handle nil gracefully.
- Must avoid blocking the booking request; email should be best-effort/background.

## Open Questions (owner, due)

- What constitutes pending? Assume booking remains `pending`/`pending_allocation` after auto-assign fails. (Owner: @amankumarshrestha; Due: design)
- Should we dedupe within a time window? Assume single email on transition-to-pending and ignore repeats unless status changes. (Owner: @amankumarshrestha; Due: implementation)

## Recommended Direction (with rationale)

- Hook into auto-assign failure path (job exhausted / no hold) and trigger a "pending attention" email once per booking when assignment fails.
- Use existing email sender utility (Resend) with admin/restaurant email derived from DB; include booking reference, date/time, party size, status.
- Persist a flag or use idempotency key (e.g., store a notification marker in booking metadata or check log to avoid duplicates).
