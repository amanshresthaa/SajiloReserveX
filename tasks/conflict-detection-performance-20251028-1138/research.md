# Research: Conflict Detection & Performance Improvements

## Requirements

- Functional:
  - E1: use availability bitset in `extractConflictsForTables` to short-circuit conflict scans, returning same conflict list while improving throughput.
  - E2: add regression tests verifying marked busy windows cause `isWindowFree` to report occupancy throughout the [start, end) interval.
  - F1: optimize `loadTablesByIds` to query only the requested tables via `.in('id', tableIds)` rather than loading the whole inventory.
  - F2: simplify `loadTableAssignmentsForTables` to use typed Supabase builders without dynamic fallbacks.
  - G1: enforce lint rule banning `Date.parse` across server code paths.
  - G2: document the canonical `windowsOverlap` helper and remove duplicate numeric variants in tests.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Performance: demonstrate >30% improvement in synthetic conflict detection throughput.
  - Maintainability: centralize overlap semantics; keep Supabase queries typed and minimal.
  - Reliability: ensure new lint rule does not affect client-side uses that still rely on `Date.parse`.

## Existing Patterns & Reuse

- `AvailabilityMap` entries already hold both `bitset` and `windows` arrays (`server/capacity/tables.ts:224-244`); currently `extractConflictsForTables` iterates `windows` blindly (`server/capacity/tables.ts:833-858`).
- Bitset utilities (`createAvailabilityBitset`, `markWindow`, `isWindowFree`) in `server/capacity/planner/bitset.ts` are used when building busy maps but never queried during conflict extraction.
- `loadTablesForRestaurant` fetches full inventory for a restaurant and is repeatedly reused; `loadTablesByIds` currently reuses this call, then filters (`server/capacity/tables.ts:624-641`).
- `loadTableAssignmentsForTables` wraps a Supabase query but contains dynamic builder hacks guarded by runtime checks to work around older client typing issues (`server/capacity/tables.ts:731-763`).
- Tests already cover `windowsOverlap` semantics via fast-check (`tests/server/capacity/windowsOverlap.property.test.ts`) and duplication exists in `tests/unit/table-window-overlap.test.ts` which re-implements overlap logic with millisecond intervals.

## External Resources

- `server/capacity/planner/bitset.ts` – authoritative implementation of slot-based availability.
- Supabase client typing patterns in other modules (e.g., `server/capacity/v2/supabase-repository.ts`) rely on `.in` directly without dynamic fallbacks.

## Constraints & Risks

- `isWindowFree` operates on five-minute slots; we must ensure DateTime/ISO inputs align with how `markWindow` is called to avoid off-by-one slot errors.
- Supabase `.in` queries fail on empty arrays; guard clauses must remain in place when refactoring `loadTablesByIds` and `loadTableAssignmentsForTables`.
- Lint rule should only target server code to avoid breaking legitimate client utilities (`src/...`) that still use `Date.parse`.
- Removing duplicate test helpers must preserve coverage for numeric interval scenarios; need to confirm tests can import the canonical helper without circular dependencies.

## Open Questions (owner, due)

- Q: Do we have existing benchmarks for conflict extraction to compare against?  
  A: None in repo; plan to create a synthetic measurement harness during verification.

## Recommended Direction (with rationale)

- Integrate a bitset pre-check inside `extractConflictsForTables` using `isWindowFree`; only fall back to `windowsOverlap` enumeration when bitset reports occupancy to achieve expected 30%+ speedup without behavioral changes.
- Add deterministic + property-based tests comparing bitset results to the legacy enumerator using harvested `AvailabilityMap` fixtures to prevent drift.
- Refactor `loadTablesByIds` and `loadTableAssignmentsForTables` to issue scoped Supabase queries (with `.in`) while preserving input order through map reconstruction; aligns with IO reduction goals.
- Introduce a server-only ESLint override forbidding `Date.parse` and update affected tests to import the canonical helper, documenting half-open semantics via JSDoc.
- Augment planner tests to assert `isWindowFree` rejects visits inside registered [start, end) ranges, ensuring parity between bitset and overlap logic.
