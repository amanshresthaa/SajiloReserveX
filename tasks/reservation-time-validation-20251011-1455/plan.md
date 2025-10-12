# Implementation Plan: Reservation Time Validation

## Objective

Prevent guests from advancing the reservation wizard with closed or fully unavailable dates/times by hard-blocking those selections in the plan step UI.

## Success Criteria

- [ ] Days with no availability (e.g., Sundays/Mondays when the venue is closed) render as disabled in the calendar popover.
- [ ] Time inputs and slot grid prevent selection when the chosen date has zero enabled slots, and the form displays an inline alert instructing guests to pick another date.
- [ ] The wizard “Continue” action remains disabled until a valid date/time combination with availability is selected.
- [ ] Manual tests confirm the wizard cannot proceed on a closed day and recovers once an open day is chosen.
- [ ] Unit tests cover the new date/time disabling logic.

## Architecture

- **Availability Derivation**: Extend `useTimeSlots` consumers to compute `hasAvailableSlots = slots.some((slot) => !slot.disabled)` for the active date.
- **State Management**: Track unavailable dates in-memory within `usePlanStepForm` so the calendar’s `disabled` matcher can immediately block previously rejected days.
- **Form Feedback**: Use React Hook Form’s `setError` / `clearErrors` and value updates to clear the time field, disable submit actions, and surface inline messaging.
- **UI Components**: Update `Calendar24Field` to accept a calendar `disabledDates` matcher, support disabling the time input, and render contextual guidance when no times are available.

## Component Breakdown

- `reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`: derive availability state, manage disabled dates, clear/reset time selection, surface form errors, and expose props for the calendar/time UI.
- `reserve/features/reservations/wizard/ui/steps/plan-step/components/Calendar24Field.tsx`: accept new props (`disabledDays`, `isTimeDisabled`, `unavailableMessage`) to render a disabled calendar/time input and show guidance.
- `reserve/features/reservations/wizard/ui/steps/plan-step/PlanStepForm.tsx`: wire the new props, display an inline `Alert` when a date is unavailable, and ensure time grid buttons do not appear when blocked.
- `reserve/features/reservations/wizard/ui/steps/plan-step/components/__tests__/Calendar24Field.test.tsx` & new/updated hook tests: verify disabled-date logic and alert rendering.

## Data Flow

1. Guest selects a date.
2. `usePlanStepForm` updates state and `useTimeSlots` fetches the schedule for that date.
3. When the schedule resolves, compute `hasAvailableSlots`; if false, mark the date as unavailable, clear `time`, and set form errors.
4. Calendar receives updated `disabledDays` matcher (including the new date) so it becomes unselectable; the UI shows an alert prompting a new choice.
5. Selecting an open date clears errors, restores valid slots, and the wizard “Continue” button re-enables automatically.

## UI/UX Considerations

- Provide concise alert copy (“We’re closed on Sundays. Please choose another date.”) with polite tone and focus management when errors occur.
- Keep mobile usability high: disabled days should appear visually distinct with appropriate aria-disabled state, and the time input should be disabled to avoid confusion.
- Ensure the datalist suggestion copy remains consistent when no times exist (“No available times…”).

## Testing Strategy

- Extend unit tests to confirm `Calendar24Field` applies `disabledDays` and disables the time input when requested.
- Add hook-level tests (or component tests) for `usePlanStepForm` verifying that unavailable dates clear the time field, set errors, and disable actions.
- Manual QA via Chrome DevTools covering: selecting a closed day, observing disabled states, and verifying recovery when switching to an open day.

## Edge Cases

- Date overrides (e.g., temporary closures) should mark specific dates unavailable even if the weekday is normally open.
- If all slots are marked `disabled` (fully booked), treat the day as unavailable.
- Retain previously selected time when the guest returns to an available date unless it no longer exists; fall back to the next available slot.

## Rollout Plan

- No feature flag needed; changes ship with the next frontend release after verification.
