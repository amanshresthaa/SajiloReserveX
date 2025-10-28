# Implementation Plan: Auto Assign Skip Analysis

## Objective

We will map the dominant auto-assign skip reasons and outline mitigations so the allocator can reduce skipped bookings without harming turnover discipline.

## Success Criteria

- [x] Explain why bookings fail before planning (service window, pre-existing assignments).
- [x] Detail planner-level skips tied to scoring/constraints (capacity, adjacency, `kMax`, evaluation limit).
- [ ] Quantify skip categories from telemetry for top venues.
- [ ] Recommend tunable or data-quality fixes aligned with feature flags.

## Architecture & Components

- `server/capacity/tables.ts`: orchestrates auto-assign, records skip reasons, handles Supabase conflicts.
- `server/capacity/selector.ts`: enumerates candidate plans, enforcing `maxOverage`, `kMax`, adjacency; emits diagnostics counters.
- `server/capacity/policy.ts`: computes service windows/turn bands that gate reservations.
- `server/capacity/telemetry.ts`: logs `capacity.selector` events with diagnostics used for post-hoc analysis.
- Feature flag layer (`server/feature-flags.ts`, `lib/env.ts`): controls adjacency requirement, combination planner, `kMax`.

## Data Flow & API Contracts

- Ops dashboard issues `POST /api/ops/dashboard/assign-tables` → `autoAssignTablesForDate`.
- Response shape already includes `{ assigned: [...], skipped: [{ bookingId, reason }] }`; telemetry mirrors details for analytics.
- Supabase repository enforces `assign_tables_atomic_v2`; duplicate/conflict responses propagate back as skip reasons.

## UI/UX States

- Loading: Ops dashboard spinner during assignment job.
- Success: booked tables or skip chips, each showing reason string (e.g., “No suitable tables available…”).
- Error: HTTP 409/500 when upstream conflict thrown before skip handling (rare after v2 refactor).

## Edge Cases

- Large parties needing >`kMax` tables or exceeding `maxOverage`.
- Adjacency graph gaps leading to false `adjacency` skips despite available capacity.
- Service overlap with existing bookings/holds creating conflict-based skips.
- Supabase race conditions producing duplicate assignment errors.

## Testing Strategy

- Unit: verify selector diagnostics increments for adjacency/kMax/limit scenarios.
- Integration: simulate auto assign responses covering service overrun, planner fallback, Supabase overlap (existing tests partially cover).
- Observability: analyze `capacity.selector.skipped` events to ensure telemetry reflects new mitigations.
- E2E: optional once mitigations are prototyped to confirm UI messaging.

## Rollout

- Feature flag: allocator_v2 already primary; leverage `allocator.requireAdjacency`, `allocator.kMax`, combination planner toggle for experiments.
- Exposure: run telemetry-driven A/B comparisons before widening relaxed constraints.
- Monitoring: dashboard on skip counts by reason, plus Supabase conflict rate to detect regressions.
