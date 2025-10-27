# Implementation Plan: Capacity Module Implementation

## Objective

Deliver the allocator persistence layer that powers automatic and manual table assignment: expose table availability utilities, hold lifecycle management, and RPC wrappers so Ops APIs can quote, validate, and confirm seat assignments reliably.

## Success Criteria

- [ ] Implement `server/capacity/tables.ts`, `server/capacity/holds.ts`, and supporting planner utilities so `pnpm run build` succeeds.
- [ ] All existing Vitest suites touching capacity/holds/tables pass locally (`tests/server/capacity/*.test.ts`, `tests/server/ops/manualAssignmentRoutes.test.ts`).
- [ ] APIs `/api/staff/auto/*` and `/api/staff/manual/*` integrate with new services without regressions (validated via unit tests + manual QA later).

## Architecture & Components

- `planner/bitset.ts`: constructs 5-minute slot bitsets from allocations + holds, exposes helpers to mark windows and test availability.
- `holds.ts`: encapsulates Supabase access for table holds (create, list, conflicts, confirm via assign RPC, release, sweep) and maps DB rows -> domain models with telemetry hooks.
- `tables.ts`:
  - **Window computation**: `computeBookingWindow`, `windowsOverlap`, derive buffer-expanded blocks using venue policy turn bands.
  - **Data hydration**: fetch booking, table inventory, existing assignments, adjacency graph, and restaurant timezone.
  - **Filtering & scoring**: `filterAvailableTables` applies capacity/activity/zone rules, then uses `buildScoredTablePlans` from `selector.ts` with feature flags for combinations/adjacency.
  - **Availability checks**: `isTableAvailableV2`, `findSuitableTables`, `autoAssignTables*` orchestrate quoting and confirmation flows, calling holds service + RPC wrappers.
  - **Manual flows**: `evaluateManualSelection`, `createManualHold`, `getManualAssignmentContext`, `confirmHoldAssignment` provide validation summaries, hold creation, and assignment confirmation.
  - **RPC wrappers**: `assignTableToBooking`, `unassignTableFromBooking`, `getBookingTableAssignments` leverage Supabase RPC `assign_tables_atomic_v2` and `unassign_tables_atomic`, update idempotency ledger + allocations window clamping.

## Data Flow & API Contracts

- **Quote Auto**: booking fetch → compute window → filter tables → selector picks candidate → attempt hold creation via `holds.createTableHold` (retry on conflict) → respond with hold metadata + alternates.
- **Manual Hold**: reuse selection validation; on success create hold with metadata describing summary and creator; on failure return validation checks.
- **Confirm Hold**: load hold + booking + assignments → `holds.confirmTableHold` runs RPC and returns normalized assignment records → module clamps windows to computed block and records telemetry.
- **Auto Assign Batch**: for each unassigned booking on date, reuse candidate generation to call `assignTableToBooking`; emit telemetry via `emitSelectorDecision`.

Errors bubble as typed classes (`ManualSelectionInputError`, `HoldConflictError`, `AssignTablesRpcError`, `HoldNotFoundError`) so API routes can present friendly messages.

## UI/UX States

- Manual ops dashboards consume context with active holds / conflicts; ensure `getManualAssignmentContext` returns booking, tables, conflicts, holds, and active hold metadata.
- No direct end-user UI changes but APIs feed React hooks; maintain shapes expected by `useManualAssignmentContext`.

## Edge Cases

- Missing booking/restaurant/timezone -> throw `ManualSelectionInputError` / `HoldNotFoundError`.
- Booking windows straddling service close (ServiceOverrunError) and past service hours (ServiceNotFoundError) handled via window computation.
- Concurrency: repeated hold creation attempts detect conflicts via holds service and try alternates.
- RPC missing (`assign_tables_atomic_v2`) surfaces descriptive error.
- Feature flags can disable holds or adjacency; module must skip related logic gracefully.

## Testing Strategy

- Run targeted Vitest suites: `pnpm vitest tests/server/capacity/*.test.ts` and `pnpm vitest tests/server/ops/manualAssignmentRoutes.test.ts`.
- Optional focused runs for helper units (e.g., `tests/unit/table-window-overlap.test.ts`).
- Manual QA later through DevTools MCP once APIs wired into UI (Phase 4).

## Rollout

- No feature flag gate; module becomes baseline service layer.
- After local verification, coordinate with maintainers for staging rollout; monitor allocator telemetry (`emitSelectorDecision`, hold events) to confirm healthy behaviour.
