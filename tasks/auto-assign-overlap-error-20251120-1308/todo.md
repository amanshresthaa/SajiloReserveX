---
task: auto-assign-overlap-error
timestamp_utc: 2025-11-20T13:08:00Z
owner: github:@amankumarshrestha
reviewers: [github:@amankumarshrestha]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm effective AGENTS.md policies (root only).
- [x] Identify relevant assignment/booking services and test fixtures.

## Core

- [ ] Reproduce inline auto-assign flow for the failing case.
- [ ] Trace hold creation vs confirmation inputs and overlap validation.
- [ ] Inspect `allocations` vs `booking_table_assignments` for the target restaurant/date to locate the conflicting row.
- [ ] Implement fix or config adjustment once root cause is confirmed.

## UI/UX

- [ ] Verify no regressions to booking submission feedback.

## Tests

- [ ] Add/adjust unit or integration coverage for allocation overlap edge case.

## Notes

- Assumptions: Issue stems from mismatch between hold window and confirmation overlap logic.
- Deviations: None yet.

## Batched Questions

- Do we have recent changes to allocation rounding or table capacity that could trigger false no-overlap errors?
