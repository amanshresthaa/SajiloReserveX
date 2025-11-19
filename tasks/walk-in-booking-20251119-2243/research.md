---
task: walk-in-booking
timestamp_utc: 2025-11-19T22:43:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Walk-in booking entry for restaurant ops

## Requirements

- Functional: enable restaurant staff to capture a new booking/walk-in from the ops/restaurant console, ideally reusing the existing `/restaurants/[slug]/book` flow; auto-associate the booking with the active restaurant context; return staff back to ops after confirmation.
- Non-functional (a11y, perf, security, privacy, i18n): must remain keyboard navigable and screen-reader friendly; keep offline-friendly behavior for ops; respect existing booking performance (no noticeable delays on confirm); ensure only authenticated ops users can access; avoid exposing PII outside ops session context.

## Existing Patterns & Reuse

- Booking wizard already built in `reserve/features/reservations/wizard` with `mode` switch (`'customer' | 'ops'`) and ops submission hook `useCreateOpsReservation` calling `/ops/bookings`.
- Guest route `/guest/(guest)/(guest-experience)/reserve/r/[slug]/page.tsx` renders `ReservationWizardClient` with slug; can be reused with different navigator/return path.
- Ops shell/session (`src/app/app/(app)/layout.tsx`, `src/contexts/ops-session`) provides active restaurant id/slug; bookings screen `src/components/features/bookings/OpsBookingsClient.tsx` currently lists/manage bookings but has no creation CTA.
- Navigation helpers and components (e.g., `Button`, `OpsShell`), offline banner, analytics already used in booking wizard.

## External Resources

- None yet; will rely on in-repo booking wizard and ops APIs.

## Constraints & Risks

- Must stay within authenticated ops area; avoid exposing customer-facing thank-you page unless return path is adjusted to an ops URL.
- Wizard defaults (remembered contacts, draft storage) are customer-oriented; need to ensure ops mode disables customer-only behaviors appropriately.
- Need clear ownership of which restaurant is used; mismatch between active ops restaurant and wizard initialDetails could cause incorrect association.
- Potential need for role/permission check (owner/manager vs staff) before creating bookings.

## Open Questions (owner, due)

- Should walk-in creation return to `/app/bookings` or another ops dashboard? (owner: product, due: before build)
- Do we need reduced data entry (e.g., optional email/phone) for walk-ins, or keep existing fields? (owner: product)
- Should this be behind a feature flag for ops users? (owner: eng)

## Recommended Direction (with rationale)

- Reuse the existing `ReservationWizard` in `mode="ops"` with initial details sourced from active ops restaurant context; this leverages existing validation, offline handling, and `/ops/bookings` submission.
- Add an ops-facing entry point (CTA on bookings page) that routes to a new ops wizard page (e.g., `/app/bookings/new` or `/app/reserve`), prefilled with restaurant slug/id and with return path back to ops bookings.
- Keep UI consistent with existing ops shell (layout, headings). Document any ops-specific defaults in plan.
