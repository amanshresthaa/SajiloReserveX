---
task: table-assignment-overhaul
timestamp_utc: 2025-11-13T08:49:12Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Plan: Table Assignment Overhaul

## Objective

Enable each booking to flow through an auditable event-driven assignment pipeline that guarantees exclusive processing, leverages smart scoring strategies, and converges on a confirmed assignment or manual-review fallback with strong observability.

## Success Criteria

- [ ] Booking states persist via the new state machine table/history, with optimistic version checks guarding transitions.
- [ ] Distributed lock manager prevents concurrent assignment work across workers; lock acquisition metrics emitted.
- [ ] Smart assignment engine evaluates at least 5 strategies, scores plans, and records success/failure outcomes per strategy.
- [ ] Assignment coordinator processes bookings idempotently, respects rate limiting + circuit breaker, and updates bookings to `confirmed` or `manual_review` as appropriate.
- [ ] Real-time availability tracker serves ≤1s-old snapshots with pending holds included when requested.
- [ ] Background optimization job can re-evaluate a day’s bookings and apply ≥10% score improvements when found.

## Architecture & Components

- `booking-state-machine.ts`: encapsulates transition rules, Supabase transactions, history writes, and event emission (via outbox/event bus).
- `distributed-lock-manager.ts`: Redis-backed lock acquisition/extension/release, instrumented for latency/failures.
- `smart-assignment-engine/`: strategies implementing `AssignmentStrategy`; context builder pulls restaurant/tables/holds; scoring service ranks plans.
- `assignment-coordinator.ts`: orchestrates locking, circuit breaker, rate limiter, and success/failure handling; interacts with notification queue.
- `availability-tracker.ts`: pulls confirmed bookings + holds, caches results per `restaurantId+slot`, notifies subscribers (PubSub or in-process listeners).
- `optimization-service.ts`: periodic optimizer using `TableOptimizer` heuristic; applies new plans when better.
- Routing: Next.js API routes or server jobs dispatch events into coordinator; background queue (existing `server/jobs`) invokes coordinator.

## Data Flow & API Contracts

Endpoint: `POST /api/assignments/process` (internal/job)
Request: `{ bookingId: string, trigger: 'creation'|'modification'|'retry' }`
Response: `{ status: 'accepted', correlationId }`
Errors: 409 if lock held; 400 if invalid state.

State-machine transitions stored in `booking_state_history` (new table) capturing `{ id, booking_id, from_state, to_state, metadata, actor_id, created_at }`. Booking rows gain `state`, `version`, `assignment_attempts`, `assigned_at`, `assignment_strategy` fields.

Assignment attempts table: `booking_assignment_attempts` with columns (id, booking_id, attempt_no, strategy, result, reason, metadata, created_at).

## UI/UX States

No new UI components yet; existing ops UI continues to poll booking state & table assignments, but new states (e.g., `assignment_pending`, `manual_review`) must display consistent badges (handled later). For now, API responses still map to legacy `status` semantics (confirmed vs pending) while state machine provides finer-grained status for backend flows.

## Edge Cases

- Double bookings: lock + version guard stops duplicate confirm.
- Booking cancellations mid-process: coordinator re-checks current state before transition; if `cancelled`, emit `booking.failed` event.
- Redis outage: lock manager falls back to `null` acquisition → coordinator schedules retry.
- Strategy scoring ties: deterministic tie-breaker (strategy priority, sorted table IDs) ensures reproducible plan.
- Holds expiring mid-attempt: availability snapshot includes pending holds; if `attemptHold` fails, we record failure and retry with next plan.

## Testing Strategy

- Unit tests: state machine transitions, lock manager (mock Redis), strategy scoring, coordinator failure paths.
- Integration tests: end-to-end booking flow using Supabase test schema (remote staging) with mocked Redis + event bus.
- Load tests: adapt existing `scripts/ops-auto-assign-ultra-fast-loop.ts` to hammer coordinator via CLI.
- Observability validation: ensure events appear in `recordObservabilityEvent` sinks; verify assignment history writes.

## Rollout

- Feature flag `feat.assignment_pipeline_v3` gating coordinator usage; run in shadow mode with legacy auto-assign job for at least one release.
- Dual-write: record state machine + history even when legacy job confirms bookings, so rollback is easy.
- Monitoring: dashboards for lock contention, state transition latencies, assignment success rate, manual review rate.
- Kill-switch: flag to divert bookings back to legacy `autoAssignAndConfirmIfPossible` immediately.

## DB Change Plan (if applicable)

- Target envs: staging → production.
- Tables: `bookings` (new `state`, `version`, `assigned_at`, `assignment_strategy`), `booking_state_history`, `booking_assignment_attempts`.
- Backups: capture Supabase PITR bookmarks before migration; document in `artifacts/db-diff.txt`.
- Dry-run: run migrations on staging, attach diff to artifacts.
- Rollback: drop added columns/tables + revert triggers; ensure data cleanup scripts ready.
