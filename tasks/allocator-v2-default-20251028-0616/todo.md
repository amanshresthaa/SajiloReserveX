# Implementation Checklist

## Setup

- [x] Confirm allocator v2 flag definition and defaults
- [x] Update configuration/env wiring

## Core

- [x] Adjust server-side feature checks to default to v2
- [x] Ensure manual/auto flows respect default enablement

## UI/UX

- [ ] Verify responses surfaced to staff UI remain consistent

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:
  - Full `pnpm test` run failed due to pre-existing failures in availability/offline booking suites (unrelated to allocator flag change). Capacity server tests still expected to pass; manual spot-check pending.

## Batched Questions (if any)

- ...
