# Implementation Plan: Sprint 3 — Robustness, Optimization & Ops

## Objective

We will improve reliability and performance of manual assignment flows by adding an outbox for post-commit sync/telemetry, caching static inventory and adjacency, real-time invalidation support, hold rate limits, and ops playbooks.

## Success Criteria

- [ ] Crash between commit and sync/telemetry does not affect canonical assignment; worker processes outbox entries.
- [ ] P95 validate/hold improved due to cache (local measurement; staging to confirm).
- [ ] UI stale context resolves quickly via existing Realtime hooks.
- [ ] Hold abuse throttled with friendly errors; minimum TTL enforced.
- [ ] Negative tests for tenant scoping included and green.

## Architecture & Components

- Outbox
  - Table: `capacity_outbox(id, created_at, updated_at, status, event_type, dedupe_key, attempt_count, next_attempt_at, restaurant_id, booking_id, idempotency_key, payload)`
  - Producer: enqueue from `synchronizeAssignments` (assignment sync event) and hold confirm telemetry (hold.confirmed)
  - Worker: `server/jobs/outbox-worker.ts` — poll pending, dispatch handlers, exponential backoff, idempotent via dedupe key.
- Caching
  - Module: `server/capacity/cache.ts` simple in-memory TTL caches
  - Integrations: `loadTablesForRestaurant`, `loadAdjacency` consult caches
  - Invalidation: exported functions to invalidate by restaurantId
- Realtime invalidation
  - Leverage existing `useManualAssignmentContext` Supabase Realtime subscriptions for allocations, holds, and assignments.
- Rate limiting & min TTL
  - Feature flags via env
  - Enforcement in `createTableHold` before insert

## Data Flow & API Contracts

- Outbox enqueue payloads (JSON):
  - `capacity.hold.confirmed`: { holdId, bookingId, restaurantId, zoneId, tableIds, startAt, endAt, expiresAt, actorId, metadata }
  - `capacity.assignment.sync`: { bookingId, restaurantId, tableIds, startAt, endAt, mergeGroupId, idempotencyKey }
- Worker handlers map `event_type` → function (emit telemetry or record event).

## UI/UX States

- No UI change required; existing banner for STALE_CONTEXT and Realtime refetch.

## Edge Cases

- Duplicate outbox enqueue attempts: dedupe on `dedupe_key` unique index.
- Handler failures: retry with exponential backoff; move to dead after N attempts.
- Cache staleness: explicit invalidation hooks; Realtime triggers refetch on UI.

## Testing Strategy

- Unit: cache getters/setters; outbox handler backoff; hold rate-limit calculator.
- Integration: confirm enqueues outbox; worker processes entries; minimal cross-tenant negative test (safe mocks).
- Accessibility: N/A (server-only changes).

## Rollout

- Feature flags:
  - `holds.rate` window/max and `holds.minTtlSeconds` defaulted via env.
- Monitoring:
  - Outbox metrics via observability events (processed, failed, dead).
- Kill-switch:
  - Env flag can disable worker scheduler; producers can fallback to direct telemetry if needed.
