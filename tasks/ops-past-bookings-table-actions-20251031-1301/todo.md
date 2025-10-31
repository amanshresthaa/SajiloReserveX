# Implementation Checklist

## Setup

- [x] Identify date comparison approach respecting restaurant timezone
- [x] Determine components needing UI changes

## Core

- [x] Suppress auto-assign actions on past dates
- [x] Hide/adjust table assignment prompts on booking cards for past dates
- [x] Gate table assignment actions per booking when the service time has passed
- [x] Surface temporal state helpers (past/imminent) for visual cues
- [x] Add action-required indicator logic for check-in/check-out windows

## UI/UX

- [x] Ensure banner text reflects non-actionable status
- [x] Confirm no layout shifts when actions hidden
- [x] Apply greyed styling for elapsed bookings and warning styling for imminent bookings
- [x] Introduce accessible icon/badge styling for action-required state

## Tests

- [x] Add test coverage for past-date behaviour
- [x] Regression tests for current-date behaviour
- [x] Add assertions for action-required badges (check-in / check-out)

## Notes

- Assumptions:
  - Past service dates should be read-only for table assignments while still surfacing historical info.
- Deviations:
  - Manual Chrome DevTools verification pending (requires authenticated session).

## Batched Questions (if any)

-
