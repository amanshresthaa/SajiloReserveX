---
task: booking-architecture
timestamp_utc: 2025-11-12T23:49:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Booking Assignment Architecture

## Requirements

- Functional:
  - Orchestrate the lifecycle of a booking from creation through confirmation using an auditable, strongly-typed state machine with automated/manual paths.
  - Provide a smart assignment engine that can evaluate multiple strategies (exact fit, adjacency, zone preference, historical success) and persist the winning plan with holds and confirmations.
  - Maintain real-time table availability snapshots that consider confirmed bookings, active holds, and pending assignments, and expose them to downstream services.
  - Introduce resiliency primitives (distributed locking, circuit breaker, rate limiting, retries) to avoid duplicate processing, thundering herds, or cascading failures.
  - Supply a background optimizer that can re-evaluate a day’s plan, suggest reassignments, and apply them when the benefit crosses a defined threshold.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Availability ≥ 99.9% for booking confirmation paths; P95 booking→assignment latency ≤ 3s; background optimizer can run within 5 minutes per venue.
  - Compatibility with existing Supabase schema + remote-only migrations (§6); all secrets remain in env-managed stores.
  - Observability hooks (structured logs, metrics, traces) for each pipeline segment; support debuggable history for ops teams.
  - Localization-ready notifications and error surfaces in Ops UI; maintain WCAG-compliant status messaging for any new UI surfaced later (§5).

## Existing Patterns & Reuse

- `config/booking-state-machine.ts:1` and `src/lib/booking/state-machine.ts:1` already encode a shared transition matrix plus helpers (`validateTransition`, `getTransitionMatrix`). We can extend the config with the richer lifecycle and continue reusing the helper module for both client + server validation.
- `src/services/ops/bookings.ts:1` centralizes Ops booking HTTP calls (holds, quotes, manual assignment) and already exposes types for heatmaps, assignment contexts, etc. The new coordinator can lean on these DTOs for compatibility with existing dashboards while we evolve the backend APIs.
- Supabase migrations under `supabase/migrations` define `bookings`, `table_assignments`, and history tables. Rather than inventing new stores, we can append columns (e.g., `state_version`, `assignment_strategy`, `hold_id`) and add new normalized tables such as `booking_state_history` to record transitions.
- The repo already contains job orchestration utilities (see `scripts/route-scanner.js` and `server` workers) that use pnpm + ts-node targets; we can piggyback on the same tooling for the assignment coordinator worker and optimization service.

## External Resources

- [Redis Labs – Distributed locks with Lua scripts](https://redis.io/docs/latest/develop/use/patterns/distributed-locks/) — baseline for the lock acquisition/release semantics we need in the DistributedLockManager.
- [Martin Fowler – Circuit Breaker pattern](https://martinfowler.com/bliki/CircuitBreaker.html) — informs the circuit breaker boundaries and fallback flows referenced in the AssignmentCoordinator.
- [Google SRE Workbook – Event-driven pipeline reliability](https://sre.google/workbook/monitoring-distributed-systems/) — guidance for the observability requirements and budget definitions we’re targeting.

## Constraints & Risks

- Supabase is remote-only (§6); schema changes must follow the expansion→backfill→contraction plan with artifacts (`artifacts/db-diff.txt`).
- Current Ops UI expects a small, linear status set; expanding it without feature flags could break filters (`src/hooks/ops/useOpsBookingsTableState.ts`).
- Introducing distributed locks and circuit breakers adds infrastructure dependencies (Redis, message bus). We must document HA expectations and fallbacks if these services degrade.
- ML-informed strategies imply storage of historical success metrics; privacy constraints require aggregation/anonymization before persisting.
- Manual review workflows need authorization updates to ensure only privileged ops staff can transition bookings out of `manual_review`.

## Open Questions (owner, due)

- Q: Which event bus (Supabase Realtime, RabbitMQ, SNS/SQS, etc.) is sanctioned for cross-service notifications?  
  A: Pending architecture decision — Owner: @maintainers, Due: 2025-11-15.
- Q: Do we need multi-tenant partitioning per restaurant brand, or can we shard by restaurant_id only?  
  A: Awaiting product direction — Owner: @product, Due: 2025-11-18.
- Q: Is there an SLA for assignment retries before forcing manual review?  
  A: Need ops input — Owner: @ops-lead, Due: 2025-11-14.
- Q: What telemetry stack should receive assignment/capacity metrics (existing DataDog dashboards vs. new Grafana)?  
  A: Pending SRE sync — Owner: @sre, Due: 2025-11-16.

## Recommended Direction (with rationale)

- Expand the shared state machine to align with the detailed lifecycle (created → capacity_verified → assignment_pending → assignment_in_progress → assigned/confirmed/manual_review). Rationale: keeps both client + server in lockstep and ensures Ops dashboards can reason about every automated step.
- Introduce a BookingStateMachine service backed by versioned writes (optimistic locking) plus `booking_state_history` records. This gives auditable transitions and enables replay/testing.
- Adopt an event-driven assignment coordinator that consumes `booking.*` events, acquires distributed locks per booking, coordinates the SmartAssignmentEngine, and emits success/failure events. This decouples the API write path from heavy assignment logic and improves horizontal scalability.
- Build a pluggable SmartAssignmentEngine (strategy list supplied in PRD) with scoring + telemetry hooks so we can experiment with new heuristics/ML without redeploying the coordinator core.
- Maintain a TableAvailabilityTracker backed by cached snapshots plus Pub/Sub invalidation so Ops UI and coordinators share a single truth for occupancy.
- Schedule a background OptimizationService to run daily/per shift, evaluating improvements >10% before reassigning to avoid churn. Results feed into ops alerts + ML training loops.
- Wrap the entire flow with observability (metrics for lock contention, assignment success, retries, timeouts) and resilience patterns (circuit breaker, exponential backoff, manual review failover) so incidents stay bounded.
