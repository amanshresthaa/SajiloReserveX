---
task: table-assignment-overhaul
timestamp_utc: 2025-11-13T08:49:12Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Scaffold new modules (state machine, lock manager, engine, coordinator, availability tracker, optimizer)
- [ ] Add feature flags + config wiring

## Core

- [ ] Booking state machine with history + events
- [ ] Distributed lock manager (Redis) + instrumentation
- [ ] Smart assignment engine (strategies, scoring, hold attempts)
- [ ] Assignment coordinator (lock, circuit breaker, rate limiter, retries)
- [ ] Background optimization service

## UI/UX

- [ ] Ensure API responses reflect new states without breaking existing UI consumers

## Tests

- [ ] Unit tests for key modules
- [ ] Integration tests for coordinator flow
- [ ] Load/soak harness updates (reuse ops auto-assign loop)

## Notes

- Assumptions: Legacy auto-assign kept in shadow mode during rollout.
- Deviations: None yet.

## Batched Questions

- [ ] Redis endpoint/credentials TBD
- [ ] Confirm manual review workflow owner
