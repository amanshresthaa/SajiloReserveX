# Implementation Plan: Rebuild Edit Booking Picker

## Objective

We will rebuild the edit booking date/time picker so it mirrors the reservation wizard: when a guest or ops user opens the dialog, the stored date and time are immediately active, availability loads for that day without extra clicks, and warnings surface only when their existing slot is no longer valid.

## Success Criteria

- [x] Opening the edit dialog for an upcoming booking shows the saved date selected in the calendar and the saved time highlighted in the time grid without further interaction.
- [x] The time input remains enabled after availability loads; users no longer have to reselect the date to activate time options.
- [x] The time grid automatically scrolls/focuses the saved slot when the dialog opens so it is visible without manual scrolling.
- [x] If the saved slot is no longer available, the UI surfaces an explicit warning while allowing the user to pick a new slot.
- [x] Loading messaging is consistent—no instructions about “scroll to load” appear during normal edits; availability status should stay actionable.
- [x] The derived end-time field clearly communicates duration (e.g., “Duration: 2 hours”) to explain the auto-calculation.
- [x] Unit tests cover the initial hydration, disabled-date handling, unavailable-slot messaging, and the auto-scroll behaviour.

## Architecture & Components

- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`: rewrite internal state management to use explicit React state (or reducer) for schedules, unavailability, and selection instead of relying on refs that don’t trigger re-renders. Ensure timezone handling matches the plan step.
- `reserve/shared/schedule/availability.ts`: reuse helpers (`deriveUnavailability`, `getDisabledDays`, `hasCapacity`, etc.) where possible; add any missing utility needed for the rebuild.
- `components/dashboard/EditBookingDialog.tsx`: confirm integration still passes the correct props; adjust only if the new picker API changes (prefer to keep backwards compatible).
- Tests under `reserve/tests/features/booking-state-machine/` and `reserve/tests/unit/EditBookingDialog.test.tsx`: expand coverage for the new behaviour.

## Data Flow & API Contracts

Endpoint: `/api/bookings` (read) and `/api/bookings/[id]` (patch) remain unchanged.
Request: picker still emits `{ startIso, endIso }` payloads via dialog submission.
Response: availability fetch continues calling `fetchReservationSchedule(restaurantSlug, dateKey)`.
Errors: Maintain existing `HttpError` handling in the dialog; picker should surface load failures and invalid selections.

## UI/UX States

- Loading: show “Loading availability…” while fetching the selected date, but keep the stored time visible.
- Empty: render existing “We’re closed” / “No slots” copy and disable time selection when the schedule returns closed or empty.
- Error: if availability fails to load, show the destructive alert and keep save disabled until the user picks a valid time.
- Success: once slots are available, the saved time remains highlighted; switching dates updates both calendar and time grid without requiring extra confirmation.

## Edge Cases

- Missing `restaurantSlug`/timezone: continue to show the alert and disable controls.
- Bookings in the past: clarify with product whether edits are allowed; default to clamping `minDate` to today unless requirements change.
- Saved time no longer available: display warning, keep form dirty state predictable, and avoid silently switching to the first slot.
- Network failure during fetch: retry affordance via toast/alert; ensure component doesn’t get stuck in disabled mode.

## Testing Strategy

- Unit: extend picker tests to cover initial hydration, fetch success, unavailable slot, and failure states.
- Integration: update `EditBookingDialog` tests to assert new props/behaviour (e.g., picker receives non-disabled state once data resolves).
- E2E: rely on existing booking E2E flows; add follow-up coverage if gaps appear after QA.
- Accessibility: manual pass in verification (keyboard navigation, screen-reader labelling).

## Rollout

- Feature flag: none (direct replacement).
- Exposure: ship to all environments; ensure caching keys unchanged to avoid regressions.
- Monitoring: rely on existing analytics (`booking_edit_opened`) and error logs; consider adding telemetry if new failure states arise.
