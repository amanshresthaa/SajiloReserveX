# Implementation Plan: Atomic Persistence v2, Holds, Auto Quote API

## Objective

We will deliver a concurrency-safe table assignment workflow (RPC v2 + holds) and expose an Auto Quote staff API so that bookings can be quoted and confirmed atomically without double-assigning tables or leaking stale holds.

## Success Criteria

- [ ] `assign_tables_atomic_v2` enforces zone-level locks, adjacency/mobility rules, idempotency ledger, and returns `(table_id,start_at,end_at)`; concurrent requests on same booking/time produce one success and deterministic conflict responses.
- [ ] Holds created via new service mirror into `allocations` and are expired/removed (including mirror rows) by the sweeper, ensuring no stale holds block inventory.
- [ ] `/api/staff/auto/quote` returns `{holdId,expiresAt,candidate,alternates,nextTimes}` within p95 ≤ 50 ms on dev fixtures, emits `capacity.selector.quote`, and telemetry for holds/RPC conflict persists to `observability_events`.
- [ ] Integration test verifies Quote → Confirm path (hold create, RPC confirm, audit + allocations produced) and expired hold path cleans up allocations.

## Architecture & Components

- **Database** (`supabase/migrations/20251026_005_assign_tables_atomic_v2.sql`):
  - Create `booking_assignment_idempotency` ledger (booking_id, idempotency_key, table_ids, window, merge_group_id?, created_at) with unique composite key.
  - Implement `assign_tables_atomic_v2` PL/pgSQL function (multi-table, adjacency optional, per-zone advisory lock, hold conflict checks) + grant/owner updates; optionally drop/replace old function or keep for fallback.
  - Add helper view or function if needed to surface active holds for RPC checks.
- **Capacity Services**:
  - `server/capacity/tables.ts`: add `invokeAssignTablesAtomicV2`, extend assignment wrapper to pick RPC version, support `requireAdjacency`, map new return shape, emit telemetry on conflicts, update selector integration to request adjacency flag when needed.
  - `server/capacity/holds.ts` (new): encapsulate hold creation/update/delete, internal transactional mirroring to `allocations` (resource_type='hold'), selection for sweeper, and conversion helpers.
  - `server/capacity/telemetry.ts`: add emitters for `capacity.selector.quote`, `capacity.hold.created|expired|confirmed`, `capacity.rpc.conflict`.
  - `server/observability.ts`: allow passing `restaurantId`/`bookingId`, ensure insert returns quickly with structured context.
- **API Layer**:
  - `src/app/api/staff/auto/quote/route.ts`: POST handler (staff auth guard) to load booking + selector context, call hold service, respond with candidate/alternates/nextTimes.
  - `src/services/ops/bookings.ts`: add client function invoking new endpoint for Ops dashboard consumption.
- **Background/Sweeper**:
  - `server/jobs/capacity-holds.ts` (new) or similar to sweep expired holds: delete `table_holds` rows with `expires_at < now()` and cascade remove mirror allocations (explicit cleanup in case cascades insufficient).
  - Document scheduling expectation (callable via cron/edge function) and add TODO if actual scheduler out of scope.

## Data Flow & API Contracts

- **RPC** `assign_tables_atomic_v2(booking_id uuid, table_ids uuid[], idempotency_key text, require_adjacency boolean DEFAULT false)`:
  - Steps: load booking row (`FOR UPDATE`), derive service_date (`COALESCE(booking_date, date(timezone(tz, start_at)))`), fetch candidate tables (`FOR UPDATE`), compute zone hash + lock `pg_advisory_xact_lock(hashtext(zone_id::text), service_date_int)`, enforce zone/mobility/active checks, optionally adjacency via `table_adjacencies`.
  - Idempotency: upsert/select from `booking_assignment_idempotency`; if existing and table set differs → raise `P0003`; if match → return stored assignments (with start/end).
  - Hold guard: query active `table_holds`/`table_hold_members` overlapping window; if any, raise conflict (`capacity_hold_conflict`).
  - Writes: allocations per table (`resource_type='table'`), optional merge group allocation (`resource_type='merge_group'`), `booking_table_assignments` rows referencing merge group, ledger entry, rely on trigger for `audit_logs`.
  - Returns: setof `(table_id uuid, start_at timestamptz, end_at timestamptz, merge_group_id uuid)` (merge id maybe null).
