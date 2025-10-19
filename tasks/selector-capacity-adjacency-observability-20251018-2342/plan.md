# Implementation Plan: Selector Quality, Capacity Config, Adjacency Validation, Observability

## Objective

We will equip allocator flows with deterministic, explainable seat selection and richer observability so that ops can tune capacity (incl. custom table sizes) and diagnose skip reasons without manual forensics.

## Success Criteria

- [ ] With `feature.selector.scoring` enabled, synthetic and property tests confirm ≥90% of assignments use capacity ≤ requested + configured overage and tie-breaking is deterministic.
- [ ] Admins can configure restaurant-specific capacities (incl. 3 & 6) via APIs/UI; attempts to persist disallowed capacities are rejected at DB + API layers.
- [ ] `merge_group_members` trigger rejects disconnected or cross-zone merges; regression tests prove impossible to save invalid combinations.
- [ ] Ops dashboard (behind `feature.ops.metrics`) renders daily metrics (assignments, skips by reason, avg overage, merge rate, time-to-assign) and skip reasons for sampled bookings.
- [ ] Structured logs + counters emitted for every auto-assignment attempt and verified via local test harness (mocked telemetry) without breaking existing logging.
- [ ] Targeted unit suites cover analytics event helpers, auth guards, restaurant detail updates, reservation reducer, rate limiter, and PastBooking guard edge cases with ≥90% branch coverage.
- [ ] Capacity selector stress test documents diagnostics/runtime under dense adjacency scenarios and stays within agreed thresholds.

## Architecture & Components

- **Server (capacity selector)**
  - New scoring module (`server/capacity/scoring.ts`) exporting weight config from `policy.ts`, score calculator, deterministic sort helper.
  - Rewrite `generateTablePlans` to call BFS adjacency generator living in `server/capacity/candidate-generator.ts` (kept internal) and return enriched candidates `{tables, slack, score, reasons}`.
  - Update `assignTablesForBooking` to: compute scored candidates, capture top 3 snapshot, apply deterministic tie-break (score → total slack → capacity sum → table_number asc), and emit observability payloads.
- **Config**
  - Extend `server/capacity/policy.ts` with `SelectorScoringWeights` + accessor `getSelectorWeights(restaurantId?)`, default constants, plus optional env override hooking into `env.featureFlags` namespace.
- **Database**
  - Migration creating `allowed_capacities` with composite PK, foreign key from `table_inventory(restaurant_id, capacity)`, indexes, RLS & policies mirroring `table_inventory`.
  - Migration adding `are_tables_connected(uuid[])` + trigger `merge_group_members_validate` enforcing same zone + connectivity.
  - Update Supabase types to include new table/function (manual edit in `types/supabase.ts` if regen unavailable). Seeds insert defaults.
- **API**
  - `/api/ops/tables` & `/api/ops/tables/[id]` validation updated to pull allowed capacities via `SELECT capacity FROM allowed_capacities WHERE restaurant_id = ?`. Introduce new endpoint `/api/ops/allowed-capacities` (GET/PUT) returning list and supporting updates (guarded by `feature.capacity.config`).
  - Extend `auto-assign` API (`/api/ops/dashboard/assign-tables`) to include skip reasons + metrics in response when feature flag on (for UI consumption).
  - New `/api/ops/metrics/selector` endpoint aggregating metrics from `capacity_metrics_hourly` + new telemetry table (if needed) or in-memory aggregator fallback.
- **Observability layer**
  - Expand `server/capacity/metrics.ts` with functions `recordSelectorAssignmentMetrics` (counters/histograms) and update call sites.
  - Structured JSON logging using `console.log(JSON.stringify({...}))` plus `recordObservabilityEvent`.
- **Frontend**
  - Add React Query service module (e.g., `src/services/ops/selectorMetrics.ts`) hitting new endpoints with caching.
  - Update Ops dashboard to show new Insight cards + skip-reason list (Shadcn `Card`, `Badge`, `BarChart` components via MCP).
  - Table settings UI (if needed) to surface allowed capacities (likely under `CapacityConfigClient` → reuse `Select`, `Badge` components).

## Data Flow & API Contracts

- **Candidate scoring flow**
  1. `autoAssignTablesForDate` loads tables + adjacency map.
  2. New generator produces candidate sets up to 3 tables using BFS constrained by adjacency & merge eligibility.
  3. Each candidate scored: `W1*overage + W2*table_count + W3*fragmentation + W4*zone_balance + W5*adjacency_cost`.
  4. Sorted list returned; top selection attempted; metrics/logging emitted.

