# Research: Manual Assignment Backend APIs

## Existing Patterns & Reuse

- **API scaffolding**: `src/app/api/staff/auto/quote/route.ts` and `src/app/api/staff/auto/confirm/route.ts` show the established pattern—authenticate with `getRouteHandlerSupabaseClient()`, verify restaurant membership, parse payloads with zod, and switch to `getServiceSupabaseClient()` for side-effectful work. Manual endpoints should mirror this to stay consistent.
- **Hold + confirm primitives**: `server/capacity/holds.ts` already exports `createTableHold`, `confirmTableHold`, `releaseTableHold`, and sweeper utilities. These encapsulate Supabase writes (including mirrored allocations) and emit structured telemetry, so manual flows can compose them instead of reimplementing hold lifecycle logic.
- **Assignment context + schedule**: `server/capacity/tables.ts` provides `loadAssignmentContext`, `tableWindowIsFree`, `mapPlanToCandidateSummary`, and `confirmHoldAssignment`. Together they expose booking windows, existing assignments, adjacency maps, and RPC v2 confirmation hooks we can reuse for validation + response shaping.
- **Telemetry**: `server/capacity/telemetry.ts` includes `summarizeCandidate`, `emitHoldCreated`, and `emitHoldConfirmed`. Reuse keeps observability parity between auto and manual flows.
- **Test scaffolding**: `tests/server/capacity/assignTablesAtomic.test.ts` and `tests/server/capacity/autoAssignTables.test.ts` illustrate how allocator functions are mocked and asserted today; we can extend these fixtures to cover manual validation + confirm scenarios.

## External Resources

- `appendix.md` documents the target behaviour for manual hold/validate/confirm (same-zone, movable merges, adjacency warnings, conflict detection, RPC v2 confirmation) and acts as the product spec.
- `supabase/migrations/20251026_005_assign_tables_atomic_v2.sql` defines the authoritative RPC logic—per-zone locks, mobility/adjacency guards, conflict handling, and idempotency ledger—which we should echo in pre-flight validation to avoid vague SQLSTATE errors.

## Constraints & Risks

- **Legacy RPC removal**: `server/capacity/tables.ts` still calls `supabase.rpc("assign_table_to_booking")` when feature flags disable atomic mode, and `server/feature-flags.ts` exposes `isRpcAssignAtomicEnabled` / `isAssignAtomicEnabled`. Sprint scope (E3-2) requires eliminating this path so all confirmations route through `assign_tables_atomic_v2` without relying on runtime flags.
- **Manual validation coverage**: Manual flows must proactively enforce `sameZone`, `movableForMerge`, adjacency (when required), allocation conflicts, and capacity sums before persisting holds or invoking RPC v2. Missing checks pushes failures into database constraints, yielding poor UX.
- **Hold lifecycle**: `createTableHold` rejects overlapping holds—including for the same booking—and no “update” helper exists yet. Manual hold endpoint needs a deterministic strategy (reuse, replace, or release+recreate) to avoid repeated conflicts and leaked allocations.
- **Conflict detection fidelity**: `loadAssignmentContext` surfaces existing `booking_table_assignments`, but active `table_holds` aren’t included. We must incorporate non-expired holds into conflict checks so manual previews respect other users’ holds.
- **Concurrency**: Requirements call for concurrency tests across manual and auto flows. Shared primitives have to remain race-safe (e.g., double confirm, hold vs confirm) and emit predictable structured errors.
- **Feature-flag cleanup ripple**: Removing `FEATURE_RPC_ASSIGN_ATOMIC` / `FEATURE_ASSIGN_ATOMIC` touches env schema, feature flag helpers, and Vitest mocks. We must update each site to prevent boot-time failures.

## Open Questions (and answers if resolved)

- Q: How should we treat an existing hold for the same booking when staff re-select tables?
  A: Not resolved yet—current helper raises a conflict. Options include releasing the old hold before creating a new one, reusing the existing hold if the table set matches, or returning the prior hold id. Decide during planning.
- Q: Do manual validations need to emit warnings (rather than hard failures) when adjacency enforcement is disabled via flag?
  A: Appendix hints that adjacency should still surface informational feedback even when not enforced, so response schema needs `status: "warn"` vs `status: "error"` semantics.
- Q: Should conflict checks consider active holds in addition to persisted assignments?
  A: Likely yes because holds mirror into allocations specifically to guard against overlaps. Need to confirm whether to query `table_holds` directly or rely on mirrored allocations.
- Q: What exact response schema (e.g., `checks[]`, capacity summary) should validate/hold endpoints return?
  A: Spec gives directional hints, but final shape is undefined; plan will proposal concrete JSON contract aligned with the forthcoming UI.

## Recommended Direction (with rationale)

- Create a manual assignment helper inside `server/capacity/tables.ts` (or a dedicated module) that loads tables + schedule via `loadAssignmentContext`, aggregates active holds, runs rule checks, and emits structured results (`checks`, `warnings`, `capacitySummary`, `suggestedSlack`). Centralizing rules keeps API handlers thin and testable.
- Extend hold lifecycle to support “replace existing hold” semantics for the same booking (e.g., release+recreate atomically) before calling `createTableHold`, and return hold metadata plus validation outcome so UI can update immediately.
- Implement `src/app/api/staff/manual/{hold,validate,confirm}/route.ts` using the established staff/auto patterns (session guard, membership validation, zod payload schemas, consistent error envelopes). `confirm` should call `confirmHoldAssignment` to hit RPC v2 and return assignment summaries.
- Remove legacy RPC fallbacks and unused flags: drop `isRpcAssignAtomicEnabled` / `isAssignAtomicEnabled`, update env schema + feature flag exports, and adjust allocator tests to assume `assign_tables_atomic_v2` everywhere.
- Add Vitest coverage for manual validation logic (including race cases) plus integration-style tests for manual hold/confirm flows to guarantee structured errors for invalid merges, overlaps, and capacity shortfalls.
