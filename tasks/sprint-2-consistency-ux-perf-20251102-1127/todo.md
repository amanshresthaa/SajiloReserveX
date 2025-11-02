# Implementation Checklist

## Setup

- [ ] Confirm feature flag placeholder for context padding exists
- [ ] Create telemetry emitters for manual actions
- [ ] Update types where needed (policyVersion in validation)

## Core

- [ ] Persist adjacency/zone snapshot into hold metadata
- [ ] Verify snapshot on confirm and raise POLICY_CHANGED on drift
- [ ] Ensure confirm robustly releases holds (retry)
- [ ] Add hold sweeper job usage notes

## UI/UX

- [ ] Show STALE_CONTEXT banner with refresh
- [ ] Buttons disable during in-flight operations (existing)

## Perf

- [ ] Narrow context query to ±X minutes
- [ ] Add DB indexes for assignments/holds/allocations

## Tests

- [ ] Unit: adjacency snapshot hashing
- [ ] Unit: windowsOverlap DST/touching
- [ ] Integration: confirm mismatch → POLICY_CHANGED

## Notes

- Assumptions: Scheduler configured by DevOps; telemetry sink available.
- Deviations: E2E coverage reduced to unit/integration where DB not mocked.

## Batched Questions (if any)

- None
