# Implementation Plan: Remove Legacy Scoring

## Objective

We will simplify the selector by making yield-aware scoring the only path, eliminating legacy fallbacks and the `selectorYieldManagement` feature flag.

## Success Criteria

- [ ] `selectorYieldManagement` flag is removed from env schema, runtime config, and feature flag helpers with no remaining references.
- [ ] Selector always loads demand multipliers and table scarcity scores; telemetry/tests confirm weight and multiplier fields populate regardless of flags.
- [ ] Documentation no longer references toggling yield management and instead describes the always-on behavior.

## Architecture & Components

- `config/env.schema.ts`, `lib/env.ts`, `server/feature-flags.ts` – remove the flag definition and helper, adjust downstream typing.
- `server/capacity/tables.ts`, `server/capacity/policy.ts`, `server/capacity/telemetry.ts`, `src/services/ops/bookings.ts` – always set scarcity weights, drop yield flag plumbing, ensure telemetry remains consistent.
- Documentation (`documentation/YIELD_MANAGEMENT_CONFIG.md`) updated to reflect mandatory yield scoring.

## Data Flow & API Contracts

- Auto-assignment path will always call demand/scarcity loaders; telemetry still exposes weights, demand, lookahead, but no longer includes `yieldManagementEnabled` boolean.
- No external API shape changes expected; internal telemetry JSON changes (field removal) will be documented.

## UI/UX States

- N/A (service-level change; ensure ops dashboards consuming telemetry adapt to field removal if applicable).

## Edge Cases

- Supabase outages: verify existing fallback to heuristic scarcity and multiplier=1 remains when flag is gone.
- Ensure tests/fixtures that previously assumed scarcity weight `0` are updated to new default.
- Downstream consumers expecting `yieldManagementEnabled` need communication; document in PR.

## Testing Strategy

- Unit: selector scoring tests (existing suite) to confirm new defaults.
- Integration: auto-assign tables tests to ensure telemetry assertions still pass without flag.
- Regression: run `pnpm test:ops --run tests/server/capacity/selector.scoring.test.ts` and `tests/server/capacity/autoAssignTables.test.ts`.
- Accessibility: N/A.

## Rollout

- Feature flag: none (behavior always on).
- Exposure: direct rollout; ensure documentation warns teams about telemetry schema change.
- Monitoring: observe selector latency + demand/scarcity loader logs post-deploy.
- Kill-switch: revert commit if critical issues arise; no flag fallback.
