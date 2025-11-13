---
task: wizard-submit-timeout
timestamp_utc: 2025-11-12T23:35:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Create timeout recovery helper + lookup client modules.
- [ ] Update `useCreateReservation` idempotency handling.

## Core

- [ ] Wire timeout detection and recovery flow inside `useReservationWizard`.
- [ ] Emit analytics/emit events for recovered/unrecovered cases.

## UI/UX

- [ ] Show pending alert copy while recovery runs & provide fallback message if it fails.

## Tests

- [ ] Unit tests for recovery helper (matching & retries).
- [ ] Hook-level test covering TIMEOUT → recovery success.
- [ ] Hook-level test covering TIMEOUT → unrecovered error.

## Notes

- Assumptions: guest contact info is present (customer mode); lookup endpoint remains reachable.
- Deviations: n/a yet.

## Batched Questions

- None currently.
