# Implementation Checklist

## Setup

- [x] Confirm no other consumers rely on implicit time retention when switching dates.

## Core

- [x] Add `onDateChange` prop definition and invocation in `ScheduleAwareTimestampPicker`.
- [x] Wire `handleDateChange` inside `EditBookingDialog` to call `setValue('start', '', { shouldValidate: true, shouldDirty: true })`.
- [x] Ensure derived end display reacts to cleared state (watch for memoized fallbacks).

## UI/UX

- [ ] Manually verify date change clears time, placeholder renders, save disabled, and derived end message resets. _(Blocked: edit dialog behind auth in dev env.)_
- [ ] Validate unavailable date messaging and rapid date switching maintain correct state. _(Partial: plan-step flow exercised, but edit dialog unavailable.)_

## Tests

- [x] Run existing automated checks (e.g., TypeScript build/test command) if available.
- [ ] Chrome DevTools MCP manual QA per verification template. _(Attempted; edit dialog requires credentials.)_

## Notes

- Assumptions: Picker consumers can handle `onDateChange` being undefined; no API mutations expect persistent start values across date switches.
- Deviations: Full manual QA deferred pending access to authenticated edit dialog.

## Batched Questions (if any)

- None at this time.
