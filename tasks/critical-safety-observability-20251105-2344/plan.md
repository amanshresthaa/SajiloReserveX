# Implementation Plan: Critical Safety & Observability Foundation

## Objective

We will harden table hold conflict handling and illuminate allocator health so ops can detect double-booking regressions within minutes, enabling a confident staged rollout of strict conflict enforcement without sacrificing recovery controls.

## Success Criteria

- [ ] Synthetic load (≥1000 concurrent hold requests) yields zero double-bookings in staging and prod soak tests.
- [ ] Dashboards surface assignment success rate, latency P50/P95/P99, retry/cutoff metrics, and error taxonomy in real time with 90‑day history.
- [ ] Feature flag registry documents current state per environment, highlights unsafe combos, and enforces two-step approval workflow for modifications.

## Architecture & Components

- `server/capacity/tables.ts`: tighten handling when `createTableHold` fails due to DB exclusion (translate Postgres error codes, emit telemetry, gracefully continue evaluation).
- `server/capacity/holds.ts`: confirm strict conflict session configuration and expose helper to assert DB-level enforcement for integration tests.
- `tests/server/capacity/quoteTables.concurrent.test.ts` (new): simulate race via mocked Supabase returning conflict on second request, asserting only one hold persists and telemetry recorded.
- Observability tooling:
  - Extend/author `scripts/observability/export-capacity-metrics.ts` to query Supabase views and produce Grafana/DataDog JSON.
  - Add `config/observability/dashboard.json` (Grafana) and `config/observability/alerts.json` (DataDog) templated exports referencing metrics.
- Feature flag governance:
  - Add `scripts/feature-flags/audit.ts` to dump env defaults + overrides (via Supabase) into CSV/markdown matrix.
  - Create `docs/feature-flags/registry.md` summarizing rationale, defaults, approval rules.
  - Enhance `server/feature-flags.ts` to detect contradictory combos at runtime (warn + optionally record observability).
- Documentation & runbooks in `tasks/.../verification.md` capturing soak test evidence, alert screenshots, rollback steps.

## Data Flow & API Contracts

- Holds: `quoteTablesForBooking` -> `createTableHold` (Supabase) -> Postgres exclusion `table_hold_windows_no_overlap`. Error path must surface `HoldConflictError` with metadata, emit `capacity.hold.strict_conflict` + `capacity.rpc.conflict`.
- Observability metrics: Source `observability_events` table; convert to Prometheus-style series (`assignment_success_rate`, `reservation_latency_ms{percentile}`) via SQL views. Dashboard JSON references:
  - Success: ratio of `capacity.selector.assignment` vs. (`assignment` + `skipped`).
  - Latency: percentiles from `context -> 'timing' ->> 'totalMs'` and `plannerMs`.
  - Retry exhaustion: events with context `{ retryExhausted: true }` (requires verifying fields).
  - Cutoff triggers: events `capacity.manual.validate` or RPC conflicts containing `HOLD_RATE_LIMIT`/`CUTOFF`.
- Feature flags: `scripts/feature-flags/audit.ts` queries Supabase table `feature_flag_overrides` (`server/feature-flags-overrides.ts`) + env defaults (`lib/env.ts`). Output matrix consumed by docs.

## UI/UX States

- No new UI surfaces. Ops dashboards live in Grafana/DataDog; ensure documentation provides screenshots and instructions for verifying each panel (loading/error states described in runbook).

## Edge Cases

- Postgres fallback path when nested insert fails (`code === 'PGRST204'`): ensure conflict translation still occurs by manually re-querying `findHoldConflicts`.
- Holds created by same booking should not be treated as conflict; tests must assert window check excludes identical booking id.
- Observability pipeline must handle null restaurant IDs (manual ops actions) without breaking dashboard queries.
- Feature flag audit must cope with missing overrides table (same fallback tested in `tests/server/featureFlags.overrides.test.ts`).
- Alert thresholds: avoid flapping by requiring sustained breach (e.g., 2 consecutive evaluation periods) and ignoring known maintenance windows.

## Testing Strategy

- Unit:
  - Feature flag contradiction detector (mock env combos).
  - Observability export script (dry-run generating JSON for sample data).
- Integration:
  - Vitest concurrency test invoking `quoteTablesForBooking` concurrently with strict conflicts enabled.
  - Supabase RPC smoke test (using test client) verifying `is_holds_strict_conflicts_enabled()` returns true when flag on.
  - Script-level tests using fixture data (via `pnpm test:observability` new suite).
- E2E:
  - Synthetic load runner (existing `run-allocation-stress-test.sh`) targeting staging with strict conflicts on; capture metrics.
  - Manual alert verification: simulate success rate dip by injecting `capacity.selector.skipped` events on staging.
- Accessibility:
  - N/A (no UI change). Ensure documentation is accessible (clear headings, semantic markdown).

## Rollout

- Feature flag: `holds.strictConflicts` (env default true, override toggled via Supabase). Stage: enable in dev immediately, staging at 10% via targeted restaurants, then ramp 50% → 100% after 48h soak.
- Exposure: Document targeted restaurant cohort and fallback (flag override to false + set_hold_conflict_enforcement(false)).
- Monitoring: Dashboard panels + alerts created before ramp; runbook includes on-call instructions.
- Kill-switch: `supabase rpc set_hold_conflict_enforcement(false)` + flag override revert; script add to runbook; integration tests confirm toggling works.