- **Allowed capacities**
  - `GET /api/ops/allowed-capacities?restaurantId=uuid` → `{ capacities: number[] }`.
  - `PUT /api/ops/allowed-capacities` body `{ restaurantId, capacities: number[] }` (validated list 1-12?). Responds with 200 on success. Reject duplicates/out-of-range. Failures: 400 invalid data, 403 unauthorized, 409 if referenced by tables (handled via transaction).
  - `table_inventory` insert/update rely on DB FK; API fetches list and ensures requested capacity exists before insert.

- **Selector metrics endpoint**
  - `GET /api/ops/metrics/selector?restaurantId=uuid&date=YYYY-MM-DD` returns
    ```jsonc
    {
      "assignments": { "total": 42, "avg_overage": 0.8, "merge_rate": 0.27, "time_to_assign_ms_p95": 140 },
      "skips": [{ "reason": "no_connected_capacity", "count": 5 }],
      "topCandidates": [
        { "bookingId": "...", "candidates": [...], "selected": {...} }
      ]
    }
    ```
  - Errors mirror existing pattern: 400 missing params, 500 for unexpected.

## UI/UX States

- **Metrics dashboard**
  - Loading: skeleton cards + shimmer chart.
  - Empty (no data yet): present neutral message + link to docs.
  - Error: Shadcn `Alert` with retry button, respects `aria-live`.
  - Success: cards for totals, chart for skip reasons over time, table listing most recent skip reasons (keyboard accessible, zebra rows).
- **Allowed capacities editor**
  - Loading existing config (spinner), empty state invites adding first capacity.
  - Error surfaces inline message.
  - Success shows pill list + add/remove controls (with confirmations).

## Edge Cases

- Restaurants without adjacency entries → BFS should gracefully treat single tables only.
- Tables flagged inactive/out_of_service should never appear in candidate sets.
- Overage weight config may be zero; scoring must still enforce deterministic fallback via tiebreakers.
- Allowed capacities updates while tables exist at removed size: DB FK will block; API must surface 409 with guidance.
- Merge groups consisting of 1 table should pass connectivity check; empty arrays should raise validation error.
- Metrics endpoint when telemetry disabled should return zeros and set `source: "fallback"` to inform UI.

## Testing Strategy

- **Unit**:
  - BFS generator with crafted adjacency graphs (including cycles, branching).
  - Scoring function monotonicity & determinism via property tests (Vitest `test.each` + seeded RNG).
  - Policy getter ensuring defaults + overrides.
  - Allowed capacities API validators (mock Supabase).
  - Analytics event emitters insert correct schema version + payload (mock Supabase insert).
  - Restaurant detail update workflow sanitises inputs, enforces slug/timezone, and forwards canonical payload.
  - Auth guards wrap Supabase/membership errors into `GuardError` with correct status codes.
  - Reservation wizard reducer transitions (`SET_CONFIRMATION`, `START_EDIT`, `RESET_FORM`, `HYDRATE_CONTACTS`) behave deterministically.
  - Rate limiter covers redis success, fallback warnings, and memory window rollover.
  - Past booking guard verifies invalid timezone path + override bypass.
- **Integration**:
  - `autoAssignTablesForDate` end-to-end with mock client verifying logs/metrics instrumentation & selection quality.
  - API route tests for allowed capacities + metrics (using `next-test-api-route-handler` style).
  - Database migration review via `pnpm lint:supabase` equivalent (if available) or SQL static analysis.
  - Synthetic stress harness for selector evaluating dense adjacency graphs, recording runtime + diagnostics.
- **E2E**:
  - Playwright scenario toggling new feature flag verifying UI surfaces metrics + skip reasons (if infrastructure allows).
- **Accessibility**:
  - Axe scan on new dashboard components (devtools MCP).
  - Keyboard navigation through skip reason table.

## Rollout

- Feature flags:
  - `feature.selector.scoring` (default off; gating scoring + logging).
  - `feature.capacity.config` (enables allowed capacity endpoint/UI).
  - `feature.adjacency.validation` (enforces trigger, with plan to enable after backfill).
  - `feature.ops.metrics` (exposes metrics endpoint/UI).
- Exposure: enable in staging per flag sequentially (scoring → capacity config → adjacency → metrics).
- Monitoring: watch assignment success ratio, skip reason distribution, API latency; add runbook in docs if metrics degrade.
