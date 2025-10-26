# Implementation Checklist

## Setup

- [ ] Align local branch + install deps if needed
- [ ] Capture baseline screenshots/console notes before changes (if feasible)

## Core

- [x] Update `ScheduleAwareTimestampPicker` to clear time + suppress auto-select on user date change, surface closed-date copy in slot region
- [x] Layer placeholder overlay + aria handling in `Calendar24Field` when time is unset
- [x] Require committed start value before enabling “Save changes” in `EditBookingDialog`

## UI/UX

- [ ] Verify loading/empty/error states visually in DevTools MCP across breakpoints
- [ ] Confirm placeholder copy + slot messaging meet accessibility expectations (focus order, aria-hidden overlay)

## Tests

- [x] Extend `ScheduleAwareTimestampPicker` component tests for date change + closed-day behavior
- [x] Extend `EditBookingDialog` unit tests for save-button disable when picker clears value
- [x] Run targeted Vitest suites + lint if required
- [ ] Plan/execute manual QA via Chrome DevTools MCP (date change, closed date, modal reopen)

## Notes

- Assumptions:
- Deviations:
  - Manual QA via Chrome DevTools MCP blocked by authentication wall. Need valid dashboard credentials/session to complete visual + accessibility checks for the modal.

## Batched Questions (if any)

-
