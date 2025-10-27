# Implementation Checklist

## Setup

- [x] Update env schema + feature flag plumbing (`FEATURE_COMBINATION_PLANNER`, `isCombinationPlannerEnabled`)
- [x] Thread new flag through selector/tables entry points (gating logic, config imports)
- [x] Define combination planner constants (per-slack cap, global candidate cap)

## Core Planner (Story A & G)

- [x] Extend `server/capacity/selector.ts` with combo enumeration + pruning helpers
- [x] Integrate adjacency checks (incremental + BFS) and metrics reuse
- [x] Track diagnostics counters (capacity, overage, adjacency, kmax, bucket caps)
- [x] Apply per-slack and global candidate caps
- [x] Ensure singles fast-path remains unchanged & covered by tests
- [x] Wire `kMax = min(config.maxTables, getAllocatorKMax())`

## Integration (Story A3, B, C, D, E, F, H)

- [x] Gate combination planner in `generateTablePlans`
- [x] Enforce `maxPartySize` filter in `filterAvailableTables`
- [x] Hydrate adjacency both directions in `loadAssignmentContext`
- [x] Fetch canonical booking (Story B1) and reuse window in auto-assign for idempotency, schedule updates, telemetry
- [x] Update quote flow to use canonical window + new diagnostics output
- [x] Implement hold conflict handling with alternates + telemetry event (`create_hold_conflict`)
- [x] Implement `isTableAvailableV2` (buffer aware) + mark legacy helper deprecated/delegating
- [x] Extend telemetry payloads (tableCount, adjacencyStatus, canonical window, holdId)

## Tests & Benchmarks (Story C2, F3, G2, I1-I6)

- [x] Update / add unit tests for selector combos, filtering, canonical window logic, availability V2
- [ ] Add integration tests for auto-assign idempotency & quote conflict handling
- [ ] Refresh performance tests with combos + caps (<50ms typical)
- [ ] Document E2E + QA expectations in verification plan (prepare for Week 2 MCP QA)

## Documentation & Runbook (Story H, J)

- [ ] Capture diagnostics fields + telemetry schema updates in docs or inline comments
- [ ] Update runbook / verification.md with rollout stages, alerts, rollback toggles
- [ ] Summarise risk mitigations & assumptions in task folder

## Notes

- Assumptions: Supabase RPC + tables up-to-date; telemetry consumers tolerate new fields.
- Deviations: Bucket caps hard-coded initially; revisit configurability post-launch if needed.

## Batched Questions

- None at this time.
