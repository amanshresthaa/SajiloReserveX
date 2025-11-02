# Manual Table Assignment — Low-Level Architecture

Scope: Manual validation, holds, and assignment confirmation for tables in the ops UI and APIs.

This document maps components, data flow, business rules, integrations, and state. It includes verification notes that cross-check code references and behavior.

---

## 1) Component Breakdown

- UI Layer (Ops Dashboard)
  - Dialog and manual assignment UI: `src/components/features/dashboard/BookingDetailsDialog.tsx:1` (selection, validate/hold/confirm, countdown, error surfaces)
  - Validation checks panel: `src/components/features/dashboard/manual-assignment/ManualAssignmentValidationPanel.tsx:1`
  - Actions (Validate/Confirm/Clear): `src/components/features/dashboard/manual-assignment/ManualAssignmentActions.tsx:1`
  - Manual assignment context hook: `src/hooks/ops/useManualAssignmentContext.ts:1`
  - Client service (Ops): `src/services/ops/bookings.ts:560-616, 521-614` (manualValidateSelection, manualHoldSelection, manualConfirmHold, getManualAssignmentContext, assignTable, unassignTable)

- HTTP API Routes
  - Manual
    - Validate: `src/app/api/staff/manual/validate/route.ts:1` (auth → membership → `evaluateManualSelection`)
    - Hold: `src/app/api/staff/manual/hold/route.ts:1` (auth → membership → `createManualHold`; DELETE releases via `releaseTableHold`)
    - Confirm: `src/app/api/staff/manual/confirm/route.ts:1` (auth → membership → `confirmHoldAssignment`)
    - Context: `src/app/api/staff/manual/context/route.ts:1` (auth → membership → `getManualAssignmentContext`)
  - Direct assign/unassign (non-hold)
    - Assign: `src/app/api/ops/bookings/[id]/tables/route.ts:1` (auth → membership → `assignTableToBooking`)
    - Unassign: `src/app/api/ops/bookings/[id]/tables/[tableId]/route.ts:1` (auth → membership → `unassignTableFromBooking`)

- Capacity Engine (Server)
  - Manual flows (tables): `server/capacity/tables.ts`
    - `evaluateManualSelection`: `server/capacity/tables.ts:1754` — validates selection
    - `createManualHold`: `server/capacity/tables.ts:1838` — persists hold after validation
    - `getManualAssignmentContext`: `server/capacity/tables.ts:1929` — loads tables, holds, bookings, busy windows, conflicts
    - `confirmHoldAssignment`: `server/capacity/tables.ts:2160` — orchestrator + RPC → assignments
    - Helpers: busy maps, adjacency, time pruning, window computation
  - Holds core: `server/capacity/holds.ts`
    - `createTableHold`, `releaseTableHold`, `extendTableHold`
    - `findHoldConflicts` (+ legacy fallback)
    - Errors: `HoldConflictError`, `AssignTablesRpcError`, `HoldNotFoundError`
  - Allocator v2 (orchestrator): `server/capacity/v2/*`
    - `AssignmentOrchestrator`: `server/capacity/v2/index.ts:12`, `orchestrator.ts:1`
    - Repository (Supabase RPC): `server/capacity/v2/supabase-repository.ts:96-158` (`assign_tables_atomic_v2`)
    - Errors: conflict/validation/repository
  - Policy/time windows/turn bands: `server/capacity/policy.ts`
  - Feature flags: `server/feature-flags.ts`

- Data Structures (selected)
  - Manual validation types: `src/services/ops/bookings.ts:235-321`
  - Holds: `server/capacity/holds.ts:11-28`
  - Assignment members/groups: `server/capacity/tables.ts:48-67`

- Database (Supabase)
  - Tables: `bookings`, `table_inventory`, `table_adjacencies`, `booking_table_assignments`, `allocations`, `booking_assignment_idempotency`, `table_holds`, `table_hold_members`, `restaurant_memberships`, `profiles`, `restaurants`
  - Seeds illustrate schema: `supabase/seeds/seed.sql:334-860`
  - RPCs: `assign_tables_atomic_v2`, `unassign_tables_atomic`, `set_hold_conflict_enforcement`

