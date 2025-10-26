# Implementation Plan: Booking Edit Modal Refactor

## Objective

We will refactor the booking edit modal so restaurant managers always see consistent, trustworthy date/time feedback, preventing invalid submissions when the booking date changes.

## Success Criteria

- [ ] Changing the date clears the time input to `--:--`, shows the spinner, resets derived end-time copy, and keeps “Save changes” disabled until a new valid slot is selected.
- [ ] Selecting an unavailable/closed date replaces the slot grid with “We’re closed on this date…” messaging, keeps both time fields empty, and blocks saves.
- [ ] Re-opening the modal with an existing booking auto-scrolls/highlights the saved time after availability loads (no regression).
- [ ] Unit/component tests cover the above flows and pass alongside existing suites.

## Architecture & Components

- `components/dashboard/EditBookingDialog.tsx`: Extend save-button disable logic (`disabled={...}`) to require a committed `start` value; no structural UI changes beyond wiring additional props/state. Use `watch('start')` to reflect picker resets.
- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`: Add a “user-driven date change” guard to clear `draftTime/selectedTime`, call `commitChange(date, null)`, and suppress auto-select until the user chooses a slot. Emit slot-area messaging when `resolvedUnavailableMessage` exists.
- `reserve/features/reservations/wizard/ui/steps/plan-step/components/Calendar24Field.tsx`: Layer an accessible placeholder (`--:--`) when `time.value` is empty via an overlay span; preserve keyboard focus and hint text behavior.
- Styling stays within existing tailwind utility usage—no new design tokens needed.

## Data Flow & API Contracts

- Continue calling `fetchReservationSchedule(restaurantSlug, date)` via TanStack Query. Ensure the picker still requests new schedules on every date selection; no API signature changes.
- Form submission continues to call `useUpdateBooking` with `{ startIso, endIso }`. Clearing the picker sends an empty string to RHF; saves are blocked until a valid ISO is re-committed.
- Error handling remains mapped through existing `HttpError` codes.

## UI/UX States

- Loading: Date change triggers slot spinner (`Finding available times…`), time input disabled, placeholder visible, save button disabled.
- Empty/Unavailable: Closed/no-slot dates show inline alert copy inside the time slot region and the calendar hint; save button stays disabled.
- Error: Existing `loadError` path (API failure) continues to render destructive text; ensure clears do not suppress it.
- Success: When the user selects a valid slot, time grid highlights selection, end-time helper updates, and “Save changes” enables.

## Edge Cases

- Rapidly toggling between multiple dates should always leave the latest date in control; guard with refs to avoid stale auto-select.
- Bookings with missing slug/timezone already show destructive alert—ensure new logic respects `disabled` prop and skips placeholder overlay when input never renders.
- Time slots that disappear after selection (e.g., capacity lost) must still surface `UNAVAILABLE_SELECTION_COPY`; our reset logic should not mask that warning.

## Testing Strategy

- Unit: Extend `reserve/tests/unit/EditBookingDialog.test.tsx` to assert save-button disablement when the picker clears its value.
- Component: Add coverage in `reserve/tests/features/booking-state-machine/ScheduleAwareTimestampPicker.test.tsx` for (a) date change clears time + spinner text, (b) closed-date messaging in slot area.
- Integration (optional/manual): Use Chrome DevTools MCP to exercise the modal: change dates, pick closed day, re-open existing booking.
- Accessibility: Verify placeholder overlay has `aria-hidden` and does not interfere with focus/keyboard input.

## Rollout

- Feature flag: None (ship directly).
- Exposure: Full rollout once QA signs off; no partial gating required.
- Monitoring: Watch booking update error rates and customer support logs for regressions related to schedule selection.
