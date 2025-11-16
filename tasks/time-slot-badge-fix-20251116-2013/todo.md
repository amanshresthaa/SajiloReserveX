---
task: time-slot-badge-fix
timestamp_utc: 2025-11-16T20:13:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Review current group badge logic in `TimeSlotGrid`.

## Core

- [x] Compute group badges based on all entries in the group (e.g., `entries.every`).
- [x] Ensure badges only render when every slot in the group has the label; maintain accessibility and layout.

## UI/UX

- [x] Confirm headings and badge text remain unchanged; no regressions to hover/focus styles (code inspection).

## Tests

- [x] Manual reasoning/spot-check for mixed availability scenarios.

## Notes

- Assumptions: No need for new components; availability labels remain booleans.
- Deviations: Testing limited to code inspection/manual reasoning due to scope.

## Batched Questions

- None at this time.
