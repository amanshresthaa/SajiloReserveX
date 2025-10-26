# Implementation Plan: Manual Assignment Backend APIs

## Objective

We will enable staff manual assignment flows (hold, validate, confirm) to operate against RPC v2 with full validation coverage.

## Success Criteria

- [ ] `POST /api/staff/manual/validate` returns `ok` + per-rule `checks[]` ensuring invalid merges/overlaps get surfaced with `status: "error"`.
- [ ] `POST /api/staff/manual/hold` persists/refreshes a hold (TTL default 120s) and returns hold metadata + validation summary; conflicts yield structured 409.
- [ ] `POST /api/staff/manual/confirm` delegates to `assign_tables_atomic_v2` and returns assignment payload without calling legacy RPCs.
- [ ] Feature flag removal + code paths guarantee `assign_table_to_booking` is no longer invoked; lint/tests confirm.
- [ ] Unit + integration + concurrency tests cover validation, hold lifecycle, and confirm flows.

## Architecture & Components

- **New manual selection service**: add `server/capacity/manual.ts` (or equivalent section in `tables.ts`) providing `evaluateManualSelection`, `createManualHold`, `confirmManualAssignment`, and shared types for `ManualCheck` + `ManualSummary`.
- **Hold utilities**: extend `server/capacity/holds.ts` with helpers to fetch/release existing holds for a booking (used when replacing holds) and expose hold conflict queries.
- **API routes**: implement `src/app/api/staff/manual/{validate,hold,confirm}/route.ts` mirroring the staff/auto auth + membership guard flow, using zod schemas + consistent error envelopes.
- **Feature flag cleanup**: remove `isRpcAssignAtomicEnabled` / `isAssignAtomicEnabled` from `server/feature-flags.ts`, update `lib/env.ts` + `config/env.schema.ts`, and adjust allocator helpers (`assignTableToBooking`, `unassignTableFromBooking`, `invokeAssignTablesAtomic`) to always use v2.
- **Supabase migration**: add `supabase/migrations/20251026XXXX_cleanup_legacy_rpc.sql` dropping/aliasing `assign_table_to_booking` (and related grants) so environments cannot fall back.
- **Tests + fixtures**: add `tests/server/capacity/manualSelection.test.ts` (unit) and extend existing atomic tests to reflect the v2-only path/concurrency coverage.

## Data Flow & API Contracts

- **POST /api/staff/manual/validate**
  - Request: `{ bookingId: uuid, tableIds: uuid[], requireAdjacency?: boolean }`
  - Response 200: `{ ok: boolean, checks: ManualCheck[], summary: { tableCount, totalCapacity, slack, zoneId, tableNumbers }, warnings?: ManualCheck[] }`
  - ManualCheck: `{ id: "sameZone"|"movable"|"adjacency"|"conflict"|"capacity", status: "ok"|"warn"|"error", message: string, details?: Json }`
  - Error 400: invalid payload; 404: booking/tables not found; 409: `conflict` hard failure; 500: unexpected.
- **POST /api/staff/manual/hold**
  - Request: `{ bookingId: uuid, tableIds: uuid[], holdTtlSeconds?: number, requireAdjacency?: boolean }`
  - Response 200: `{ holdId, expiresAt, validation: { ok, checks, summary }, metadata: { bookingId, zoneId, tableIds } }`
  - Error 409: conflicts (overlap, stale hold) with structured `{ error: "HoldConflict", code: "HOLD_CONFLICT", details }`.
- **POST /api/staff/manual/confirm**
  - Request: `{ bookingId: uuid, holdId: uuid, idempotencyKey: string, requireAdjacency?: boolean }`
  - Response 200: `{ bookingId, holdId, assignments: { tableId, assignmentId, startAt, endAt, mergeGroupId }[] }`
  - Error 404: hold not found/mismatched; 409: RPC conflict surfaced as `{ error, code, details, hint }`; 500 fallback.

All endpoints include `code` strings aligned with UI consumption, consistent with other staff APIs.

## UI/UX States

- N/A for backend-only scope (confirm after research).

## Edge Cases

- Booking belongs to different restaurant than tables (return 400/404).
- Table inactive/out_of_service—the check should fail with explicit message before hold attempts.
- Multiple holds for same booking: release+recreate strategy must avoid leaking allocations (ensure transaction or cleanup on failure).
- Adjacent graph disconnected while flag disabled—return warning vs error.
- Concurrent confirm requests on same hold: second caller should receive structured conflict (RPC error or HoldNotFound after cleanup).
- Clock skew on TTL—use `DateTime.utc()` and allow TTL override within safe bounds (30–600s per appendix).

## Testing Strategy

- Unit: cover `evaluateManualSelection` for each rule (zone/mobility/adjacency/capacity/conflict), hold replacement helper, and feature-flag behaviour (adjacency warn vs error).
- Integration: simulate API calls via `supertest`-style Next route testing or direct handler invocation with mocked Supabase client to confirm auth + error envelopes.
- Concurrency: Vitest scenario running two confirm promises in parallel with mocked RPC to assert one succeeds and the other surfaces structured conflict, plus hold vs auto assignment overlap guard.
- Regression: update `assignTablesAtomic` tests to assert only v2 path executes and feature flags no longer toggle behaviour.
- Accessibility: N/A (backend).

## Rollout

- Feature flags: delete unused env vars (`FEATURE_ASSIGN_ATOMIC`, `FEATURE_RPC_ASSIGN_ATOMIC`) from config once code no longer reads them.
- Migration: execute new cleanup SQL via remote Supabase deploy; coordinate with DBA to ensure no remaining dependencies before dropping legacy RPC.
- Deployment: No feature flag gating—manual APIs go live with release; ensure UI consumers coordinate rollout.
- Monitoring: instrument structured logs/telemetry via existing `emitHold*` helpers; watch observability events for conflicts post-release.
- Rollback: if v2 issues occur, fallback path removed—rollback would require redeploying previous build + redeploying legacy migration, so capture release notes accordingly.
