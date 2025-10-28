# Implementation Checklist

## Setup

- [x] Confirm telemetry helper usage across planner entry points
- [x] Identify locations for docstrings and ADR placement

## Core

- [x] Instrument auto-assign loops with duration metrics
- [x] Thread planner configuration parameters into telemetry context
- [x] Normalize diagnostics skip keys and counts
- [x] Ensure telemetry payload builder strips PII

## Documentation & Guardrails

- [x] Add JSDoc/comments for planner time/adjacency rules
- [x] Draft ADR summarizing telemetry/time updates
- [x] Update CI lint rules

## Tests

- [ ] Unit tests for telemetry durations & parameters
- [ ] Unit tests for diagnostics normalization
- [x] Unit test ensuring PII scrub
- [ ] Integration test for planner telemetry emission

## Verification

- [ ] Manual telemetry payload inspection (dev/staging)
- [ ] Dashboard check for latency distribution

## Notes

- Assumptions:
  - Existing telemetry emitter can be extended without consumer schema migration blockers.
- Deviations:
  - None yet.

## Batched Questions

- [ ] Confirm acceptable telemetry volume increase with observability owners
