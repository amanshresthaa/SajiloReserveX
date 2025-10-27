# Implementation Plan: Multi-Table Combination Planner Initiative

## Objective

Deliver a multi-table planning capability with safe rollout guards, telemetry parity, and supporting API ergonomics so large parties (> single table capacity) can be auto-assigned or quoted without regressions. Secondary goals: canonicalise booking windows for idempotency, fix table filtering edge cases, improve adjacency hydration, handle hold conflicts gracefully, and expose buffer-aware availability checks.

We will enable the selector + quote flows to issue multi-table combinations (respecting adjacency and capacity constraints) under a gated flag, while tightening telemetry, diagnostics, and rollout tooling for Week 1–2 stories A–J.

## Success Criteria

- [ ] Feature flag `isCombinationPlannerEnabled` controls multi-table enumeration; default off.
- [ ] `buildScoredTablePlans` enumerates combos up to min(config.maxTables, allocatorKMax), prunes aggressively, emits diagnostics for skips, and keeps singles fast-path performance.
- [ ] Auto-assign + quote flows use canonical booking windows for idempotency keys, telemetry, and schedule updates; telemetry windows match DB-derived block windows.
- [ ] `filterAvailableTables` excludes tables exceeding `maxPartySize`; unit coverage ensures singles and combos honour the constraint.
- [ ] `loadAssignmentContext` hydrates adjacency bidirectionally and emits undirected map consistent with ground truth.
- [ ] Quote flow returns friendly hold conflict responses (with alternates) and emits `emitRpcConflict`-style telemetry tagged `create_hold_conflict`.
- [ ] `isTableAvailableV2` detects buffer collisions; legacy helper remains for compatibility but delegates when possible.
- [ ] Diagnostics + telemetry include combo-specific metadata (skipped counts, tableCount, adjacency status, canonical windows, holdId).
- [ ] New unit/integration tests (Stories I1–I6) cover combinations, filtering, canonical windows, availability, idempotency, and conflict handling; e2e hooks ready for Week 2 validation.
- [ ] Runbook updates document rollout stages, alerts, and rollback toggles; ops signoff captured in task folder.

## Architecture & Components

- **Feature flag layer** (`server/feature-flags.ts`): add `isCombinationPlannerEnabled()` wired to env + runbook defaults; update config schema if necessary.
- **Selector module** (`server/capacity/selector.ts`): extend `buildScoredTablePlans` with
  - `enumerateCombos()` DFS enumerator (sorted capacities, incremental adjacency checks, BFS connectivity before scoring);
  - bucketed candidate store with per-slack/per-total limits;
  - diagnostics counters for skip reasons (`capacity`, `overage`, `adjacency`, `kmax`, plus `prune` vs `evaluated`).
- **Table orchestration** (`server/capacity/tables.ts`):
  - `generateTablePlans` decides between singles-only legacy, singles-only scoring, or combination path based on selector scoring flag & new flag.
  - Auto-assign pipeline (`assignTablesForBooking`) fetches canonical booking row (`fetchBookingForAtomic`) and builds canonical block window (`buildAssignmentWindowRange`). Use canonical start/end for idempotency key, schedule intervals, and telemetry.
  - Quote pipeline (`quoteTablesForBooking`) reuses canonical window, integrates hold conflict handling, includes holdId + canonical window in telemetry.
  - `filterAvailableTables`: enforce `maxPartySize` guard for both singles and combos.
  - `loadAssignmentContext`: fetch both `.in("table_a")` and `.in("table_b")`, normalise to undirected adjacency map, deduplicate entries.
  - `isTableAvailableV2`: compute block interval via `computeBookingWindow`/`computeBookingWindow`? Instead, use `computeBookingWindow` or `computeBookingWindow`? We'll leverage `computeBookingWindow` & `tableWindowIsFree` logic to avoid duplication. Provide fallback to legacy helper when insufficient data.
  - Diagnostics map: incorporate `diagnostics.skipped` tallies + candidate counters into quote/assign logging payloads.
- **Telemetry module** (`server/capacity/telemetry.ts`): extend event payloads for candidate adjacency status, canonical windows, holdId for quotes, and table count metrics. Ensure backwards compatibility with downstream consumers by maintaining existing fields.
- **Tests**: add/extend suites under `tests/server/capacity`:
  - `selector.scoring.test.ts`: multi-table enumeration, pruning >K, adjacency enforcement, maxOverage.
  - New tests for `filterAvailableTables`, `buildAssignmentWindowRange` canonical usage, `isTableAvailableV2`, `quoteTablesForBooking` conflict handling, integration to ensure idempotency stability (maybe in `autoAssignTables.test.ts`).
  - Micro-benchmark harness updates to assert <50ms w/ combos enabled (Story G2) possibly via `selector.performance.test.ts` using `vi.useFakeTimers` or measurement.

State: incremental adjacency info tracked via BFS depth map (Map<tableId, depth>) for metrics; adjacency status flagged as `connected` boolean for telemetry.

