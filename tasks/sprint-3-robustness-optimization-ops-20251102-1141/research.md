# Research: Sprint 3 — Robustness, Optimization & Ops

## Requirements

- Functional:
  - Outbox for post-commit sync and telemetry; background worker with retries.
  - In-memory caching for table inventory and adjacency per restaurant with invalidation hooks.
  - Real-time context invalidation leveraging Supabase Realtime (already present) and ensure UI gating.
  - Hold rate limits per-user per-booking; enforce minimum TTL.
  - Security negative tests for cross-tenant access on manual routes/RPCs.
  - Ops playbooks for common incident scenarios.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Improve P95 latency via cache for validate/hold.
  - Ensure idempotent, retry-safe processing via outbox.
  - No secrets in code; Supabase remote migrations only.
  - Logs and metrics via observability events.

## Existing Patterns & Reuse

- Job pattern: `server/jobs/capacity-holds.ts` sweeper with jitter/backoff.
- Telemetry: `server/capacity/telemetry.ts` via `recordObservabilityEvent`.
- Manual context realtime: `src/hooks/ops/useManualAssignmentContext.ts` uses Supabase Realtime.
- Capacity core: `server/capacity/tables.ts` with `synchronizeAssignments` and hold confirm path.

## External Resources

- Outbox pattern: DB outbox table + worker polling with exponential backoff and idempotency key.
- Supabase Realtime: table change subscriptions for UI invalidation.

## Constraints & Risks

- Supabase: remote-only migrations per AGENTS.md.
- Type drift: generated types may not have new columns; use `@ts-expect-error` sparingly.
- Background worker execution: we provide callable function; ops can wire scheduler (CRON/queue) later.

## Open Questions (owner, due)

- How often should outbox worker run in production? (DevOps, pre-release)
- Rate limit defaults acceptable for ops? (PM/DevOps, pre-release)

## Recommended Direction (with rationale)

- Implement `capacity_outbox` with unique `dedupe_key` for idempotency and retry fields.
- Enqueue outbox entries instead of direct telemetry in critical paths; worker dispatches.
- Add simple in-process cache for inventory/adjacency with explicit invalidation hooks and realtime invalidation via existing Supabase subscriptions.
- Enforce hold rate limits/min TTL via feature flags with sane defaults.
- Add basic negative tests (non-invasive) to guard cross-tenant access patterns.