- **Holds Service**:
  - `createHold({ bookingId, zoneId, tableIds, window, ttlMs, requireAdjacency, metadata })` → inserts `table_holds`, `table_hold_members`, mirrored `allocations` rows with `resource_type='hold'` keyed by hold id; returns DTO with `holdId`, `expiresAt`, `tables`.
  - `confirmHold({ holdId, idempotencyKey, requireAdjacency })` → loads hold + members, calls RPC v2, deletes hold + mirror allocations in same transaction.
  - `expireHold({ holdId | before })` sweeping path removes hold + mirrors.
- **API** `/api/staff/auto/quote` (POST):
  - Request: `{ bookingId: string; zoneId?: string; maxTables?: number; requireAdjacency?: boolean; avoidTables?: string[] }`.
  - Response 200: `{ holdId: string; expiresAt: string; candidate: { tables: [...], window: { start,end }, overage, scoreMetrics }, alternates: Candidate[]; nextTimes: string[] }`.
  - Response 409: `{ code: "CAPACITY_CONFLICT"; message; conflicts?: [...] }` if RPC conflict when confirming or no candidate due to holds.
  - Response 404/422 for booking not found or invalid request.
- **Telemetry**:
  - On quote: emit `capacity.selector.quote` with booking/restaurant context, candidate metrics, duration.
  - On hold create/confirm/expire/conflict: emit respective events with hold id, tables, TTL, actor, reason.
- **Sweeper**: accepts optional batch size, deletes expired holds, logs telemetry for each expiry.

## UI/UX States

_(API-focused)_

- Loading: request in-flight (Ops dashboard can display spinner).
- Empty: selector returns no candidate → respond 200 with `{candidate: null, alternates: [], nextTimes}` + telemetry skip reason.
- Error: surface explicit codes (`CAPACITY_CONFLICT`, `INACTIVE_BOOKING`, `IDEMPOTENCY_MISMATCH`, `HOLD_CONFLICT`).
- Success: candidate + hold ID returned; Ops dashboard should store `holdId` for confirm call.

## Edge Cases

- Booking missing `start_at`/`end_at`: RPC should compute window from `booking_date` + times; reject if insufficient data.
- Tables not in same zone / inactive / `mobility='fixed'` when >1: fail fast with specific SQLSTATE hint.
- Idempotency key reuse with different table_ids: raise mismatch and avoid partial writes.
- Advisory lock collisions or deadlocks: implement retry-once logic around `lock_not_available` and `deadlock_detected` errors.
- Overlapping holds from other sessions: detect via hold query and translate to 409.
- Hold TTL expiration between quote and confirm: confirm should detect missing hold (404) or treat as conflict requiring re-quote.
- `avoidTables` filtering leading to zero candidates: return empty result quickly with reason.
- Telemetry insert failures: log but do not break main flow.

## Testing Strategy

- **Unit**:
  - PL/pgSQL unit-style tests via pgTAP or migration assertions (if feasible) for adjacency/mobility/idempotency cases.
  - Vitest for `holds.ts` (create/confirm/expire path using mocked Supabase client) and telemetry emitters.
  - Wrapper tests adapting `assignTablesAtomic`/`autoAssign` to new RPC signature and verifying error translation.
- **Integration**:
  - Quote→Confirm flow using Supabase RC (if available) or mocked client verifying ledger insert, allocations counts, audit trigger invocation.
  - Expired hold sweeper removes holds + mirror allocations.
  - Concurrent confirm attempts (10 parallel) verifying one success, others 409 (simulate via mocked RPC responses or transaction harness).
- **Performance/Regression**:
  - Measure Auto Quote latency in dev fixtures (profiling with timers).
  - Ensure telemetry inserts during quote/confirm don’t throw (mock failure scenarios).
- **Accessibility**: N/A (no new UI), but Ops API docs should mention errors (documented in verification).

## Rollout

- Feature flag: introduce `FEATURE_RPC_ASSIGN_TABLES_V2` (configurable via env) to gate new RPC usage; default enabled in staging, gradual in production.
- Deployment order: run migrations (RPC + ledger) → deploy backend services → switch feature flag → monitor telemetry counts.
- Monitoring: observe `observability_events` for new event types, track RPC conflict/error rates, add temporary dashboard query.
