---
task: unassigned-table-booking
timestamp_utc: '$now'
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm relevant modules and data models for bookings and tables
- [x] Identify feature flags impacting table assignment

## Core

- [x] Reproduce booking without assigned table
- [x] Trace assignment logic and identify failure path
- [x] Implement fix (prune stale allocations during assignment sync)

## UI/UX

- [ ] N/A unless UI impacted

## Tests

- [ ] Add/adjust tests covering assignment path

## Notes

- Assumptions: auto-assign should succeed on creation when capacity is available.
- Deviations: automatic pipeline halted due to `allocations_no_overlap` triggered by stale allocations from booking `e554c13a-2898-4c03-83e5-dc5d0925e679` on table `36a18791-8339-42c5-a43f-996e2560b240`.

## Batched Questions

-
