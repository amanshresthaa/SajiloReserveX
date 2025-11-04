# Implementation Checklist

## Setup

- [x] Add loop runner script
- [x] Add package script to run loop

## Core

- [x] Spawn ultra-fast assignment script per iteration
- [x] Query remote DB for unassigned after each iteration
- [x] Parse failure breakdown and report JSON
- [x] Adaptive feature flag tuning between runs
- [x] Stuck detection and guidance

## UI/UX

- [x] Console logs with iteration, assigned, remaining, top errors

## Tests

- [ ] Exercise against seeded remote DB (manual)

## Notes

- Assumptions:
  - "Unassigned" = pending bookings without any booking_table_assignments for the target date.
- Deviations:
  - Concurrency of the ultra-fast script is fixed; we tune algorithm via feature flags instead.

## Batched Questions (if any)

- Should the loop also consider confirmed-without-assignments? (currently no)
