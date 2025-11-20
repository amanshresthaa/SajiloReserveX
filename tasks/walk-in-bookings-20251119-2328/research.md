---
task: walk-in-bookings
timestamp_utc: 2025-11-19T23:28:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Walk-in Bookings Flow

## Requirements

- Functional:
  - Staff/restaurant operators need to create walk-in bookings using the same booking wizard as guests.
  - Entry point should live on the restaurant-facing side at `/walk-in`, with attribution as walk-in/ops for reporting.
  - Preserve the post-confirmation return to the ops context (e.g., bookings management).
- Non-functional (a11y, perf, security, privacy, i18n):
  - Keep wizard accessibility (keyboard/focus, aria) and perf budgets consistent with guest flow.
  - Authenticated-only route for ops; avoid exposing ops booking API to unauthenticated users via UI.
  - Ensure no PII leakage; reuse existing API validation for contact info.

## Existing Patterns & Reuse

- Booking wizard lives in `reserve/features/reservations/wizard` and supports `mode: 'ops'`, which routes submission through `useCreateOpsReservation` → `POST /api/ops/bookings` with `channel: "ops.walkin"` and `source: "walk-in"`.
- Customer-facing entry uses `src/app/guest/(guest)/(guest-experience)/reserve/page.tsx` via `ReservationWizardClient`, plus slugged variant `reserve/r/[slug]`.
- Ops shell/layout (`src/app/app/(app)/layout.tsx`) injects `OpsSessionProvider` with memberships/feature flags; navigation uses paths like `/bookings`, `/customers`, `/seating/*`.
- Ops bookings list at `src/app/app/(app)/bookings/page.tsx` renders `OpsBookingsClient` (no create CTA today).
- Ops booking API schema in `src/app/api/ops/bookings/schema.ts` (optional email/phone, override block).
- Prior ops walk-in page `/bookings/new` and `OpsWalkInBookingClient` were removed (see `tasks/remove-plan-page-20251119-2229`); redirect `/reserve` → `/bookings` remains in `next.config.js`.

## External Resources

- Internal docs: `COMPREHENSIVE_ROUTE_ANALYSIS.md` and `ROUTE_QUICK_REFERENCE.md` describe ops booking endpoints and channel/source tagging for walk-ins.

## Constraints & Risks

- Routing ambiguity: ops app currently uses paths like `/bookings` without an `/ops` prefix while guest booking routes live under `guest/*`; need to avoid collisions and ensure the new route sits in the ops layout/auth context.
- Active restaurant context: wizard defaults to `DEFAULT_RESTAURANT_*` unless initial details are provided; failing to use ops membership could book against the wrong venue or default slug.
- Discoverability: without a CTA or nav link, `/walk-in` may be hidden; adding entry points changes ops IA (needs UX sign-off).
- Legacy removal: reintroducing a walk-in flow must not regress prior cleanup (stale redirects/tests/scripts may need updates).

## Open Questions (owner, due)

- Q: Should `/walk-in` be exposed in navigation or just as a direct route? (owner: product/UX, due: before implementation)
  A: Pending.
- Q: Preferred return path after confirmation (`/bookings` vs dashboard) for ops flow? (owner: product, due: before implementation)
  A: Pending.
- Q: Should we auto-select the active ops restaurant and lock it, or allow switching within the wizard? (owner: product/eng, due: before implementation)
  A: Pending.

## Recommended Direction (with rationale)

- Add an authenticated ops route (`/walk-in`) that renders the existing `ReservationWizard` in `mode="ops"`, wrapped by the ops layout for context and styling.
- Prefill wizard `initialDetails` using the active ops membership (restaurant id/slug/name/address/timezone) and set `returnPath` to an ops page (likely `/bookings`) so staff land back in management after confirmation.
- Consider a discoverable CTA (e.g., in bookings header) pointing to `/walk-in` if IA approval is given; otherwise ensure the route is stable for direct use.
- Reuse existing ops booking API and validation; avoid new schemas. Keep a11y/perf parity with guest flow and document any deviations.
