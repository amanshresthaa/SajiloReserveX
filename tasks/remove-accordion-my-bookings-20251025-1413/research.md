# Research: Remove Accordion in My Bookings Edit

## Existing Patterns & Reuse

- `components/dashboard/EditBookingDialog.tsx` renders the edit form inside a dialog and passes `timeAccordion` to `ScheduleAwareTimestampPicker`, which wraps the available time grid in a Shadcn accordion.
- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx` already supports a non-accordion layout (simply omitting the `timeAccordion` prop) that renders the `TimeSlotGrid` inline.
- Other dialogs (e.g., `components/features/dashboard/BookingDetailsDialog.tsx`) apply `max-h` plus `overflow-y-auto` on `DialogContent` to keep forms scrollable without accordions.

## External Resources

- None yet.

## Constraints & Risks

- Removing the accordion must not regress keyboard navigation or screen-reader cues; scrollable containers need proper focus management and visible focus.
- `ScheduleAwareTimestampPicker` is reused elsewhere, so any changes to its layout props must remain backward compatible.
- Dialog height needs to stay within the viewport to avoid content being clipped when we show all time options without collapse.

## Open Questions (and answers if resolved)

- Q: Which component currently renders the accordion structure?
  A: `ScheduleAwareTimestampPicker` renders a Shadcn `Accordion` when the `timeAccordion` prop is true (currently only set by `EditBookingDialog`).

## Recommended Direction (with rationale)

- Stop passing `timeAccordion` from `EditBookingDialog` so the picker renders its inline layout, and add a scrollable wrapper (e.g., `max-h` + `overflow-y-auto`) around the time grid when in dialog context to keep the UI compact. Reuse existing dialog scroll patterns to minimize bespoke styling and keep the picker API stable.
