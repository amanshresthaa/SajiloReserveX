# Implementation Checklist

## Setup

- [x] Confirm Supabase RPC helpers (`set_hold_conflict_enforcement`, `is_holds_strict_conflicts_enabled`) available in local test harness.
- [ ] Update env fixtures / feature flag overrides for new defaults.

## Core

- [x] Enhance `server/capacity/tables.ts` to treat Postgres exclusion violations as conflicts with enriched telemetry.
- [x] Add helper exports or assertions in `server/capacity/holds.ts` to aid integration tests.
- [x] Build feature flag contradiction detector + runtime warnings in `server/feature-flags.ts`.
- [x] Author observability metric export script and dashboard/alert templates under `scripts/config/observability`.
- [x] Generate feature flag registry doc + approval workflow updates.

## UI/UX

- [ ] N/A (dashboard templates & docs only) — ensure documentation has clear instructions/screenshots pointers.

## Tests

- [ ] Unit: new feature flag validation + observability exporter.
- [x] Integration: concurrent hold race simulation + strict conflict toggle verification.
- [ ] E2E: document synthetic load + alert fire drill results in verification.md.
- [ ] Axe/Accessibility checks: N/A (documentation).

## Notes

- Assumptions: Access to Supabase staging for flag audit; Grafana/DataDog credentials handled outside repo.
- Deviations: None yet.

## Batched Questions (if any)

- Await confirmation on observability backend (Grafana vs. DataDog) before finalizing templates.
