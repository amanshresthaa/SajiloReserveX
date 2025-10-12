# Implementation Checklist

## State & Logic

- [x] Extend `usePlanStepForm` to derive `hasAvailableSlots`, manage disabled date cache, and clear/reset time/errors when a date has no availability.
- [x] Ensure the wizard action configuration reflects the disabled state when the form is invalid.

## UI Updates

- [x] Update `Calendar24Field` to accept `disabledDays`, `isTimeDisabled`, and `unavailableMessage` props, disabling date/time selection appropriately.
- [x] Render an inline alert in `PlanStepForm` when the current date is unavailable and hide/disable time pickers accordingly.
- [x] Prevent manual time entry when no slots exist and ensure the datalist messaging remains accurate.

## Testing

- [x] Add/adjust unit tests for `Calendar24Field` to cover the new disabled/time-disabled behavior.
- [x] Add hook/component tests for `usePlanStepForm` (or `PlanStepForm`) asserting that unavailable dates clear selections and surface errors.

## Verification

- [x] Run relevant test suites (`pnpm test --filter reservations` or targeted vitest command).
- [ ] Perform manual QA of the reservation wizard via Chrome DevTools (calendar, time input, continue CTA).
- [ ] Update `verification.md` with outcomes and notes.
