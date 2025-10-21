# Research: Ops Calendar Shadcn Integration

## Existing Patterns & Reuse

- `/reserve` flow uses `Calendar24Field` (`reserve/features/reservations/wizard/ui/steps/plan-step/components/Calendar24Field.tsx`) which wraps the shared Shadcn calendar from `components/ui/calendar.tsx`.
- Ops walk-in booking page already embeds `BookingFlowPage` from `/reserve`, so the Shadcn calendar is available in the ops bundle.
- Ops edit dialog (`components/dashboard/EditBookingDialog.tsx`) still relies on plain `<input type="datetime-local">` controls.
- `src/components/features/booking-state-machine/TimestampPicker.tsx` already wraps the Shadcn calendar + time input into a reusable picker that could serve ops edit forms.

## External Resources

- Shadcn calendar primitives live in `components/ui/calendar.tsx` (wrapping `react-day-picker` with the design system).

## Constraints & Risks

- Need to preserve validation logic (`localInputToIso`, `isoToLocalInput`) currently inside `EditBookingDialog`.
- Must keep keyboard accessibility and time selection requirements (start/end, duration validation) intact.
- Replace inputs without regressing ops features (e.g., editing bookings already in the past should respect past-time guards).

## Open Questions (and answers if resolved)

- Q: Which component implements the `/reserve` calendar?
  A: `Calendar24Field` (uses Shadcn calendar + time suggestions).
- Q: Are there reusable hooks/utilities for time picking that ops can leverage?
  A: `Calendar24Field` pairs date popover with time input/suggestions; we may need a variant supporting separate start/end selections.

## Recommended Direction (with rationale)

- Extract/repurpose the Shadcn-based date/time picker logic (`Calendar24Field` or a generalized wrapper) into a shared component that supports both start and end timestamps.
- Replace the datetime-local inputs inside `EditBookingDialog` (and any other ops-specific booking editors) with the shared picker to align UX with the `/reserve` customer flow while maintaining ops-specific validation, likely by integrating the existing `TimestampPicker`.
