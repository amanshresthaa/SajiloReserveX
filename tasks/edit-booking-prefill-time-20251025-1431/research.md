# Research: Edit Booking Prefill Time

## Existing Patterns & Reuse

- `components/dashboard/EditBookingDialog.tsx` renders `ScheduleAwareTimestampPicker` via a RHF `Controller` and populates the field with `booking.startIso` (`EditBookingDialog.tsx:204-280`).
- `ScheduleAwareTimestampPicker` (`src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`) manages internal `activeDate`, `draftTime`, and `selectedTime` state, fetching availability with `fetchReservationSchedule` and surfacing slots through `Calendar24Field`.
- Prefetching and slot validation logic already mirrors the reservation plan step (`Calendar24Field` + `TimeSlotGrid`) to enforce operating hours and capacity.

## External Resources

- Internal components only; no third-party docs required.

## Constraints & Risks

- The picker currently seeds its `activeDate` from `fallbackMinDate` (today) before it can parse the provided ISO value, resulting in an initial schedule fetch for the wrong day and leaving the time input blank until the user re-selects a date.
- Time state (`draftTime`/`selectedTime`) also initializes to empty strings, so even after availability loads the visible field does not reflect the booking’s saved time until after additional state updates.
- Any changes must keep the picker backward compatible for other flows (new bookings, missing slugs) and avoid unsolicited `onChange` commits that could dirty the form immediately.

## Open Questions (and answers if resolved)

- Q: Does the picker already update once the `value` prop resolves to the ISO timestamp?
  A: Yes, `useEffect` reacts to `value` changes, but because state initially points at today with no selected time, the UI renders without the booking date/time and availability stays disabled until the user interacts again.

## Recommended Direction (with rationale)

- Seed `activeDate`, `draftTime`, and `selectedTime` directly from the incoming ISO value during initial render so the dialog immediately reflects the existing booking and fetches the correct schedule.
- Preserve the existing `useEffect` synchronization so future updates (e.g., switching to another booking) still rehydrate state, but avoid the initial “today” fetch/blank time experience that forces guests to reselect the date.
