# Research: Booking Edit Modal Refactor

## Existing Patterns & Reuse

- `components/dashboard/EditBookingDialog.tsx`: React Hook Form dialog that already pipes the booking’s stored ISO timestamp into `ScheduleAwareTimestampPicker`, derives the end time label, and disables “Save changes” when the form is pristine or schedule metadata is missing. (Verified via direct source read + unit test double in `reserve/tests/unit/EditBookingDialog.test.tsx`.)
- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`: Manages `activeDate`, `draftTime`, and `selectedTime`, prefetches availability with `fetchReservationSchedule`, and shows a spinner via `renderTimeContent` whenever a date is loading. (Inspected code + cross-checked with `reserve/tests/features/booking-state-machine/ScheduleAwareTimestampPicker.test.tsx` to confirm initial-value hydration and scroll behavior.)
- `reserve/features/reservations/wizard/ui/steps/plan-step/components/Calendar24Field.tsx`: Shared date/time input that already accepts `unavailableMessage` copy, disables the time input while loading, and can surface hint text when no suggestions are available. (Confirmed by reading component and contrasting with its usage in the picker.)
- `reserve/features/reservations/wizard/ui/steps/plan-step/components/TimeSlotGrid.tsx`: Supports `scrollToValue`, highlighting, and grouping—so Story 3’s auto-focus/highlight requirements are largely satisfied out of the box; tests assert `scrollIntoView` is invoked.

## External Resources

- `@reserve/features/reservations/wizard/services/schedule`: Provides `fetchReservationSchedule` + `scheduleQueryKey`; confirms we can rely on TanStack Query caching when forcing reloads after a date change.
- `@reserve/shared/schedule/availability`: Supplies `isDateUnavailable`, `hasCapacity`, and copy reasons for closed/no-slot states—baseline for surfacing the “We’re closed” message.
- Vitest suites (`reserve/tests/features/...` and `reserve/tests/unit/EditBookingDialog.test.tsx`): Baseline expectations around prefill, error handling, and scroll behavior we must keep green while extending coverage to new states.

## Constraints & Risks

- Clearing the time on date change must not break other flows that rely on auto-selecting the first available slot. Current search shows only the edit dialog consumes this picker, but we should keep behavior opt-in (e.g., only suppress auto-select when the user explicitly changes the date) to guard against future reuse.
- `Calendar24Field` uses `<input type="time">`; native placeholders are unreliable. We may need a synthetic placeholder or overlay to meet the “--:--” requirement without regressing accessibility (keyboard/focus order, screen-reader cues).
- Save-button disable logic currently hinges on `isDirty`; altering to also require a committed `start` value must still allow editing other fields (party size, notes) without unintentionally blocking legitimate saves.
- Availability fetches are async; concurrent date toggles could leave stale loading states if we do not track the “latest requested date” before resetting times.

## Open Questions (and answers if resolved)

- Q: Can we rely on `ScheduleAwareTimestampPicker`’s existing spinner to satisfy AC #1, or do we need additional UI changes?
  A: Spinner already appears via `renderTimeContent` while `activeRecordStatus === 'loading'`, but the time input still shows the previous value—so we must explicitly clear `draftTime/selectedTime` and the form value to match the placeholder requirement.
- Q: Does any other module depend on auto-selecting the first available slot when availability loads?
  A: Repository-wide `rg` indicates the picker is only rendered inside the edit dialog today. We can gate the “suppress auto-select” logic behind a flag tied to user-driven date changes to remain future-proof.
- Q: How do we surface the “closed” copy inside the time-slot grid area when no buttons render?
  A: `Calendar24Field` conveys the message near the input, but `renderTimeContent` currently returns `null`. We should render a dedicated message block when `resolvedUnavailableMessage` exists so the main slot region also communicates state.

## Recommended Direction (with rationale)

- Extend `ScheduleAwareTimestampPicker` to track user-driven date changes (e.g., `pendingSelectionResetRef`) so we can clear `draftTime`, `selectedTime`, and commit a `null` value immediately—showing the spinner + placeholder while enforcing a fresh selection once slots arrive.
- When availability resolves with zero slots or a closed flag, render the existing copy in the slot container itself (guarded by `resolvedUnavailableMessage`) to satisfy Story 2 without duplicating strings.
- Update `Calendar24Field` to display a deterministic placeholder (`--:--`) when `time.value` is falsy, possibly via `placeholder` + visually-hidden fallback text, while ensuring it remains keyboard-accessible.
- Adjust `EditBookingDialog`’s save button to require a committed `start` value (and optionally the picker’s loading flag) in addition to `isDirty`, keeping notes/party edits working but preventing saves when the time is unset.
- Expand unit + component tests to cover: (1) time clearing + save disabled on date change, (2) closed-date messaging and field resets, (3) auto-scroll/highlight still functioning when reopening the dialog (regression guard).
