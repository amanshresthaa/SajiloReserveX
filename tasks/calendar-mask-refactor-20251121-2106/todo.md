---
task: calendar-mask-refactor
timestamp_utc: 2025-11-21T21:06:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Review current availability hooks and calendar consumer usage.

## Core

- [x] Simplify prefetchVisibleMonth to calendar mask only.
- [x] Remove schedule-prefetch refs/abort controllers; reset only mask state on slug change.
- [x] Keep applyCalendarMask logic for closed vs other.
- [x] Ensure calendar UI uses closed/unknown only; remove no-slots decoration dependency.

## UI/UX

- [x] Verify open/closed disabling; no messaging tied to prefetch scrolling.

## Tests

- [x] Unit tests for applyCalendarMask and prefetchVisibleMonth.
- [x] Adjust/preserve other hook tests if broken.

## Notes

- Assumptions:
- Deviations: Added minimal `reserve/tests/setup-tests.ts` to satisfy Vitest config.

## Batched Questions

- ...
