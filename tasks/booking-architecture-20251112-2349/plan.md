---
task: booking-architecture
timestamp_utc: 2025-11-12T23:49:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: [feat.booking_pipeline.v1]
related_tickets: []
---

# Implementation Plan: Booking Assignment Architecture

## Objective

We will enable the booking platform to move from a monolithic, request-driven workflow to an event-driven pipeline with deterministic state transitions, smart assignment, and continuous optimization so that restaurants can confirm more parties autonomously, recover gracefully from failures, and capture complete audit trails for ops teams.

## Success Criteria

- [ ] ≥95% of bookings auto-confirm within 3 seconds of entering `assignment_pending` (P95) with <1% duplicate processing.
- [ ] Assignment success rate improves by ≥15% for peak hours compared to baseline (tracked via `booking.assignment.success_rate`).
- [ ] Ops dashboards display the expanded lifecycle states without regressions (filters + heatmaps continue working) and manual-review volume stays <5% of total bookings.

## Architecture & Components

- **BookingStateMachine Service**: Wraps Supabase writes in optimistic transactions, enforces transitions defined in `config/booking-state-machine.ts`, records history rows, and emits `booking.state_changed` events with metadata (from/to, actor, reason).
- **Event Bus Adapter**: Abstraction over the selected pub/sub tech (placeholder `EventBridgeAdapter`) that standardizes topics like `booking.created`, `booking.assignment_in_progress`, `booking.assignment_failed`, `booking.confirmed`.
- **DistributedLockManager**: Redis-backed lock service (per booking + per restaurant) that exposes `acquire`, `extend`, `release`, instrumented with contention metrics.
- **SmartAssignmentEngine**: Strategy registry (optimal fit, adjacency, zone preference, load balancing, historical success). Accepts `AssignmentContext` (booking data + TableAvailability snapshot) and returns scored plans.
- **TableAvailabilityTracker**: Builds 1-second cached snapshots from tables + bookings + holds, publishes invalidation events when bookings/holds change, exposes subscription interface for long-lived consumers.
- **AssignmentCoordinator Worker**: Consumes booking events, acquires locks, checks rate limit + circuit breaker, transitions bookings through `assignment_in_progress`, delegates to SmartAssignmentEngine, handles holds, confirms assignments, or schedules retries/manual review.
- **Background OptimizationService**: Nightly/daypart job evaluating table utilization; runs heuristics/optimizers, compares to existing layout, applies improvements if >10% score delta and records rationale.
- **Observability/Alerting**: Structured logs + metrics (`lock.wait_ms`, `assignment.success`, `retry.count`, `manual_review.count`, `optimizer.score_delta`). Integrates with existing telemetry stack per SRE decision.

## Data Flow & API Contracts

- **Events**
  - `booking.created` → payload `{ bookingId, restaurantId, version, partySize, timeslot, metadata }`.
  - `booking.assignment_in_progress`/`booking.assignment_failed`/`booking.confirmed` follow similar envelope with `state`, `attempt`, `strategy`, `reason`.
- **Coordinator Flow**
  1. Event bus delivers `booking.created` to coordinator.
  2. Coordinator acquires `lock:booking:{id}` (TTL 30s). If unavailable, ack + rely on retry.
  3. Coordinator verifies state/version, transitions to `capacity_verified`/`assignment_pending`, fetches TableAvailability snapshot.
  4. SmartAssignmentEngine iterates strategies, scoring top 5 plans, calling `attemptHold` (Supabase RPC) for each; first success triggers `confirmAssignment` transaction.
  5. Coordinator emits `booking.assignment_succeeded` and `booking.confirmed`; failure path increments attempt counter, schedules retry via delayed queue.
- **APIs**
  - New REST endpoint `/api/internal/bookings/:id/state` for privileged updates (manual review release) using BookingStateMachine.
  - `/api/internal/bookings/:id/attempts` to fetch retry metadata for Ops UI with TTL caching.
  - Background optimizer uses Supabase RPC `optimize_day(restaurant_id, date)` returning candidate plans and improvement score; service applies via `apply_optimal_assignment` RPC when threshold met.

## UI/UX States

- Ops dashboard surfaces new statuses grouped (Created, Capacity Verified, Assignment Pending, Assignment In Progress, Manual Review, Confirmed, Failed). Update color coding + tooltips describing automation progress.
- Manual review queue shows reason + attempt count; users can trigger `requeue` or `force_confirm` actions (both invoking BookingStateMachine endpoints).
- Notification service sends customer updates when booking hits `confirmed` or `manual_review` (with accessible language + localization hooks per §5).

## Edge Cases

- Booking updated (time/party size) mid-assignment: coordinator detects `version` mismatch, aborts hold, restarts assignment with fresh snapshot.
- Distributed lock lost (Redis failover): coordinator heartbeats via `extend`, and if extension fails it emits `booking.assignment_aborted` so another worker can safely resume.
- Table availability drift (hold expired): TableAvailabilityTracker invalidates snapshot on hold expiration events to prevent stale data.
- Circuit breaker open: coordinator schedules retry with reason `circuit_open` and logs to alert channel; manual review triggered if breaker remains open beyond SLA.
- Manual overrides vs automation: merges manual assignments into the same history log to keep a consistent audit trail.

## Testing Strategy

- **Unit**: BookingStateMachine validation, DistributedLockManager Lua scripts, strategy scoring functions, TableAvailability snapshot builder.
- **Integration**: Coordinator + SmartAssignmentEngine happy-path and failure-path flows using in-memory Redis + Supabase test schema; retries/backoff logic; event emission contract tests.
- **E2E**: Simulate booking creation via API, ensure pipeline auto-confirms and UI reflects states (Playwright + Supabase staging data).
- **Accessibility**: Axe runs on Ops manual review table once UI states expand; ensure new statuses have SR-friendly labels.
- **Performance**: Stress-test assignment throughput (500 concurrent bookings) and measure P95 < 3s using existing stress runner scripts in `/tests` + new scenarios recorded in `artifacts/`.

## Rollout

- Feature flag `feat.booking_pipeline.v1` gating new lifecycle + coordinator consumption.
- Gradual enablement: 5% of restaurants (opt-in list) → 25% → 100% after 1 week of stable metrics.
- Monitoring: dashboards tracking assignment success %, retry reasons, manual review volume, lock contention; alert thresholds at 2× baseline.
- Kill switch: flag disablement reverts to legacy synchronous assignment flow; coordinator drains queue but stops processing new events.

## DB Change Plan (if applicable)

- **Expansion**: Add columns `state_version`, `assignment_strategy`, `manual_review_reason` to `bookings`; create tables `booking_state_history` and `booking_attempts` (with booking_id FK). Stage via Supabase MCP (staging first) and capture diffs in `artifacts/db-diff.txt`.
- **Backfill**: Script to seed `booking_state_history` from existing bookings ordered by timestamps; run in batches of 500 to avoid locks.
- **Contraction**: Once stable, deprecate obsolete columns (`status_history_json` if present) in a later migration.
- **Rollback**: PITR pointer recorded before apply; revert by dropping new tables + columns if metrics degrade, using MCP apply plan.
