# Implementation Plan: Booking Edit Prefill

## Objective

We will ensure the My Bookings edit dialog immediately reflects the existing reservation date/time so guests (and ops staff) can save changes without reselecting slots that are already stored.

## Success Criteria

- [ ] Opening the edit dialog with an upcoming booking shows its saved date and time as active without further interaction.
- [ ] Flows that launch the picker without an initial value (new bookings, ops tools) still start on today with empty time and function as before.

## Architecture & Components

- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`: derive initial calendar/time state from the provided ISO timestamp and avoid the extra fetch for `today` when a value exists. Keep `commitChange` behaviour stable.
- `components/dashboard/EditBookingDialog.tsx`: no structural changes expected; verify props still align.
- Tests in `reserve/tests/features/booking-state-machine/ScheduleAwareTimestampPicker.test.tsx` to prove the initial render hydrates the stored time and queries availability for the correct date.

## Data Flow & API Contracts

Endpoint: n/a (unchanged). The picker still calls `fetchReservationSchedule` with the restaurant slug + date key.
Request/Response: existing schedule service contracts remain untouched.
Errors: continue to surface via existing error states (load failure, unavailable time).

## UI/UX States

- Loading: availability fetch indicator still appears when switching dates.
- Empty: unavailable dates continue to show the existing warning copy.
- Error: existing destructive alert in the dialog handles API failures.
- Success: saved start time remains selected and editable immediately after opening the dialog.

## Edge Cases

- Bookings missing `restaurantSlug`/timezone continue to show the existing guard and disabled picker.
- Bookings whose saved time no longer has capacity should still surface the validation warning without clearing the time until the user picks a new slot.
- Timezones without offsets (UTC) must still round-trip correctly.

## Testing Strategy

- Unit: extend the picker test suite to assert that initial render adopts the provided ISO value (date + time) and that the first schedule fetch targets that date.
- Integration: rely on existing EditBookingDialog coverage; no new integration tests planned.
- E2E: optional follow-up; not required for this fix.
- Accessibility: smoke check keyboard/time input behaviour manually during verification.

## Rollout

- Feature flag: none.
- Exposure: immediate — local change.
- Monitoring: rely on existing error logging; verify manually via Chrome DevTools MCP per verification phase.
