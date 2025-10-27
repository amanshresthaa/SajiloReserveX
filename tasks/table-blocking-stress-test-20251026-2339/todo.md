# Implementation Checklist

## Setup

- [x] Review existing allocator/table blocking tasks and prior work

## Core

- [x] Design stress test scenario covering bookings whose windows expire
- [x] Implement harness (script/test) to run multiple bookings and observe table states
- [x] Capture failure evidence and logs

## UI/UX

- [ ] Not applicable

## Tests

- [x] Document manual/automated test steps

## Notes

- Assumptions: Stress harness can run safely against Supabase because it wraps changes in a transaction and rolls back.
- Deviations:

## Batched Questions (if any)

- ...
