# Research: Limit Check-in/Mark Show to Today

## Existing Patterns & Reuse

- `src/components/features/booking-state-machine/BookingActionButton.tsx` decides whether the primary ("Check in") and secondary ("Mark no show") buttons are enabled purely from booking status; there is no date-aware gating today.
- Ops dashboards (`src/components/features/dashboard/BookingsList.tsx` and `BookingDetailsDialog.tsx`) already know the selected service date and timezone via `OpsTodayBookingsSummary`, so they can feed contextual availability into shared UI.
- The broader bookings table (`components/dashboard/BookingsTable.tsx` → `BookingRow.tsx`) renders the same `BookingActionButton` for legacy ops flows, exposing `BookingDTO.startIso` timestamps that can be compared against “today”.
- API routes for lifecycle transitions live under `src/app/api/ops/bookings/[id]/(check-in|no-show)/route.ts` and call `prepareCheckInTransition` / `prepareNoShowTransition` without validating the booking date against the current day.

## External Resources

- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) — existing utilities (`getTodayInTimezone`) already wrap the API for consistent YYYY-MM-DD output.

## Constraints & Risks

- Restaurants operate in arbitrary IANA timezones; the comparison must respect the venue’s timezone rather than the server's or operator’s local time.
- Lifecycle routes are already under test (`tests/server/ops/booking-lifecycle-routes.test.ts`); modifying their behaviour means adjusting shared mocks to handle the additional restaurant lookup.
- UI changes must keep the action buttons accessible (tooltips/options) even when disabled to explain why the action is unavailable.

## Open Questions (and answers if resolved)

- Q: Do we have access to restaurant timezone when invoking the lifecycle routes?
  A: Yes — the booking row includes `restaurant_id`; we can fetch `restaurants.timezone` before validating.
- Q: Should we block future-dated bookings from lifecycle actions in both the UI and API?
  A: Requirement explicitly says “should be only available in today’s date,” so both presentation and server validation should enforce the same guard.

## Recommended Direction (with rationale)

- Extend `BookingActionButton` with an availability context so callers can disable lifecycle actions when the booking is not for the current (timezone-aware) service date, reusing the shared tooltip pattern for clarity.
- In Ops dashboards, compute `isActionableToday` by comparing `summary.date` with `getTodayInTimezone(summary.timezone)` and pass that flag through to the button; in the legacy bookings table, derive the booking’s service date from `startIso`.
- Harden the `check-in` and `no-show` API routes by fetching the restaurant timezone and returning a 409/422 when `booking_date` differs from today’s date in that zone. This ensures parity with the UI and prevents bypassing via direct API calls.