## Data Flow & API Contracts

- **Planner request pipeline**:
  1. `assignTablesForBooking` loads booking, canonical window, tables, schedule, adjacency.
  2. `filterAvailableTables` (with new maxPartySize guard) produces candidate tables.
  3. `generateTablePlans` conditionally uses combination planner, returning `TablePlan[]` with metrics + diagnostics.
  4. Telemetry + diagnostics propagate to `emitSelectorDecision` with canonical window and adjacency metadata.
  5. `invokeAssignTablesAtomic` invoked with canonical window + table IDs; schedule map updated using canonical block interval.
- **Quote flow** similar but ends with hold creation; conflict fallback returns friendly response with `reason`, optional `alternates`, `hold` undefined.
- **Availability API**: `isTableAvailableV2(tableId, startISO, partySize, policy?)` returns boolean after computing block interval (using `computeBookingWindow` / `buildAssignmentWindowRange` depending on inputs) and reusing `tableWindowIsFree` semantics. Legacy `isTableAvailable` delegates when start/end cover full block; otherwise warns & defers.

## UI/UX States

Backend-only changes, but API consumers experience distinct states:

- **Assignment success**: canonical window in telemetry, combos returned when flag enabled.
- **Assignment skipped**: `diagnostics.skipped` indicates reason counts; friendly error messages remain unchanged.
- **Quote success**: hold created, response contains hold metadata + alternates.
- **Quote conflict**: response returns `{ reason: "Tables are on hold", alternates, hold: undefined }` and logs conflict telemetry.
- **Availability check**: function returns `false` when buffers collide, ensuring scheduler parity.

## Edge Cases

- Tables lacking adjacency entries should not be combined with others (skip adjacency failure).
- Bookings without canonical timestamps: fall back to computed window but log warning; ensure idempotency key logic handles nulls gracefully (abort with friendly reason rather than crashing).
- Holds feature disabled: quote conflict handling should degrade gracefully (no conflict search or event emission).
- Config limits: if `kMax` = 1, combination planner should effectively operate as singles path without duplicate scoring.
- Performance: ensure enumerator respects `MAX_CANDIDATES` limit even under high adjacency density; track diagnostics when caps triggered.

## Testing Strategy

- **Unit**:
  - `buildScoredTablePlans` combos (2-table, 3-table) respecting `maxOverage`, `maxTables`, adjacency constraints, bucket caps, and diagnostics tallies.
  - `filterAvailableTables` rejects tables with `maxPartySize` < party size.
  - `buildAssignmentWindowRange` vs canonical usage in `assignTablesForBooking` (mock RPC) ensuring idempotency key stable across retries.
  - `isTableAvailableV2` buffer overlap detection / back-to-back bookings scenario.
- **Integration**:
  - Auto-assign flow (with combos enabled) producing 2-table plan for 2×4 tables (Story I5).
  - Quote flow conflict handling returning alternates + telemetry stub capture (Story I6).
- **Performance micro-benchmark**: extend `selector.performance.test.ts` to measure enumerator latency with 40 tables, combos up to K=3 (<50ms average, well below 100ms tail target).
- **E2E placeholder**: Document plan for Week 2 to toggle flags and run canary dataset verifying no regressions for small parties (Story I7). Actual UI QA deferred until implementation, but note requirement for Chrome DevTools MCP manual QA once UI surfaces change.
- **Telemetry verification**: Use spies/mocks to assert canonical window + adjacency metadata forwarded to `emitSelectorDecision` / `emitSelectorQuote` / `emitRpcConflict`.

## Rollout

- Feature flags staged per Story J1: enable `selectorScoring` + `combinationPlanner` in staging; prod shadow logging for 24h before canary, then full rollout.
- Monitoring: add dashboards/alerts for `assign_tables_atomic_v2` error rate, `skipped due to no plan`, planner p95 latency (<100ms). Document thresholds in runbook (Story J2).
- Rollback: toggle `combinationPlanner` off to revert to singles; fallback to legacy window derivation via BFF flag if telemetry mismatch arises. Capture rollback steps in `verification.md` + runbook (Story J3).

## Alternatives Considered

- **Combination enumeration outside selector**: considered building combos in `generateTablePlans` to avoid altering scoring module, but centralising in selector keeps scoring metrics consistent.
- **Using SQL for adjacency mirroring**: exploring view-based solution but in-memory mirroring avoids migration risk under tight timeline; revisit if Supabase row volume grows.
- **Extending `SelectorScoringConfig` for bucket caps**: deferring to internal constants for now, but will document extension path if configurability becomes urgent.

## Dependencies

- Accurate Supabase data for bookings, adjacency, holds; no pending migrations required.
- `env` schema update for new flag(s) + optional bucket config.
- Telemetry pipeline ready to accept new fields; coordinate with ops to ensure downstream parsing tolerant to extra keys.
