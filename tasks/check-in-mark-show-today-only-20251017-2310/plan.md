# Implementation Plan: Limit Check-in/Mark Show to Today

## Objective

Ensure ops users can only trigger “Check in” and “Mark no show” lifecycle actions when the reservation belongs to the current service date in the restaurant’s timezone.

## Success Criteria

- [ ] `BookingActionButton` disables “Check in” and “Mark no show” for bookings whose service date is not today, with an explanatory tooltip.
- [ ] Ops dashboard summary view computes the availability flag from `summary.date`/`summary.timezone` and forwards it to all action buttons.
- [ ] Ops bookings table (list view) applies the same restriction by inspecting each row’s `startIso`.
- [ ] API routes `/api/ops/bookings/:id/check-in` and `/api/ops/bookings/:id/no-show` reject requests when the booking date differs from today in the restaurant’s timezone.
- [ ] Vitest coverage updated to exercise the new API guard.

## Architecture & Components

- `BookingActionButton`: accept a new `availability` prop describing whether lifecycle actions are allowed today and render disabled buttons + tooltip when false.
- `BookingsList` & `BookingDetailsDialog`: derive `isActionableToday` via `getTodayInTimezone(summary.timezone)` === `summary.date` and pass to `BookingActionButton`.
- `BookingRow`: convert `booking.startIso` into the restaurant-local date (use existing Intl helpers) and pass the availability flag.
- API routes `check-in` & `no-show`: fetch restaurant timezone, use `getTodayInTimezone` for comparison prior to calling `prepare…Transition`.

## Data Flow & API Contracts

Endpoint: POST `/api/ops/bookings/:id/(check-in|no-show)`
Request: `{ performedAt?: string, reason?: string }`
Response: unchanged on success; on mismatch returns `{ error: "Lifecycle actions are only available on the reservation date" }` with HTTP 409.
Errors: existing BookingLifecycle errors remain untouched.

## UI/UX States

- Loading: unchanged.
- Empty: unchanged.
- Error: existing toast handling surfaces 409 responses; disabled buttons keep a tooltip detailing the reason.
- Success: unchanged.

## Edge Cases

- Bookings near midnight/DST transitions — rely on `getTodayInTimezone` for correct comparison.
- Offline queue entries should not execute if the action is disallowed (buttons stay disabled, ensuring no new queue entries).
- Manual `performedAt` timestamps must still satisfy the same-day requirement enforced server-side.

## Testing Strategy

- Extend `tests/server/ops/booking-lifecycle-routes.test.ts` to cover the new 409 path and adjust shared mocks for the restaurant lookup.
- Consider a lightweight unit for the client-side helper (if introduced); otherwise rely on integration-level tests.
- Run `pnpm run test:ops` or the targeted Vitest suite covering lifecycle routes.

## Rollout

- No feature flag required; change is immediate after deploy.
- Monitor ops error logs for unexpected spikes of 409 responses to catch false positives.
