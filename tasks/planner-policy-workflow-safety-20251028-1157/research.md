# Research: Planner Policy & Workflow Safety

## Requirements

- Functional:
  - H1: Gate adjacency enforcement behind a configurable minimum party size while respecting the existing `allocator.requireAdjacency` switch. Manual validation should surface adjacency errors for large parties, but default planner behaviour must remain unchanged when the new flag is unset.
  - H2: Surface planner combination limits (max plans per slack bucket, max combination evaluations) via feature flags and thread them through all planner entry-points so telemetry can report the active caps.
  - I1: Prevent gaps when swapping holds by ensuring there is no interval without coverage; prefer a create-then-release strategy that avoids new DB RPCs unless absolutely necessary. Maintain conflict detection correctness.
  - J1: Bubble up `isTableAvailableV2` failures to calling layers so transient DB issues do not silently mark tables as available.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Preserve existing planner performance unless new flags are explicitly enabled; when enabled, ensure limits remain bounded to avoid perf regressions.
  - Maintain concurrency safety around hold creation to avoid race conditions and data integrity issues.
  - Keep telemetry payloads structured and backwards compatible.

## Existing Patterns & Reuse

- Feature flag accessors (`server/feature-flags.ts`) already expose allocator settings (`isAllocatorAdjacencyRequired`, `getAllocatorKMax`). The `env.featureFlags` tree (in `lib/env.ts`) is the single source of truth and clamps values (see `getAllocatorKMax` logic).
- `partiesRequireAdjacency` currently returns `false` and is only used by `filterAvailableTables` to seed adjacency maps. Other call sites default `requireAdjacency` to `isAllocatorAdjacencyRequired()` directly (e.g., `evaluateManualSelection`, `quoteTablesForBooking`, `confirmHoldAssignment`).
- Planner limits already exist as optional parameters on `buildScoredTablePlans` (`maxPlansPerSlack`, `maxCombinationEvaluations`) with sensible defaults (50 / 500). Tests under `tests/server/capacity/selector.*.test.ts` assert diagnostics structure.
- Hold workflow today releases `excludeHoldId` before calling `createTableHold` (see `createManualHold` at `server/capacity/tables.ts:1175`), introducing a gap window. `createTableHold` itself does not support atomic swaps, but there is no DB uniqueness preventing two holds temporarily overlapping.
- `isTableAvailableV2` now throws `AssignTablesRpcError` on Supabase failures (Sprint 2), yet upstream callers are sparse. API surfaces likely live in `server/capacity/service.ts` or consumers of `isTableAvailable` export.
- Tests: `tests/server/capacity/manualSelection.test.ts` exercises adjacency errors; `manualConfirm.test.ts` validates hold → booking linkage; `selector.performance.test.ts` depends on diagnostics shape; `isTableAvailableV2.test.ts` checks availability semantics without error propagation.

## External Resources

- None beyond in-repo modules; behaviour is governed by internal feature flag conventions described in `/AGENTS.md` and prior sprint task folders (`tasks/conflict-detection-performance-20251028-1138`).

## Constraints & Risks

- Changing the meaning of `requireAdjacency` risks breaking manual ops flows; we must treat the new min party size flag as an opt-in overlay and keep legacy behaviour when unset.
- Introducing new env vars requires updates to `config/env.schema.ts` plus runtime defaults; missing schema entries will break env validation.
- Telemetry payload schemas are effectively public for downstream analytics; adding fields should be additive and backward compatible.
- Hold swap adjustments must guarantee old holds are released even if new hold creation succeeds but cleanup fails; we should best-effort release with logging to avoid orphaned holds.
- `isTableAvailableV2` callers may be out-of-tree; we must provide a consistent wrapper or documented error type to avoid uncaught exceptions.

## Open Questions (owner, due)

- Q: What upper bound should we enforce for `allocator.adjacency.minPartySize` and planner limits? (Need product guidance; default to conservative clamps like ≤20 party size, ≤200 plans/slack, ≤5000 combinations.)
  A: Pending confirmation; assume conservative caps and document in plan.

## Recommended Direction (with rationale)

- Extend feature flags with `allocator.adjacency.minPartySize` plus `selector.maxPlansPerSlack` / `selector.maxCombinationEvaluations`, clamping to safe ranges. Expose helpers (`getAllocatorAdjacencyMinPartySize`, `getSelectorPlannerLimits`).
- Implement `partiesRequireAdjacency(partySize)` to respect the global adjacency flag and threshold; update manual validation, hold confirmation, quoting, auto-assign, and planner entry points to use the helper so behaviour toggles per party size.
- Allow telemetry diagnostics to include the active planner limits (augment `CandidateDiagnostics` and `emitSelectorDecision` payloads) without breaking existing consumers.
- For hold swaps, adopt the create-first strategy: attempt new hold creation while excluding the existing hold in validation, then best-effort release the old hold post-success. Add fail-safe logging if release fails, and unit tests simulating concurrent workers through mocked Supabase clients.
- Wrap `isTableAvailableV2` invocations with try/catch inside exported helpers (or service layer) to convert `AssignTablesRpcError` into deterministic API responses, ensuring availability checks never return `true` on DB failure. Update tests to assert propagated errors.
