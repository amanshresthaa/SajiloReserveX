# Implementation Plan: Conflict Detection & Performance Improvements

## Objective

We will tighten capacity conflict detection and data fetching so that allocator and manual selection flows run faster with identical outcomes.

## Success Criteria

- [ ] `extractConflictsForTables` uses bitset short-circuiting and still returns the exact conflict set as the legacy enumerator.
- [ ] Synthetic benchmark shows ≥30% reduction in conflict extraction time on busy-day data.
- [ ] `loadTablesByIds` and `loadTableAssignmentsForTables` issue scoped `.in` queries without dynamic fallbacks.
- [ ] `windowsOverlap` is the single documented overlap helper and all server lint checks fail on new `Date.parse` usage.
- [ ] New unit/property tests cover bitset parity, `isWindowFree` semantics, and Supabase query error handling.
- [ ] Targeted Vitest suites pass locally.

## Architecture & Components

- `server/capacity/tables.ts`
  - Update `extractConflictsForTables` to call `isWindowFree` before iterating `entry.windows`.
  - Keep ISO normalization for telemetry but pass the same ISO strings into `isWindowFree` to align with `markWindow` usage.
  - Refine `loadTablesByIds` to issue `table_inventory` query with `.eq('restaurant_id', ...)` and `.in('id', tableIds)`; rebuild results map to preserve input order.
  - Simplify `loadTableAssignmentsForTables` to early-return on empty arrays and use typed `.in` queries.
  - Add JSDoc to `windowsOverlap`, ensure exported `__internal` exposes `extractConflictsForTables` for testing.
- `server/capacity/planner/bitset.ts`
  - No logic changes; leverage existing APIs in tests.
- ESLint flat config: add server-only `no-restricted-properties` rule blocking `Date.parse`.
- Tests:
  - Create parity tests comparing the bitset-enabled conflicts extractor with the legacy enumerator under dense schedules.
  - Add planner test verifying `isWindowFree` reports occupancy anywhere inside registered windows (including boundaries).
  - Update numeric overlap unit tests to import the canonical helper instead of duplicating logic.

## Data Flow & API Contracts

No external API surface changes. Supabase queries become more selective but maintain identical shapes and filtering.

## UI/UX States

No UI impact.

## Edge Cases

- Empty `tableIds` arrays should continue to short-circuit queries.
- Ensure bitset/overlap parity for boundary cases (adjacent intervals, identical intervals, nested windows).
- Confirm `.in` queries handle duplicate IDs without duplication in results.
- Keep conflict enumeration stable when multiple overlapping windows exist (booking vs hold).

## Testing Strategy

- Unit: new bitset parity test, `isWindowFree` coverage, overlap helper regression, server loaders.
- Property: leverage existing fast-check property to double-check half-open semantics after doc updates.
- Integration: reuse existing manual selection / conflict tests via targeted Vitest files (`tests/server/capacity/*.test.ts`).
- Accessibility: not applicable.

## Rollout

- Feature flag: none.
- Exposure: immediate once merged.
- Monitoring: rely on existing telemetry around conflict evaluation timing; record benchmark data in `verification.md`.
- Kill-switch: revert commit if regressions observed.
