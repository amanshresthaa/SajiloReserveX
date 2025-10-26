# Research: Booking Edit Prefill

## Existing Patterns & Reuse

- `components/dashboard/EditBookingDialog.tsx` renders the edit dialog and wires React Hook Form to `ScheduleAwareTimestampPicker`, passing `booking.startIso` as the controlled value (`components/dashboard/EditBookingDialog.tsx:204`).
- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx` drives both the calendar and time slot grid, deriving availability via `fetchReservationSchedule` and surfacing it through `Calendar24Field`/`TimeSlotGrid`.
- The picker already handles validation (`hasCapacity`, `isPastOrClosing`) and change commits, so we can reuse existing pathways instead of introducing a new control.

## External Resources

- Internal scheduling utilities only; no external documentation required beyond the current codebase.

## Constraints & Risks

- The picker seeds `activeDate`, `draftTime`, and `selectedTime` with defensive defaults (`today`, empty strings) before it can parse the provided ISO timestamp. The first render therefore fetches availability for the wrong day and keeps the UI disabled until another render.
- That initial, incorrect fetch may also trigger `commitChange`, which overwrites the form value with either `null` or a fallback slot once the “today” schedule resolves, forcing users to reselect their intended time.
- Other surfaces (ops dashboard, reservation wizard) import the same picker, so any adjustment must remain backward compatible when no initial value exists and must preserve accessibility affordances.

## Open Questions (and answers if resolved)

- Q: Does the picker eventually sync to the supplied `value` when RHF populates it?
  A: Yes, `useEffect([scheduleTimezone, value])` hydrates state later, but the user still experiences disabled controls in the interim, and the incorrect first fetch can clobber the saved selection.

## Recommended Direction (with rationale)

- Derive the initial `activeDate`/`draftTime`/`selectedTime` directly from the incoming ISO timestamp (using the booking’s timezone when known) so the first render already reflects the saved booking.
- Avoid fetching availability for `today` when an initial value exists—seed `activeDate` with the extracted booking date and fall back to `today` only when the field is empty.
- Retain the existing synchronization effect for subsequent updates to keep the component stable across other consumers.
