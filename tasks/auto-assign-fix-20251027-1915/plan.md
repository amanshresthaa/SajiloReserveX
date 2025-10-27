# Implementation Plan: Auto Assign Fix

## Objective

We will enable ops auto assignment to succeed under all valid conditions so that table allocations no longer fail with overlap errors.

## Success Criteria

- [ ] `autoAssignTablesForDate` skips or selects plans that do not collide with existing assignments or holds.
- [ ] Updated unit tests cover overlap scenarios and pass (`tests/server/capacity/autoAssignTables.test.ts`).
- [ ] Ops telemetry emits a skip reason instead of triggering Supabase overlap errors in conflict situations.

## Architecture & Components

- `server/capacity/tables.ts`:
  - Enhance `autoAssignTablesForDate` to build a busy map (reusing `buildBusyMaps` and `extractConflictsForTables`) and filter candidate plans against it.
  - Introduce helper utilities as needed to fetch active holds once per run and to mutate `ContextBookingRow.booking_table_assignments` after assignment.
- `server/capacity/holds.ts` (if required): expose a `listActiveHoldsForRestaurant` helper reused by auto assign.
  State: server-side only | Routing/URL state: unchanged

## Data Flow & API Contracts

Endpoint: POST /api/ops/dashboard/assign-tables
Request: `{ restaurantId, date, assignedBy? }` (unchanged)
Response: `{ assigned: Array<{ bookingId, tableIds }>, skipped: Array<{ bookingId, reason }> }` (unchanged structure, but conflict reason becomes explicit skip path)
Errors: surface only unexpected failures; overlap errors eradicated when logic works

## UI/UX States

- Loading: unchanged
- Empty: unchanged
- Error: unchanged (500s now reserved for genuine faults, not predictable overlaps)
- Success: bookings auto-allocated without Supabase RPC overlap errors

## Edge Cases

- Booking already has assignments (should be skipped as today).
- All candidate tables conflict with existing assignments or holds → ensure skip reason returned.
- Holds table data unavailable (e.g., feature flag off or query failure) → proceed while logging but avoid crashes.
- Sequential booking processing should respect earlier assignments produced during the same run.

## Testing Strategy

- Unit: extend `tests/server/capacity/autoAssignTables.test.ts` to cover assignment conflicts and hold conflicts.
- Integration: rely on existing RPC integration (covered by supabase functional tests) – no new integration tests planned.
- E2E: manual QA via Ops dashboard once server fix deployed (captured in verification).
- Accessibility: unaffected (server-side change only).

## Rollout

- Feature flag: none; existing feature flag toggles unchanged.
- Exposure: deploy immediately; behaviour guarded by deterministic checks.
- Monitoring: continue relying on Ops telemetry (`emitSelectorDecision`, RPC error logs) to confirm absence of overlap failures.
