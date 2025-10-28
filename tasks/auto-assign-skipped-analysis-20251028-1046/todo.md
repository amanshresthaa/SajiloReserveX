# Implementation Checklist

## Setup

- [ ] Gather skip telemetry from allocator v2 flows
- [x] Identify relevant planner/orchestrator modules

## Core

- [x] Categorize skip reasons (merge gaps, capacity, service windows)
- [ ] Trace sample bookings through planner to confirm logic

## UI/UX

- [ ] _Not applicable (analysis only)_

## Tests

- [ ] Review existing unit tests covering merge scenarios
- [ ] Identify missing coverage for service window skips

## Notes

- Assumptions:
  - Telemetry already captures `CandidateDiagnostics.skipped` for analysis; no new instrumentation required initially.
- Deviations:
  - Quantitative telemetry pull deferred pending access to observability backend.

## Batched Questions (if any)

- ...
