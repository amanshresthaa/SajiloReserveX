# Research: Allocator Rebuild

## Existing Patterns & Reuse

### Allocator Entry Points

- **Manual workflows**
  - `POST /api/staff/manual/hold` → `server/capacity/holds.createTableHold`
  - `POST /api/staff/manual/validate` → `server/capacity/tables.evaluateManualSelection`
  - `POST /api/staff/manual/confirm` → `server/capacity/tables.confirmHoldAssignment`
  - `GET /api/staff/manual/context` → `server/capacity/tables.getManualAssignmentContext`
- **Auto workflows**
  - `POST /api/staff/auto/quote` → `server/capacity/tables.quoteTablesForBooking`
  - `POST /api/staff/auto/confirm` → `server/capacity/tables.confirmHoldAssignment`
  - `POST /api/ops/dashboard/assign-tables` → `server/capacity/tables.autoAssignTablesForDate`
- **Ops APIs**
  - `POST /api/ops/bookings/[id]/tables` → `assignTableToBooking`
  - `DELETE /api/ops/bookings/[id]/tables/[tableId]` → `unassignTableFromBooking`
  - `GET /api/ops/bookings/[id]/tables` → `getBookingTableAssignments`

### Server Modules

- `server/capacity/tables.ts`: core orchestrator (quoting, validation, manual/auto assignment, selector integration).
- `server/capacity/holds.ts`: hold lifecycle (create, confirm, sweep, conflict detection).
- `server/capacity/selector.ts` + `planner/bitset.ts`: plan enumeration/scoring and busy-window utilities.
- `server/capacity/index.ts`: exports allocator functions to API layers.
- `server/capacity/telemetry.ts`: observability events (`emitSelectorDecision`, `emitSelectorQuote`, `emitHold*`, `emitRpcConflict`).
- Hooks/UI integration: e.g., `src/hooks/ops/useOpsTableAssignments.ts` consumes auto/manual endpoints.

### Supabase Components

- RPCs: `public.assign_tables_atomic_v2`, `public.unassign_tables_atomic`.
- Tables: `booking_table_assignments`, `allocations`, `booking_assignment_idempotency`, `table_holds`, `table_hold_members`, `table_inventory`, `table_adjacencies`, `booking_slots`, `bookings`.
- Constraints/policies:
  - Unique `(booking_id, table_id)` via `booking_table_assignments_booking_table_key`.
  - Unique `(table_id, slot_id)` via `booking_table_assignments_table_id_slot_id_key`.
  - GiST exclusion on allocations (prevents overlapping windows).
  - Advisory lock (zone/date) inside `assign_tables_atomic_v2`.

### Feature Flags & Configuration

- `FEATURE_COMBINATION_PLANNER`, `FEATURE_ALLOCATOR_MERGES_ENABLED`, `FEATURE_ALLOCATOR_REQUIRE_ADJACENCY` from `lib/env.ts` / `server/feature-flags.ts`.
- Scoring configuration via `getSelectorScoringConfig`.

## External Resources

- `appendix.md` (allocator section) outlines current invariants and historical fixes (adjacency, merge groups, idempotency).
- Prior tasks (`tasks/table-adjacency-bug-20251027-2058`, `tasks/precise-table-assignments-20251027-1634`) document recent patches and edge conditions to preserve when rebuilding.

## Constraints & Risks

- **Supabase-managed state**: rewrites must remain compatible with existing tables, triggers, and RPCs unless we introduce new migrations (requires coordination, remote-only execution, downtime planning).
- **Concurrency guarantees**: current function uses advisory locks and GiST exclusions to prevent overlaps; new design must offer equivalent safety.
- **Backwards compatibility**: UI, mobile clients, and telemetry expect current API contracts; breaking changes demand versioning/feature flags.
- **Operational limits**: long-running rebuild risks service disruption—need phased rollout, shadow mode, or toggles. Any attempt to “delete logic” without a staged replacement could halt bookings.
- **Testing coverage**: existing Vitest suites and Playwright flows cover many scenarios; rewriting invalidates assumptions and will require comprehensive test updates.

## Known Pain Points

- `assign_tables_atomic_v2 assignment duplicate` surfaces when legacy rows or concurrent inserts violate `(booking_id, table_id)` / `(table_id, slot_id)` unique constraints—manual cleanup required today.
- Combination planner frequently disabled in production; without it the allocator never attempts multi-table merges, leading to failed assignments for large parties.
- Adjacency data historically stored as directed edges; missing reverse edges caused false negatives until patched (still brittle if data incomplete).
- Idempotency ledger (`booking_assignment_idempotency`) can retain stale `merge_group_allocation_id` when manual paths normalize windows, breaking retries.
- Hold confirmation errors bubble up generically as 409 without actionable hints for operators.
- Telemetry is fragmented (selector decision vs RPC conflict logs), complicating root-cause analysis.

## Open Questions (and answers if resolved)

- Q: Are we replacing Supabase RPCs or only server-side coordination?
  A: TBD — decision needed before implementation; removing RPCs implies significant SQL migration plus API downtime planning.
- Q: Do we have alternative data requirements (e.g., dynamic adjacency, new merge rules)?
  A: TBD — gather product requirements before design.
- Q: Is backward compatibility with current clients mandatory during rollout?
  A: TBD — influences whether we ship behind feature flags or version new endpoints.

## Recommended Direction (with rationale)

- Start with a **comprehensive inventory** of current flows (manual, auto, holds, telemetry, scheduler) and document pain points to avoid reintroducing them.
- Define target **architectural goals**: e.g., idempotent state machine, clearer separation of planning vs persistence, extensible merge rules.
- Produce a **staged migration plan** (new schema + dual-write or flag-driven switch) rather than wholesale deletion to minimize downtime and risk.
- Reuse proven components (selector scoring, telemetry) where possible; rewrite only the problematic pieces (assignment persistence, hold confirmation) to shorten delivery time and reduce regressions.
- Catalog and preserve existing feature flags/telemetry pathways to ease dual-run comparisons during rollout.
