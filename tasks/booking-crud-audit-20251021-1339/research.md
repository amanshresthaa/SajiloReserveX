# Research: Booking CRUD Validation Audit

## Existing Patterns & Reuse

- `/reserve` flow relies on `components/reserve/booking-flow` which wraps `@features/reservations/wizard` (React Query + shared reducer/schemas) and surfaces validations via Zod plus server-side schedule checks.
- Customer + ops wizard share underlying reducers (`reserve/features/reservations/wizard/model`) and services (`reserve/features/reservations/wizard/services`) that fetch schedules, derive slots, and enforce occasion/service availability.
- API validation for bookings concentrated in `src/app/api/bookings/route.ts` (customer) and `/api/ops/bookings` (staff), both calling shared server helpers (`server/bookings`, `server/restaurants/schedule`, `server/bookings/timeValidation`, `server/bookings/pastTimeValidation`, `server/capacity/validation`).
- My bookings + ops dashboards reuse UI primitives (`components/dashboard/EditBookingDialog`, `BookingsTable`) and fetch via hooks (`hooks/useBookings`, `hooks/useOpsBookingsList`), delegating actual persistence to `/api/bookings/[id]` and `/api/ops/bookings/[id]`.

### Baseline `/reserve` Validation Stack

- **UI schemas**: `planFormSchema` (date format + regex time + party 1–12 + occasion + 500-char notes) and `createDetailsFormSchema` (name length, email/phone validation, terms) ensure client-side guardrails.
- **Temporal gating**: `PlanStep` derives timezone-aware min date; `useUnavailableDateTracking` prefetches `/restaurants/:slug/schedule` to block closed days or fully booked dates; times normalized to interval & closing window.
- **Draft sanitization**: `buildReservationDraft` trims contacts, enforces positive party, normalizes time & booking type.
- **Server-side enforcement**: `/api/bookings` POST validates payload (Zod), rate-limits, fetches schedule, runs `assertBookingWithinOperatingWindow` (disallow closed days/outside window), `assertBookingNotInPast` (feature-flagged), derives end time, and delegates to `createBookingWithCapacityCheck` for capacity + duplicate handling.
- **Evidence cross-check**: Confirmed via `reserve/features/reservations/wizard` unit tests (e.g., `BookingWizard.plan-review.test.tsx` for past-time messaging) and `/api/bookings/route.test.ts` covering operating-hours rejection.

## External Resources

- `COMPREHENSIVE_ROUTE_ANALYSIS.md` – enumerates booking endpoints with references.
- `documentation/API_INTEGRATION_GUIDE.md` – documents `/api/bookings` contract; useful for confirming expected validation responses.
- `tasks/prevent-past-bookings-20251015-1323/*` – prior work describing past-date blocking rollout (cross-verification of behavior).

## Constraints & Risks

- Feature flag `env.featureFlags.bookingPastTimeBlocking` gates past-date enforcement; need to account for flows that bypass or misconfigure it.
- Ops flows allow admin override via `allow_past` query; must ensure unified handling to avoid unauthorized overrides.
- Some flows (dashboard edit) bypass shared wizard logic, risk drift from `/reserve` validations (operating hours, closed days, capacity).
- Potential difference in API schema versions (`/api/v1/...` vs `/api/...`) may complicate refactor; ensure compatibility across clients.

### Observed Divergences (non-`/reserve`)

- **My bookings (`/api/bookings/[id]` dashboard path)**: `handleDashboardUpdate` (components/dashboard/EditBookingDialog → hooks/useUpdateBooking) skips `assertBookingWithinOperatingWindow` and capacity checks; only runs `assertBookingNotInPast` when time changes. Allows edits into closed days or outside service hours and may overbook (`server/bookings.ts:updateBookingRecord`).
- **Ops bookings edit (`/api/ops/bookings/[id]`)**: Similar omissions—PATCH validates against past time (with optional override) but never confirms slot availability or operating window; relies on plain `updateBookingRecord`.
- **Ops walk-in create (`/api/ops/bookings` POST)**: Uses `validateBookingWindow` (policy-derived) instead of live schedule; ignores `schedule.isClosed`, bypasses `assertBookingWithinOperatingWindow`, and inserts via `insertBookingRecord`, skipping capacity reconciliation. Potential to book on closed days, outside actual hours, and over capacity.
- **Shared UI (EditBookingDialog)**: `datetime-local` inputs operate in browser timezone; without schedule cross-check, users in other timezones could unknowingly pick invalid local times that become off-hours server-side.

## Open Questions (and answers if resolved)

- Q: Do non-wizard dashboards reuse shared validation helpers for operating hours?
  A: Not consistently – the legacy `/api/bookings/[id]` full-update path calls `assertBookingWithinOperatingWindow`, but the dashboard shortcut (`processDashboardUpdate`) and `/api/ops/bookings/[id]` patch skip it entirely.
- Q: Does `validateBookingWindow` fully overlap with wizard schedule enforcement?
  A: Needs confirmation during deeper dive; initial read suggests service policy coverage but may not flag explicit closed days without schedule context.

## Recommended Direction (with rationale)

- Use `/reserve` wizard + `/api/bookings` stack as canonical validation pipeline (schedule fetch + operating window + past-time + capacity). Other flows should reuse these server utilities instead of duplicating or omitting checks.
- Inventory discrepancies per flow, then propose shared validation layer (e.g., dedicated service that both dashboard and ops endpoints call) to minimise drift.
