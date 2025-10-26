# Implementation Checklist

## Setup

- [x] Capture expected behaviour and constraints for the picker rebuild.

## Core

- [x] Swap ref-based schedule cache for stateful management with immediate unavailability updates.
- [x] Preserve stored date/time on open and surface warning when slot is unavailable instead of forcing reselection.
- [x] Ensure availability loads automatically on dialog open without requiring manual calendar scroll.
- [x] Auto-scroll or focus the selected time slot so it is visible on open.
- [x] Harmonize loading/instruction messaging to avoid the "scroll to load" copy during edits.
- [x] Add duration copy near the derived end time to clarify why it is locked.

## UI/UX

- [ ] Manual My Bookings QA in Chrome DevTools MCP (blocked pending auth credentials).

## Tests

- [x] Unit
- [ ] Integration
- [ ] E2E
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: Ops/guest flows continue to provide restaurant slug/timezone; closed-day schedules return `isClosed` from API.
- Deviations: QA pending due to sign-in (magic link) requirement; will verify once creds are available.

## Batched Questions (if any)

- 
