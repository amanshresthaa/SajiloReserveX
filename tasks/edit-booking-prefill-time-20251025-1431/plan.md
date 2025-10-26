# Implementation Plan: Edit Booking Prefill Time

## Objective

We will ensure the `/my-bookings` edit dialog preserves the guest's originally selected date/time and allows time-only adjustments without forcing a second date pick.

## Success Criteria

- [ ] Opening the edit dialog shows the stored booking date in the calendar header with matching availability loaded automatically.
- [ ] The time input/grid is prefilled with the booking’s original start time (when still available) without extra interaction.
- [ ] Changing the time alone keeps the same date unless the user explicitly chooses a different day.

## Architecture & Components

- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`
  - Derive initial `activeDate`, `draftTime`, and `selectedTime` from the supplied ISO value instead of `fallbackMinDate`/empty strings.
  - Reuse the existing synchronization effect so later prop updates still hydrate correctly.
  - Ensure the first availability fetch targets the prefilled date to avoid the "schedule not loaded" guardrail.
- `components/dashboard/EditBookingDialog.tsx`
  - No structural changes anticipated; verify it continues to pass ISO values and timezone metadata.

## Data Flow & API Contracts

- The picker continues to call `GET /api/restaurants/{slug}/schedule?date=YYYY-MM-DD` via `fetchReservationSchedule`. No contract changes; the improvement simply ensures the first call uses the booking’s date when available.

## UI/UX States

- Loading: brief spinner/message remains while the correct date’s schedule loads (now immediately for the booking date).
- Success: prefilled date/time visible; time grid enabled without forcing another date selection.
- Error: existing error banners remain if schedule fetch fails or the stored time is no longer available (handled by current validation logic).

## Edge Cases

- Bookings lacking `startIso` or slug still fall back to today + empty time (current behavior) because no ISO value is available to seed state.
- If the stored time is no longer offered, the picker should continue to fall back to the first available slot after load, as already implemented.

## Testing Strategy

- Unit: extend `reserve/tests/features/booking-state-machine/ScheduleAwareTimestampPicker.test.tsx` to assert that initial render hydrates date/time from the provided value without user input.
- Manual: Run `/my-bookings` in Chrome DevTools MCP, confirm prefilled date/time, then adjust time only and ensure availability updates correctly.

## Rollout

- No feature flags. Standard deploy once automated + manual checks pass.
