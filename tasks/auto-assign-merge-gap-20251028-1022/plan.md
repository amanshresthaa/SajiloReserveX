# Implementation Plan: Auto Assign Merge Gap

## Objective

We will ensure auto assignment handles bookings requiring merged tables instead of skipping them outright.

## Success Criteria

- [x] Identify why multi-table merge candidates are rejected during auto assignment.
- [x] Update selection/validation to allow valid merges (or provide deterministic fallback).
- [x] Extend tests to cover merged-table auto assignment success.

## Architecture & Components

- `server/capacity/tables.ts`:
  - Detect adjacency graph availability (via `loadAdjacency` edge count).
  - Pass a computed `requireAdjacency` flag to both planner and orchestrator calls.
  - Add combination fallback when single-table planning fails and combinations are disabled.
  - Improve skip reason messaging for merge-required scenarios.
- `server/capacity/tables.ts:loadAdjacency` – ensure bidirectional edges so planner adjacency checks remain symmetric.
- `tests/server/capacity/autoAssignTables.test.ts` – update expectations and add coverage for merge success once fallback logic is in place.

## Data Flow & API Contracts

Endpoint: POST /api/ops/dashboard/assign-tables
Request: { ... }
Response: { ... }
Errors: { code, message }

## UI/UX States

- Loading: unchanged.
- Error: API should now return 200 with `skipped` reason instead of blanket failure for merge-capable bookings.
- Success: payload should include assigned merges when planner fallback succeeds.

## Edge Cases

- Restaurants with partial adjacency data (some edges missing) should still enforce adjacency where available; fallback only when graph is empty.
- Total capacity genuinely insufficient should continue to yield skip with “capacity” reason.

## Testing Strategy

- Unit: extend `autoAssignTables.test.ts` to cover merge fallback + insufficient capacity skip.
- Integration: rely on existing manual selection / orchestrator tests; add targeted ones if gaps found.
- E2E: optional manual smoke to ensure Ops dashboard reflects new behaviour.
- Accessibility: N/A (backend change).

## Rollout

- Feature flag: none (uses existing allocator flags dynamically).
- Exposure: immediate once deployed.
- Monitoring: observe telemetry for “Combination planner disabled” skip reasons trending down; track merge assignment success rate.
