---
task: plan-your-visit-perf
timestamp_utc: 2025-11-20T12:49:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm current prefetch behavior and code touchpoints.

## Core

- [x] Add cap to per-month schedule prefetch to reduce network burst.
- [x] Ensure calendar mask still applied for closed days.
- [ ] Keep min date normalization intact.

## UI/UX

- [ ] Validate calendar shows current date availability and closed days.
- [ ] Confirm unknown availability copy still behaves correctly.

## Tests

- [x] Run targeted tests/lint feasible in time box (e.g., lint or affected tests).
- [ ] Manual Plan step smoke check.

## Notes

- Assumptions: limiting prefetch volume is acceptable if closed-day accuracy retained.
- Deviations: None yet.

## Batched Questions

- Do we need a precise cap (e.g., 10 days) or dynamic based on viewport constraints?
