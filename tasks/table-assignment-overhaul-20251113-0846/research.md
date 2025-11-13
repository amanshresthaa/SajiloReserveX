---
task: table-assignment-overhaul
timestamp_utc: 2025-11-13T08:49:12Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Research: Table Assignment Overhaul

## Requirements

- Functional:
  - Replace the existing synchronous quoting/assignment code (`server/jobs/auto-assign.ts`, `server/capacity/table-assignment/*`) with the proposed event-driven pipeline that orchestrates booking states, distributed locking, and a pluggable smart assignment engine.
  - Persist new booking state history, assignment attempts, and telemetry so that retries and manual review flows can act on durable signals.
  - Integrate the coordinator with current APIs (`/api/ops/bookings`, `/api/staff/auto`, `/api/staff/manual`) without breaking the UI contract for ops tooling.
  - Maintain existing capabilities (holds, manual overrides, quoting, email notifications) while enabling future ML-driven strategies.
- Non-functional (a11y/perf/security/privacy/i18n):
  - Strong concurrency control: at-most-once assignment per booking via distributed locks + optimistic versioning.
  - Observability hooks (metrics, logs, events) for each state transition and assignment attempt.
  - Backward-compatible telemetry for the auto-assign jobs and ops dashboards.
  - Remote-only Supabase interactions, respecting existing schema + security policies.
  - Scalable design for multi-restaurant, high-volume runs (background workers, eventually consistent caches).

## Existing Patterns & Reuse

- `server/capacity/table-assignment/assignment.ts` already bundles confirm/hold logic, Supabase RPC sync, and policy drift handling—some utilities (idempotency keys, payload checksum) can be reused inside the new state machine transitions.
- `server/jobs/auto-assign.ts` implements the current retry loops and Supabase lookups; pieces like planner cache integration, strategic settings, and email notifications should be wrapped instead of rewritten.
- `server/capacity/v2` ships `AssignmentOrchestrator`, repository interfaces, and deterministic commit utilities—ideal foundations for the smart assignment engine contract.
- `server/outbox.ts` + `recordObservabilityEvent` already provide event bus/outbox semantics we can extend for the booking state events.
- `scripts/ops-auto-assign-ultra-fast-loop.ts` demonstrates batching + sequential retry logic for CLI loops that we can map to the coordinator’s rate limiter + scheduling hooks.

## External Resources

- [`VISUAL_ARCHITECTURE.md`](VISUAL_ARCHITECTURE.md) — reinforces the current backend deployment topology, ensuring the new services land in the right layer.
- [`SUPABASE_SCHEMA_EXPORT_GUIDE.md`](SUPABASE_SCHEMA_EXPORT_GUIDE.md) — documents remote-only migration workflows we must follow when altering tables/state history.
- Provided architecture brief (chat task description) — authoritative target design for state machine, lock manager, smart strategies, coordinator, availability tracker, optimization service.

## Constraints & Risks

- Supabase: production-only schema changes require backup/rollback plans; migration windows must be documented (per AGENTS §6).
- UI contracts: `/api/ops/bookings/:id/tables` and manual assignment endpoints cannot regress; they expect immediate JSON responses.
- Reliability: new async pipeline introduces eventual consistency; we must guarantee deterministic retries and manual-review fallbacks to avoid stranded bookings.
- Performance: scoring strategies + availability snapshots might be expensive; caching windows must not serve stale data longer than 1s or double-book tables.
- Security: distributed lock service (Redis) introduces new infrastructure; credentials must remain in env vars, never in source.
- Testing: large refactor touches core booking flows, requiring extensive unit + integration + load testing before release.

## Open Questions (owner, due)

- Q: Which Redis cluster / provider powers the distributed lock manager? (owner: platform, due: before implementation phase)
  A: TBD — need confirmation of available infrastructure or a managed alternative (Upstash?).
- Q: Do we maintain legacy auto-assign job as fallback during rollout? (owner: eng lead, due: during planning) — may need dual-run/shadow mode.
- Q: What schema changes (state history, assignment_attempts, holds) are required, and who approves migrations? (owner: DB maintainer, due: pre-implementation).
- Q: How will ML-based `HistoricalSuccessStrategy` source features? (owner: data/ML team, due: before enabling strategy in prod).

## Recommended Direction (with rationale)

1. **Introduce a first-class booking state machine module** that wraps Supabase transactions + history table writes; reuse `computePayloadChecksum` style utilities for concurrency safety.
2. **Add a distributed locking abstraction** that targets Redis (configurable) with Lua scripts for release/extend as outlined, ensuring compatibility with existing Node runtime.
3. **Implement the smart assignment engine** by composing existing planner logic with the new strategy interface; start with deterministic strategies (optimal fit, adjacency, zone preference, load balancing) and stub the ML-backed strategy behind a feature flag.
4. **Build the assignment coordinator** as a worker-safe orchestrator (possible Next.js route handler/queue job) that consumes booking events, enforces rate limits per restaurant, cooperates with circuit breaker + retries, and records success/failure metrics.
5. **Expose a real-time availability tracker** backed by Supabase queries + in-memory LRU (reuse `server/capacity/cache.ts`), broadcasting snapshots to interested clients (UI + engine).
6. **Schedule a background optimization service** (cron/queue job) that runs daily to rebalance assignments using new optimizer heuristics, gated by >10% improvement thresholds.
7. **Plan migrations + rollout**: dual-run coordinator alongside legacy job (shadow mode) with observability instrumentation; once stable, retire old code paths.
