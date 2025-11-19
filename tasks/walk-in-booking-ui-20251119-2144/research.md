---
task: walk-in-booking-ui
timestamp_utc: 2025-11-19T21:44:00Z
owner: github:@assistant
reviewers: []
risk: medium
flags: []
related_tickets: []
---

# Research: Walk-in booking UI

## Requirements

- Functional:
  - Restaurant walk-in booking page (`/bookings/new`) should adopt the guest-facing booking plan layout while keeping ops logic.
  - Email and phone remain optional for restaurant-created bookings; confirmations are only sent when email is provided.
  - Bookings created from the ops flow should be labeled/attributed as walk-in/restaurant-created for downstream visibility.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain accessible headings/landmarks and keyboard support across the wizard UI.
  - Preserve performance of the booking wizard (no regressions to loading states); reuse existing components to avoid bloat.
  - No secrets in source; continue using server-side Supabase clients.

## Existing Patterns & Reuse

- Guest-facing booking layout: `src/app/guest/(guest)/(guest-experience)/item/[slug]/page.tsx` uses gradient background, header badge, and a card-wrapped `BookingFlowPage` with `layoutElement="div"`.
- Ops walk-in flow: `src/components/features/walk-in/OpsWalkInBookingClient.tsx` already uses `BookingFlowPage` with `mode="ops"` for relaxed validation but a bare-bones layout.
- Wizard logic: `reserve/features/reservations/wizard` handles plan/details/review/confirm; ops mode already treats email/phone as optional in schemas.
- Ops booking API: `src/app/api/ops/bookings/route.ts` creates walk-ins with fallback contacts, sets `source` to `system`, and enqueues booking-created side effects (emails fire because fallback emails are stored).

## External Resources

- None needed; requirements covered by in-repo patterns.

## Constraints & Risks

- Booking DB columns require non-null strings; need to avoid email dispatch while still satisfying schema (consider using metadata flags rather than nulling email).
- Changing `source`/details for ops bookings must not break analytics or existing queries.
- Frontend layout changes must remain responsive and accessible; avoid regressions in ops tests that expect specific headings.

## Open Questions (owner, due)

- Q: Should ops-created bookings surface "walk-in" in UI lists beyond the wizard confirmation? A: Pending; will tag via `source`/details for downstream use.

## Recommended Direction (with rationale)

- Reuse the guest-facing layout shell (gradient background, header badge, card container) around the ops `BookingFlowPage`, keeping `mode="ops"` and restaurant selection logic intact.
- Add explicit messaging that contacts are optional and emails only send when provided.
- Tag ops-created bookings as `source: "walk-in"` (or similar) and adjust side effects to check provided-contact metadata so email jobs only run when an actual email was supplied.
