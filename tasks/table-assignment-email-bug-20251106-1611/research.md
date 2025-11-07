# Research: Table Assignment Email Bug

## Requirements

- Functional:
  - When a booking is manually assigned tables via the staff confirm endpoint, the guest should receive the "reservation confirmed" ticket email (not the "request received" template).
  - Booking status must transition to `confirmed` so downstream automation (e.g., calendars, analytics) treat it as a confirmed reservation.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Respect global email suppression flags (`SUPPRESS_EMAILS`, `LOAD_TEST_DISABLE_EMAILS`).
  - Avoid duplicate notifications if the booking is already confirmed.

## Existing Patterns & Reuse

- Auto-assign worker (`server/jobs/auto-assign.ts`) calls `atomicConfirmAndTransition` and, on success, reloads the booking then invokes `sendBookingConfirmationEmail`.
- Inline auto-assign path in `src/app/api/bookings/route.ts` mirrors that pattern for immediate confirmations.
- Email template logic (`server/emails/bookings.ts`) derives subject/body from `booking.status`, sending the "request received" version when status is `pending`/`pending_allocation`.

## External Resources

- Supabase RPC `confirm_hold_assignment_with_transition` (defined in `supabase/migrations/20251106110000_atomic_confirm_with_transition.sql`) already performs assignment + status transition atomically when invoked through `confirmHoldAssignment` with `transition` options.

## Constraints & Risks

- Manual confirm route currently omits the `transition` argument, so bookings remain `pending`; updating behaviour must stay backward-compatible with existing ops UI flows.
- Need to guard against resending confirmation for bookings already confirmed (idempotency via status check).
- Ensure history metadata is populated so booking audit logs remain meaningful.

## Open Questions (owner, due)

- Q: None
  A: —

## Recommended Direction (with rationale)

- Update `src/app/api/staff/manual/confirm/route.ts` to pass a `transition` payload (target `confirmed`, reason `manual_assign`) into `confirmHoldAssignment`, ensuring the booking status flip happens inside the atomic RPC.
- After successful confirmation, reload the booking via the service client; if status is `confirmed` and emails are not suppressed, call `sendBookingConfirmationEmail` so the guest receives the correct template.
- Include the actor (`user.id`) in history metadata to preserve auditability and avoid duplicate sends when the booking is already confirmed.
