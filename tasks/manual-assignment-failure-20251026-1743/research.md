# Research: Manual Assignment Failure

## Existing Patterns & Reuse

- Backend API surface for manual workflows already lives under `src/app/api/staff/manual/*` — the `hold`, `validate`, `context`, and `confirm` handlers share the same Supabase access/membership guards and reuse `confirmHoldAssignment`, `createManualHold`, and `getManualAssignmentContext` from `server/capacity/tables.ts`.
- `confirmHoldAssignment` ultimately wraps the Supabase RPC `assign_tables_atomic_v2`, emitting telemetry via `emitRpcConflict` and translating Supabase errors into typed `AssignTablesRpcError` / `HoldNotFoundError`.
- Auto-assign is handled by `autoAssignTablesForDate` (same module) which uses `assignTablesForBooking`, `filterAvailableTables`, and venue policy helpers; skip reasons are surfaced in the returned payload.
- Frontend bookings dialog (`src/components/features/dashboard/BookingDetailsDialog.tsx`) wires the manual flows, automatically placing holds (`manualHoldSelection`) and confirming them with per-action idempotency keys. Error surfaces rely on `fetchJson`/`HttpError`.

## External Resources

- Runbook: `docs/runbooks/allocator.md` (telemetry + conflict handling expectations for `assign_tables_atomic_v2`).
- Migration spec: `supabase/migrations/20251026105000_assign_tables_atomic_v2.sql` (details valid error states, SQLSTATE codes, hints).
- Prior task notes: `tasks/manual-assignment-backend-apis-20251026-1151/research.md` summarises how manual APIs should behave post-RPC v2.

## Constraints & Risks

- Supabase access is remote-only; any investigation of holds/assignments must go through existing service clients or telemetry, never local migrations/seeds.
- Manual assignment relies on short-lived holds (default TTL 120s, UI requests 180s) — reproductions must account for expiry windows.
- UI error messaging currently derives from `HttpError.message`; API responses lacking a `message` field degrade into generic “Assignment failed”, obscuring root-cause feedback.
- Auto-assign shares inventory and policy data with manual flows; incorrect fixes risk regressing both automation and manual confirmation.

## Open Questions (and answers if resolved)

- Q: What specific `AssignTablesRpcError` payload (code/details/hint) accompanied the 409 from `POST /api/staff/manual/confirm`?
  A: Reproduced via service client — Supabase RPC returns `code: 42702`, `message: 'column reference "table_id" is ambiguous'`, causing the handler to surface a generic 409.
- Q: Did the manual hold belong to the same booking when the 409 occurred (guard against stale `activeHold` references)?
  A: Pending. Route logs did not print `HOLD_BOOKING_MISMATCH`, suggesting the conflict arose downstream (RPC), but we should verify by querying `table_holds` via service client.
- Q: Why did auto-assign skip every booking for restaurant `f77f46f6-4991-4f37-8699-b1501beff74b` on 2025-10-26? Was the skip reason “No suitable tables”, conflicting assignments, or policy failure?
  A: Re-running the flow after patching `assign_tables_atomic_v2` succeeds; previous skips resulted from the same SQL errors (ambiguous column, missing tables/columns) bubbling up as conflict reasons.
- Q: Are there active holds or allocations occupying the candidate tables (e.g. stale holds from other sessions) that manual validation failed to flag?
  A: Yet to be confirmed — may require checking `findHoldConflicts` results in manual context or directly inspecting Supabase rows.

## Recommended Direction (with rationale)

- Reproduce failing RPC call (done) and patch `assign_tables_atomic_v2` so the UNNEST de-duplication query qualifies `table_id`, limits `FOR UPDATE` to the base bookings table, and gracefully handles environments without merge-group columns by detecting schema features at runtime.
- Harden supporting functions (`get_or_create_booking_slot`) against absent `restaurant_capacity_rules`, ensuring slot creation still works after the capacity cleanup migration.
- Use the service Supabase client to inspect the booking’s current holds (`table_holds`), assignments (`booking_table_assignments`), and overlapping holds for the same tables; confirm UI validation correctly surfaced any conflicts.
- Re-run `autoAssignTablesForDate` against the same restaurant/date via an isolated script/test to reproduce “skip every booking”, logging skip reasons; compare against scheduling data to determine whether we lack valid table inventory, window computation failed, or policy filters are over-restrictive.
- Audit error propagation in manual confirm so structured RPC conflicts bubble up to the client (`message` vs `error` field) — improves operator feedback once root cause is identified.
