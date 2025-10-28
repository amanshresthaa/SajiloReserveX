# Implementation Checklist

## Setup

- [x] Gather logs/telemetry showing merged-table bookings skipped
- [x] Review selector/planner outputs for merge candidates

## Core

- [x] Adjust planner/selection/validation to accept merge plans when feasible
- [x] Ensure assignments create merge groups via orchestrator

## UI/UX

- [ ] Confirm ops dashboard messaging reflects merge success/failure

## Tests

- [x] Unit
- [x] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:
  - Relying on adjacency-edge detection to disable adjacency enforcement when graph is empty; UI validation pending.

## Batched Questions (if any)

- ...
