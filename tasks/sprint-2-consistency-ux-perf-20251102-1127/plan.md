# Implementation Plan: Sprint 2 — Consistency, UX Gating, and Perf Minimums

## Objective

We will freeze adjacency/zone semantics in holds, add a robust sweeper and confirm-release behavior, emit manual action metrics, narrow context queries with supporting DB indexes, and gate UI actions on staleness with a one-click refresh — improving safety, consistency, and performance.

## Success Criteria

- [ ] Confirm fails with POLICY_CHANGED if table zones/adjacency semantics drift.
- [ ] Orphaned holds are swept within the configured interval; confirm leaves no active holds.
- [ ] Metrics emitted for manual validate/hold/confirm (ok/fail) with required dimensions.
- [ ] P95 manual context load meets target on staging seed after adding indexes and narrowing query.
- [ ] UI shows staleness banner and resolves with one click.

## Architecture & Components

- Hold metadata snapshot: `selection.snapshot` with `zoneIds`, `adjacencyEdges` (normalized), `undirected` flag, and `hash`.
- Confirm path: recompute snapshot and compare; emit `POLICY_CHANGED` details on mismatch.
- Sweeper: reuse `sweepExpiredHolds`; expose `runHoldSweeper`; document scheduling.
- Telemetry: new emitters `manual.validate`, `manual.hold`, `manual.confirm` (ok/fail) in `server/capacity/telemetry.ts`.
- Context narrowing: add feature flag for padding minutes; filter bookings by `[start_at,end_at)` with padding.
- UI: staleness banner and refresh in `BookingDetailsDialog.tsx`; actions disabled while stale.

## Data Flow & API Contracts

- Manual routes unchanged externally; emit metrics internally and surface `STALE_CONTEXT` and `POLICY_CHANGED` codes.
- No sensitive data in telemetry payloads; include `restaurant_id`, `policyVersion`, `adjacencyRequired`.

## UI/UX States

- Staleness banner visible on `STALE_CONTEXT`; refresh button calls `getManualAssignmentContext` and clears error.
- Buttons show existing in-flight disabled states; banner is non-blocking but indicates action is required.

## Edge Cases

- Zone IDs changed on any table in hold → fail confirm with actionable message.
- Adjacency definition changes (edges toggled) → fail confirm; include diff counts in details.
- Asymmetric adjacency data with undirected flag → log warning for data cleaning.

## Testing Strategy

- Unit: adjacency snapshot hash stability; windows overlap unchanged; context padding math.
- Integration (lightweight): confirm mismatch raises POLICY_CHANGED (mocked DB paths where feasible).
- E2E (limited): DST boundary windowsOverlap/computeBookingWindow.
- Accessibility: banner keyboard focus and SR-friendly text.

## Rollout

- Feature flag: `context.query.paddingMinutes` (default 60).
- Monitoring: observe new telemetry streams; validate error rates and P95 context load.
- Kill‑switch: disable narrowed query by setting padding to a very large number if needed.
