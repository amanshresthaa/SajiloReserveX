# Implementation Plan: Sprint 2 — P0 Unify Paths, Merge Persistence, Status Lifecycle

## Objective

We will unify manual and automatic table assignment paths under the transactional RPC, persist merge metadata across the stack, automate table status transitions from bookings, and surface near-real-time updates in the ops UI so operations staff see consistent, conflict-safe seating within 1 s.

## Success Criteria

- [ ] Auto-assignment (`server/capacity/tables.ts`) calls `assign_tables_atomic` once per booking with deterministic idempotency key and retries alternative plans on overlap conflicts; tests cover single/merged table scenarios.
- [ ] Merge groups are stored via RPC, propagated through DTOs/services/UI as `{ groupId, members[], capacitySum }`, and analytics/ops dashboards render merged seats as a single unit.
- [ ] Table status cache updates automatically: `checked_in` → `occupied`, terminal statuses → `available` when no concurrent allocation, and `out_of_service` API creates maintenance allocation + status change.
- [ ] Ops dashboard & table inventory clients reflect assignment/status changes in <1 s when `feature.realtime.floorplan` is on, with graceful fallback to polling otherwise.

## Architecture & Components

- **Auto-assignment engine (server/capacity)**
  - Replace `assignTablesForBooking`'s per-table loop with a candidate-plan generator (single tables sorted by slack, followed by adjacency merges).
  - Invoke `assign_tables_atomic` with advisory-lock semantics and aggregated table IDs; reuse `buildAssignmentWindowRange` and `invokeAssignTablesAtomic`.
  - Capture RPC responses to update in-memory schedule using returned `merge_group_id`.
  - Alternative considered: moving plan generation into SQL; rejected to keep deterministic heuristics in TypeScript and minimise churn.

- **Database updates (Supabase migrations)**
  - Recreate `assign_tables_atomic` to short-circuit when matching `(booking_id, idempotency_key)` exists, reuse existing merge group when possible, and rethrow overlaps as `allocations_no_overlap` (`ERRCODE P0001`).
  - Add trigger/function pair on `bookings` status transitions plus helper to recompute table status from `allocations`.
  - Extend `allocations` schema or adjunct table to support maintenance windows for `out_of_service` toggles (evaluate relaxing `booking_id` constraint vs. dedicated `maintenance_allocations` table; prefer constraint relaxation with `CHECK` to avoid duplicating logic).
  - Each migration wrapped in separate files to keep reviewable diffs and allow feature-flagged rollout.

- **Application layer (server/ops + API routes)**
  - Update `getBookingTableAssignments` to join `merge_groups` & `merge_group_members`, returning group object with members and summed capacity.
  - Adjust `server/ops/bookings.ts` to stop inferring merges when groupId present, emitting new DTO shape for front-end consumers.
  - Extend `/api/ops/bookings/:id/tables` responses accordingly and update error handling for `allocations_no_overlap` (409).
  - Enhance `/api/ops/tables/[id]` PATCH to, when `status` becomes `out_of_service`, create or upsert maintenance allocation spanning provided window (likely require new payload fields).

- **Client/UI layers**
  - Revise `OpsTodayBooking` types and all consumers (`BookingsList`, `BookingDetailsDialog`, `TableInventoryClient`) to rely on persisted group info and display combined capacity + members.
  - Surface new status badges (occupied/out_of_service) consistently, ensuring accessible labels.
  - Introduce Supabase realtime subscription utility (likely in `src/lib/supabase/realtime.ts`) used by `useBookingRealtime` and tables context; fallback to existing polling when flag disabled or channel errors occur. Evaluate alternative using WebSocket server push; rejected due to Supabase built-ins sufficing and lower maintenance.

- **Feature flag wiring**
  - Add `FEATURE_MERGE_PERSISTENCE`, `FEATURE_STATUS_TRIGGERS`, `FEATURE_REALTIME_FLOORPLAN` to schema + env getters.
  - Gate new behaviour (e.g., `assignTablesForBooking` atomic path, realtime hooks) to allow gradual rollout; include override for tests.

## Data Flow & API Contracts

