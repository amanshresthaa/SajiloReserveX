# Implementation Plan: Booking Logic Fixes

## Objective

We will harden the booking allocation pipeline so that adjacency semantics are consistent, zone assignments stay coherent, holds/capacity enforcement become race-safe, and documented logic gaps (Critical Logic Issues) are closed without regressing existing flows.

## Success Criteria

- [ ] Database enforces a single-zone invariant per booking and prevents orphan assignments.
- [ ] Hold conflicts are enforced deterministically at the database layer regardless of feature flag state; redundant app checks eliminated.
- [ ] Capacity validation runs both before and after table assignment; over-capacity bookings are rejected.
- [ ] Slot creation becomes idempotent under concurrency (no unique violations).
- [ ] Idempotency keys cannot produce duplicate assignments even with new keys.
- [ ] Turn duration logic clamps to service end instead of throwing for near-close bookings.
- [ ] Manual holds can be extended/renewed and default TTL documented.
- [ ] Scarcity/lookahead/zone balance scoring adjusted per recommendations with telemetry to observe impacts.
- [ ] Wall-clock timeout protects DFS enumeration; advisory locks narrowed to reduce contention.
- [ ] Updated docs reflect resolved issues and remaining risks.

## Architecture & Components

- Supabase migrations introduce new columns/constraints/functions:
  - `bookings.assigned_zone_id` + check trigger; `booking_table_assignments` gains `allocation_id` FK; `booking_assignment_idempotency` gains deterministic hash uniqueness.
  - Modified `assign_tables_atomic_v2`, `get_or_create_booking_slot`, new `validate_booking_capacity_after_assignment` helper, stricter hold triggers.
  - Default operating-hours guard to fail bookings when no configuration exists.
- Server-side TypeScript modules (`server/capacity/*.ts`):
  - Update adjacency documentation usage (no code change required if already directional).
  - Enhance `AssignmentOrchestrator` to call new capacity re-check error handling; adjust hold handling to match DB enforcement; add hold-renewal API in `holds.ts` and surface via HTTP route if available (`server/routes/holds.ts`).
  - Modify scoring modules to enforce lookahead ceilings / improved scarcity weighting while emitting telemetry.
  - Update planner window logic to clamp durations.
  - Add advisory lock bucketing & DFS timeout instrumentation (likely in `server/capacity/tables.ts` and `server/capacity/selector/index.ts`).
- Docs: refresh `docs/Critical Logic Issues` summarizing fixes/mitigations.

## Data Flow & API Contracts

- `assign_tables_atomic_v2` now:
  1. Locks finer-grained `(zone, time_bucket)` via computed bucket start.
  2. Ensures `bookings.assigned_zone_id` is set/validated.
  3. Relies on DB-level hold exclusion; catches conflicts and maps to `HoldConflictError`.
  4. Inserts assignments with `allocation_id`; ensures idempotency via hashed set.
  5. Calls new `validate_booking_capacity_after_assignment(p_booking_id)` to re-run capacity math under `FOR UPDATE` lock and raise if exceeded.
- `booking_assignment_idempotency` accepts `table_set_hash` (generated inside function) so retries with different key but same tables short-circuit.
- `get_or_create_booking_slot(restaurant_id, date, time, capacity)` uses `INSERT ... ON CONFLICT DO UPDATE` to return slot id safely.
- Manual hold renewal API: `PATCH /holds/:id/extend` updates expiry while verifying no conflicts; uses Supabase RPC or new server endpoint calling `extend_table_hold` function.
- Capacity check helper returns error code consumed by orchestrator; failure triggers rollback of assignments.

## UI/UX States

No direct UI component yet; manual hold extension exposed to UI later. Add logging/telemetry to ensure ops visibility.

## Edge Cases

- Legacy bookings without zone info: migration must backfill `assigned_zone_id` using existing assignments; if inconsistent, log + prevent enforcement.
- Holds created before strict enforcement becomes default: ensure triggers handle stale rows gracefully.
- Capacity re-check must handle cases where booking has zero assignments (release path) without false failure.
- Scarcity fallback adjustments must not break scoring when data missing; include tests.
- DFS timeout should degrade gracefully by returning best-known plan (not throw) while flagging metrics.

## Testing Strategy

- Unit: add tests for new helper functions (hold renewal, capacity post-check, scarcity weighting, DFS timeout logic).
- Integration: extend Supabase SQL unit tests (if present) or jest tests mocking Supabase to cover assignment idempotency, zone consistency, hold conflicts.
- E2E: reuse existing Playwright flows focusing on manual hold/reservation (if time) or add targeted E2E scenario for booking near close time.
- Accessibility: not directly affected; ensure new errors surface via existing messaging.

## Rollout

- Feature flags: keep existing adjacency/holds toggles but document that strict conflicts now hard-enabled (flag becomes telemetry only or removed post-rollout).
- Exposure: deploy migrations in staging, backfill data, monitor logs for `ServiceOverrunClamped` events.
- Monitoring: instrument metrics for DFS timeouts, hold renewal usage, capacity re-check failures.
- Kill-switch: ability to disable new capacity re-check via config flag if emergency (wrap in GUC `app.capacity.post_assignment.enabled`).
