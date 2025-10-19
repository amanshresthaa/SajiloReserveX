# Implementation Checklist

## Setup

- [x] Create scoring + candidate generator modules; wire feature flag scaffolding.
- [x] Add selector weight config in `policy.ts` and export helpers.

## Core

- [x] Rewrite candidate enumeration with BFS up to 3 tables and compute scoring + deterministic ordering.
- [x] Integrate logging + metrics around selector decisions.
- [x] Instrument auto-assignment to emit structured events, counters, and capture top-3 candidates.
- [x] Add allowed capacities table migration + seeds + Supabase types.
- [x] Update ops table APIs & services to use dynamic capacities (with caching + feature flag).
- [x] Implement `are_tables_connected` function + trigger for `merge_group_members`.
- [x] Add selector metrics endpoint + service to surface aggregated stats.

## UI/UX

- [x] Surface allowed capacities management in Ops capacity UI when flag enabled.
- [x] Add metrics/skip-reason dashboard section (cards + charts + accessible table).

## Tests

- [x] Property tests for scoring (prefers singles, monotonic overage, deterministic).
- [x] Unit tests for BFS generator + weight config.
- [x] API route tests for allowed capacities + selector metrics.
- [x] Update/extend auto-assign integration tests to validate scoring + logging.
- [x] Add SQL test plan / reasoning for adjacency trigger (document in verification).
- [x] Frontend tests (React Testing Library) verifying new dashboard renders & handles empty/error states.

## Notes

- Assumptions:
  - Initial metrics endpoint can reuse `capacity_metrics_hourly` without new storage; if insufficient, capture note for follow-up.
  - Feature flags default to false to avoid regressions; staging enabling handled separately.
- Deviations:
  - Will document if migration ordering conflicts with existing seeds or requires manual data correction.

## Batched Questions (if any)

- None currently; will capture during implementation if blockers surface.