- **Auto assignment RPC**
  - Call: `assign_tables_atomic(p_booking_id uuid, p_table_ids uuid[], p_window tstzrange, p_assigned_by uuid?, p_idempotency_key text?)`
  - Request window derived via `buildAssignmentWindowRange`; idempotency key computed as `${bookingId}:${window.start}-${window.end}:${sortedTableIds}` (all uppercase IDs).
  - Response array: `{ table_id, assignment_id, merge_group_id }[]`.
  - Errors:
    - `allocations_no_overlap` (409) → retry plan.
    - Other errors (404, validation) propagate as 400/500 to caller.

- **Booking assignments DTO (`GET /api/ops/dashboard/summary`, etc.)**
  - Each booking returns `tableAssignments: Array<{ tableId, tableNumber, capacity, section, group: { groupId, members: Array<{ tableId, tableNumber, capacity, section }>, capacitySum } | null }>`
  - `group.members` includes the relevant tables only once; for single-table assignment `group` is null (UI can still wrap for uniform display).

- **Out-of-service API extension**
  - PATCH `/api/ops/tables/:id` accepts `status="out_of_service"` plus optional `{ maintenance: { startIso: string; endIso: string; reason?: string } }`.
  - When status toggled back to available, maintenance allocation dissolved (soft delete).
  - Failure cases return 409 if overlapping bookings exist or invalid window.

- **Realtime**
  - Subscribe to Supabase channel `allocations:restaurant_id=...` + `booking_table_assignments:restaurant_id=...` using row-level filters, dispatch updates to React Query caches.
  - On insert/update/delete, compute affected booking IDs + table IDs; patch cached summary or schedule invalidation.

## UI/UX States

- **Bookings dashboard**
  - Loading: existing skeleton; ensure realtime indicator shows latest event timestamp.
  - Success: merged tables display as `Merge M{capacity}` with tooltip listing members; statuses show `Occupied`, `Reserved`, `Out of Service`.
  - Error: show toast when realtime channel disconnects, degrade to polling (auto re-enable).
  - Checked-in bookings visually highlight occupied tables; completed/cancelled drop badges once tables freed.

- **Table inventory**
  - Show status pill with four states; out-of-service rows annotated with maintenance window (if available).
  - On manual status change, confirm dialog warns if overlap with active allocation; response updates instantly via realtime event.

- **Edge UX**: On idempotency replay (e.g., user double-click assign), UI should remain stable thanks to deterministic key and idempotent RPC.

## Edge Cases

- Overlap detection generating repeated `allocations_no_overlap`; ensure candidate generator eventually exhausts or reports actionable reason.
- Bookings missing `start_time`/`booking_date` currently skipped by auto assign—preserve behaviour and surface descriptive skip reason.
- Maintenance allocation overlapping existing booking should return 409 with guidance to reschedule.
- Supabase realtime disconnection—auto retry with exponential backoff; if still failing, log and revert to polling.
- Idempotency key collisions if window/table set reused for different bookings (should not happen because booking id included); add test to confirm.

## Testing Strategy

- **Unit**:
  - Candidate generator ordering + retry path (Vitest).
  - DTO mapper ensuring new group shape backwards compatible.
  - Realtime hook fallback logic (mock Supabase client).

- **Integration**:
  - Extend `tests/server/capacity/autoAssignTables.test.ts` to assert single RPC invocation, idempotency key composition, merge handling, and overlap retry.
  - Update `assignTablesAtomic` tests for new idempotency short-circuit + error mapping.
  - Add API route tests for `out_of_service` payload (mock Supabase service).

- **Database**:
  - Supabase SQL test (psql script) verifying trigger-driven status transitions and maintenance allocations.
  - Confirm `allocations_no_overlap` raised on conflicting insert.

- **UI**:
  - Component tests (React Testing Library) for `BookingsList` and `TableInventoryClient` verifying new display + status badges.
  - Manual Chrome DevTools MCP run covering keyboard navigation, realtime updates, and status toggles.

## Rollout

- Feature flags: `feature.merge.persistence`, `feature.status.triggers`, `feature.realtime.floorplan` (default false).
- Exposure plan: enable in staging sequentially (merge persistence → status triggers → realtime) while observing Supabase logs (constraint violations, channel errors).
- Monitoring: log structured warnings on RPC retries, track counts of `allocations_no_overlap` (via server metrics), and watch UI telemetry for realtime fallback activation.