---

## 2) Data Flow Analysis

End-to-end (manual flow):

1. Load Context (UI → API → Server)
   - UI calls `bookingService.getManualAssignmentContext(bookingId)` → `GET /api/staff/manual/context` → `getManualAssignmentContext`
   - Server loads booking, tables, active holds, adjacency windows, builds busy map and conflicts (`server/capacity/tables.ts:1976-2016`)
   - Returns: booking window, tables, current assignments, holds (with creator metadata), activeHold, conflicts

2. User Selection (UI state only)
   - User toggles tables on the floor plan; UI tracks `selectedTables` and `requireAdjacency`

3. Validate Selection (no DB writes)
   - UI → `POST /api/staff/manual/validate` with `{ bookingId, tableIds, requireAdjacency?, excludeHoldId? }`
   - `evaluateManualSelection` computes booking window, loads selected tables, builds adjacency (`loadAdjacency`), context bookings (`loadContextBookings`), busy map (bookings+holds), checks conflicts + hold conflicts (`findHoldConflicts`), zone uniformity, capacity slack
   - Response: `{ ok, summary, checks }` (no persistence)

4. Place Hold (writes: table_holds + table_hold_members)
   - UI → `POST /api/staff/manual/hold` (same payload + optional `holdTtlSeconds`)
   - Server re-runs validation; if ok, calls `createTableHold` → inserts into `table_holds` and `table_hold_members` with `expires_at` and selection metadata `summary`
   - If `excludeHoldId` provided and creation succeeds, server attempts to release the previous hold (`releaseHoldWithRetry`)

5. Confirm Assignment (writes: booking_table_assignments, allocations, idempotency ledger; via RPC)
   - UI → `POST /api/staff/manual/confirm` with `{ holdId, bookingId, idempotencyKey, requireAdjacency? }`
   - Server looks up hold, verifies membership, then `confirmHoldAssignment`:
     - Fetch booking + window, compute idempotency key/signature, invoke `AssignmentOrchestrator`
     - Repository executes `assign_tables_atomic_v2` RPC (`server/capacity/v2/supabase-repository.ts:135`) which atomically:
       - Creates/updates `booking_table_assignments`
       - Writes `allocations` mirror (if configured) and idempotency row
     - Post-commit synchronization (`synchronizeAssignments`) normalizes assignment IDs and updates window strings and idempotency rows as needed (`server/capacity/tables.ts:2160-2240`)
     - Emits telemetry (`emitHoldConfirmed`)

6. Direct Assign/Unassign (single-table)
   - Assign: `POST /api/ops/bookings/{id}/tables` → `assignTableToBooking`
   - Unassign: `DELETE /api/ops/bookings/{id}/tables/{tableId}` → `unassign_tables_atomic` RPC

Data transformations & validations:

- Normalization: time windows to ISO UTC; table IDs normalized; adjacency map direction based on flag
- Validation checks output structured with IDs and details for UI rendering

Persistence points:

- Holds: `table_holds`, `table_hold_members`
- Assignments: `booking_table_assignments`, `allocations`, `booking_assignment_idempotency`

---

## 3) Business Logic Documentation

Rules & conditions (selection checks):

- Capacity: sum(table.capacity) vs party size → compute slack (positive/zero/negative)
- Zone uniformity: all selected tables must share the same `zone_id`; else error
- Adjacency: required if `allocator.requireAdjacency` true and party size ≥ `allocator.adjacencyMinPartySize` (or explicit override); verified via `table_adjacencies`
- Conflicts:
  - Bookings with overlapping windows and assigned tables block
  - Holds overlapping with requested window block (optionally strict via feature flag and triggers)

Priority/choice:

- Manual flow uses operator selection; engine does not auto-pick tables here
- When confirming a hold, the allocator RPC enforces constraints and resolves merges if enabled

Conflict resolution logic:

- Validation step flags conflicts; Hold creation checks conflicts again (strict mode may reject with 409 and `HOLD_CONFLICT`)
- On confirm, RPC returns conflict/validation errors with structured translation to HTTP status codes (`AssignTablesRpcError` mapping in route)

