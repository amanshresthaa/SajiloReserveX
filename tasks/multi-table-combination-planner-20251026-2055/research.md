# Research: Multi-Table Combination Planner Initiative

## Existing Patterns & Reuse

- `server/capacity/selector.ts` currently emits only single-table plans via `buildScoredTablePlans`; singles respect `maxPartySize`, `maxOverage`, and reuse `computeMetrics` / `comparePlans`. The rest of the selector stack (`generateScoringTablePlans`, `generateTablePlans`) already converts `RankedTablePlan` outputs to downstream-friendly structures.
- `server/capacity/tables.ts` houses adjacent helpers used by both auto-assign and quotes:
  - `generateTablePlans` dispatches to scoring vs legacy pipelines depending on `isSelectorScoringEnabled()`.
  - `assignTablesForBooking` and `quoteTablesForBooking` serialize booking windows with `serializeBookingBlockWindow(window)` prior to RPC calls / telemetry.
  - `loadAssignmentContext` currently fetches adjacency rows with `.in("table_a", ids)` and never mirrors `table_b → table_a`, so graph connectivity is direction-sensitive.
  - `filterAvailableTables` enforces `minPartySize` but ignores `maxPartySize`; downstream tasks rely on it for both singles and eventual combos.
  - `isTableAvailable` only checks dining windows, while `tableWindowIsFree` (scheduler) already respects block buffers.
- Hold orchestration lives in `server/capacity/holds.ts` (`createTableHold`, `findHoldConflicts`, `HoldConflictError`). Existing telemetry backpressure plumbing uses `emitRpcConflict` for RPC failures in `confirmHoldAssignment`.
- Canonical booking window builders:
  - `fetchBookingForAtomic` and `buildAssignmentWindowRange` already derive canonical `{range,start,end}` using DB-backed timestamps + venue timezone fallback.
  - Auto-assign currently builds idempotency keys from computed block windows rather than the canonical atomic window, leading to Story B mismatch.
- Diagnostics + limits:
  - Selector scoring config (`server/capacity/policy.ts`) exposes `maxTables`, `maxOverage`, and weights.
  - Feature flags resolved via `server/feature-flags.ts` (e.g., `getAllocatorKMax`, `isSelectorScoringEnabled`). New gate should follow same pattern.
- Test fixtures (`tests/fixtures/layout.ts`) provide small adjacency graphs and table definitions; existing unit suites (`tests/server/capacity/selector.*`) assert determinism and singles preference.

## External Resources

- `docs/open-tabs-consolidated.md` mirrors the current server implementations; cross-checked to ensure no hidden divergences.
- `docs/runbooks/allocator.md` highlights telemetry expectations (e.g., `emitRpcConflict`) useful for Story E observability requirements.

## Constraints & Risks

- **Combinatorial explosion**: Enumerating K-combinations risks >O(n^k) growth. Must cap by feature flag, config.kMax, allocator kMax, and candidate quotas (Story A4 & G1).
- **Adjacency correctness**: One-sided hydration yields false disconnects. Mirroring edges without duplication is vital before enforcing connectivity gates; also need BFS validation prior to emitting combos.
- **Window consistency**: Switching to canonical block windows must not regress legacy flows. Need to guard for bookings lacking `start_at`/`end_at` and ensure fallback path still serializes correctly.
- **Hold conflict ergonomics**: Quote flow must avoid 500s while keeping concurrency-safe behaviour. Alternate plan search must avoid reusing conflicted tables and avoid infinite retries.
- **Buffer-aware availability**: `isTableAvailable` rewrite must not break existing callers; need to version as `isTableAvailableV2` and mark legacy as deprecated.
- **Telemetry schema**: New telemetry fields (Story H) must align with downstream consumers; check existing payload shapes in `server/capacity/telemetry.ts`.
- **Feature flag plumbing**: New `isCombinationPlannerEnabled` flag must integrate with env config defaults; watch for existing defaults that auto-enable scoring in production.

## Open Questions (and answers if resolved)

- **Q:** Should legacy `generateLegacyTablePlans` also support combos under the new flag?
  **A:** Story A targets selector scoring path when both `isSelectorScoringEnabled()` and the new flag are true. Legacy path can remain singles-only for now.
- **Q:** How to define "adjacent" for partial adjacency requirement?
  **A:** Story A specifies incremental adjacency (each added table adjacent to at least one already chosen) plus final BFS connectivity. We can implement via adjacency map checks + BFS at emission.
- **Q:** What is the best strategy to cap per-slack-bucket candidates?
  **A:** Maintain `Map<slack, RankedTablePlan[]>`, prune to top-N using compare/sort before storing.
- **Q:** Do existing tests cover block window serialization enough to guard Story B?
  **A:** Current tests focus on scoring; we need new unit coverage for canonical window utility + integration to ensure idempotency stability.
- **Q:** Are holds always in the same zone as tables in candidate plan?
  **A:** Quote path infers zone from first table. We must verify alternates avoid conflict tables; if none remain, respond gracefully with user-safe message.

## Recommended Direction (with rationale)

1. **Feature flagging & config guards**: Add `isCombinationPlannerEnabled()` (default false) and wire combined gating inside `generateTablePlans` / selector path. Ensures safe rollout (Story A1, A3, J1).
2. **Combination enumeration**: Implement depth-first search enumerator in `buildScoredTablePlans`:
   - Pre-sort tables by capacity ASC (Story A2) while skipping tables failing min/max party constraints.
   - Track cumulative capacity & table count to prune when exceeding `partySize + maxOverage` or `config.maxTables`.
   - Maintain adjacency constraint per step and run BFS connectivity check before computing metrics.
   - Reuse `computeMetrics` / `computeScore` to score combos, but keep singles fast-path for performance.
   - Collect diagnostics (skipped by reason) and enforce candidate caps (Story A4, G3).
3. **Window canonicalization**: In auto-assign + quote flows, fetch canonical booking via `fetchBookingForAtomic` (Story B1) and use `buildAssignmentWindowRange` for idempotency keys, schedule updates, and telemetry (Story B2/B3, H3). Record discrepancies (>60s) for observability.
4. **Filtering & adjacency hydration**: Enforce `maxPartySize` in `filterAvailableTables` (Story C1) and add tests (Story C2). Update `loadAssignmentContext` to fetch both directions, normalise into undirected map, and tally diagnostics (Story D1/D2).
5. **Hold conflict resilience**: Wrap hold creation in quote flow with conflict handling (Story E1/E2); on conflict, attempt alternates free of conflicting tables before returning friendly response and telemetry event.
6. **Availability v2**: Implement buffer-aware `isTableAvailableV2`, deprecate old function, and add coverage for buffer collisions (Story F1-F3).
7. **Performance & metrics**: Introduce N-per-slack and overall candidate caps, diagnostics counters for prune reasons, and micro-benchmark harness updates to ensure <50ms typical cases (Story G1-G3). Extend telemetry payloads with tableCount/adjacency status/holds info (Story H).
8. **Testing matrix**: Expand unit tests for combos, filtering, canonical windows, availability; integration test for auto-assign idempotency & quote conflict flows; E2E gating toggles (Story I).
9. **Runbook updates**: Document rollout strategy, alerts, and rollback toggles in task folder / docs (Story J).

_Assumptions_: Supabase schema + RPCs available; adjacency tables can be mirrored in-memory without extra DB views; existing tasks have not modified relevant logic since last commit (validated via current workspace state).
