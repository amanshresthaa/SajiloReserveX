# Implementation Checklist

## Setup

- [ ] Add env-driven debug flags to disable time pruning and lookahead
- [ ] Instrument `filterAvailableTables` and time pruning path (guarded by env)
- [ ] Instrument `buildScoredTablePlans` (counts, reasons)
- [ ] Create `scripts/test-single-assignment.ts`

## Core

- [ ] Verify data preconditions (tables, holds, assignments, service periods)
- [ ] Run single-booking test (party=2 @ 12:00) and capture diagnostics
- [ ] Run batch script and compare success/latency with/without pruning
- [ ] Identify root cause and implement fix

## UI/UX

- [ ] N/A (no UI)

## Tests

- [ ] Add regression test(s) for simple assignment success
- [ ] Add a guard test for service overrun rejection

## Notes

- Assumptions: remote Supabase configured; env overrides available
- Deviations: debug logs guarded by env to avoid noisy production logs

## Batched Questions (if any)

- Do we want permanent telemetry on plan generation? (default: minimal)