Edge cases & error handling:

- Missing tables in payload → `ManualSelectionInputError` (400) (`server/capacity/tables.ts:1760-1765`)
- Cross-zone selection → error check in `buildManualChecks`
- Adjacency not met when required → error
- Hold conflicts → 409 `HOLD_CONFLICT` (manual hold), translated detailed diagnostics
- Idempotency: use supplied or derived signature to avoid duplicates

---

## 4) Integration Points

- Supabase Database
  - RPCs: `assign_tables_atomic_v2` (commit), `unassign_tables_atomic` (unassign), `set_hold_conflict_enforcement` (strict hold windows)
  - Tables: see Data Model section

- Feature Flags: `server/feature-flags.ts`
  - `allocatorV2.enabled`, `allocatorV2.shadow`, `allocator.requireAdjacency`, `allocator.adjacencyMinPartySize`
  - `holds.enabled`, `holds.strictConflicts`
  - `planner.timePruning.enabled`, `adjacency.query.undirected`

- Telemetry: `server/capacity/telemetry.ts` (invoked for diagnostics; not critical to core flow)

---

## 5) State Management

- Table states: `table_inventory.status` (`out_of_service` blocks), `active` boolean, `zone_id`
- Hold states: `table_holds` rows with `expires_at`; membership rows in `table_hold_members`
- Assignment states: rows in `booking_table_assignments` with window `[start_at, end_at)`; mirrored in `allocations`
- Booking lifecycle: status affects inclusion in blocking set (e.g., pending/confirmed/seated are blocking during window checks)

State transitions & triggers:

- Hold creation → members inserted → optional conflict windows table (if present) for strict checks
- Hold release/cancel → members+header rows deleted
- Confirm assignment → atomic commit; may replace previous manual hold (release not automatic here; handled by lifecycle)

---

## Examples (API & Types)

- Validate payload (UI → API): `{ bookingId, tableIds, requireAdjacency?: boolean, excludeHoldId?: string }`
- Hold payload: `{ bookingId, tableIds, holdTtlSeconds?: number, requireAdjacency?: boolean, excludeHoldId?: string }`
- Confirm payload: `{ holdId, bookingId, idempotencyKey, requireAdjacency?: boolean }`
- Validation result: `{ ok, summary: { tableCount, totalCapacity, slack, zoneId, tableNumbers, partySize }, checks: [...] }`

---

## Verification & Cross‑Checks (Ultra-Deep)

Methodology:

- Cross-referenced UI calls to service layer (`src/services/ops/bookings.ts:560-616`) and corresponding API routes under `src/app/api/staff/manual/*` (validate/hold/confirm/context)
- Traced server calls from routes to capacity functions (`server/capacity/tables.ts`) ensuring arguments and outputs align
- Verified RPC usage and error translation in repo (`server/capacity/v2/supabase-repository.ts:96-158`) and routes (status mapping)
- Confirmed busy window construction merges bookings and holds, with time pruning opt-in (`server/capacity/tables.ts:1440-1600` and `1710-1837`)
- Checked feature flag gates (`server/feature-flags.ts`) for adjacency, holds, planner pruning, allocator v2

Alternative perspectives/tests:

- Considered direct assign path bypassing holds → handled via separate ops routes
- Verified legacy fallbacks exist for queries/holds when tables/RPCs missing: see `findHoldConflictsLegacy` and availability fallbacks
- Validated zone and capacity checks are independent of adjacency (each check reports separate status)

Uncertainties & pitfalls:

- DB trigger specifics for strict hold conflict windows are environment-dependent; repo uses `set_hold_conflict_enforcement` and legacy fallbacks if unsupported
- Telemetry not essential to correctness but can affect observability expectations
- If allocator v2 disabled and shadow off, confirmation path will error; ensure flags are set in target environment

Final reflection:

- Re-walked route → server → DB chain to ensure no missing transformation or auth gap
- Re-verified error surfaces in routes match UI expectations (status codes and error codes)
- Re-affirmed idempotency key path during confirm avoids double-assign under retries
