# Research: Edit Booking Calendar Gap

## Existing Patterns & Reuse

- `components/features/booking-state-machine/TimestampPicker.tsx` supplies the calendar/time picker for the edit dialog and other booking flows.
- `components/dashboard/EditBookingDialog.tsx` wires the picker for start/end timestamps without custom overrides; relies on `TimestampPicker`'s internal min/max handling.

## External Resources

- [`react-day-picker` docs](https://react-day-picker.js.org/api/daypicker) — confirms that the `disabled` callback receives calendar days normalized to midnight in the local timezone.

## Constraints & Risks

- Picker now parses full ISO timestamps (date + time + TZ). Comparing these midnight-normalized dates with time-aware `minDate`/`maxDate` risks excluding valid same-day selections.
- Edit dialog must allow choosing the same calendar day for the end time so long as the time is after the start.

## Open Questions (and answers if resolved)

- Q: Why is the calendar skipping an entire day for the end timestamp?
  A: The `TimestampPicker` compares each calendar day (midnight local) to `minDate`, which still has the start time attached. If the start time is later in the day, the midnight comparison marks that whole day as disabled.

## Recommended Direction (with rationale)

- Normalize `minDate`/`maxDate` (and the day under test) to start/end of day when deciding whether to disable the calendar date. This restores same-day availability while keeping cross-day guards intact.
