# Research: Sprint 2 Durability & Policy Resilience

## Requirements

- Functional:
  - Implement durable queue-based email delivery with retries and DLQ.
  - Auto-recover from policy drift during hold confirmation.
  - Enforce hold metadata completeness prior to confirmation.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Reliability across restarts; observability for queue and policy recovery metrics.
  - Ensure no PII leaked via logs/new telemetry.

## Existing Patterns & Reuse

- Email side-effects handled in `server/jobs/booking-side-effects.ts`; defers "request received" email via `setTimeout`, relying on in-memory timers (lost on restarts).
- Email sending utilities live in `server/emails/`; existing `sendBookingConfirmationEmail` etc. handle templating and Resend integration.
- Observability uses `recordObservabilityEvent` (see `server/observability.ts`) and StatsD-like metrics elsewhere; outbox worker pattern exists (`server/jobs/outbox-worker.ts`) for durable messaging.
- Capacity allocator logic is in `server/capacity/tables.ts`; `confirmHoldAssignment` already throws `AssignTablesRpcError` with code `POLICY_CHANGED` when policy hash/snapshot diverges.
- Hold selection snapshot currently optional; code only validates when present, so metadata enforcement must tighten this path.
- Feature flag helpers (in `env.featureFlags`) already expose defer minutes for auto-assign emails, which we can reuse for queue scheduling.

## External Resources

- BullMQ (Redis-backed) fits Node environment; Upstash Redis env vars already defined in `config/env.schema.ts` (REST API, not standard redis://) – need to evaluate compatibility or alternate queue (e.g., Supabase functions? AWS SQS?).
- Existing tasks/docs reference durable outbox patterns (`server/jobs/outbox-worker.ts`) – could leverage similar architecture for queue worker CLI process.

## Constraints & Risks

- No existing Redis connection helper; adopting BullMQ requires Redis-compatible endpoint (Upstash REST URL needs `ioredis` with token) – confirm credentials available.
- Worker process must run outside Next.js API routes (likely via separate script) and align with deployment infrastructure.
- Re-quoting on policy change must avoid infinite loops and race conditions with existing holds; ensure transactional integrity with new atomic confirm path from Sprint 1.
- Additional Supabase migrations (hold snapshot backfill) must adhere to remote-only rule; need careful rollout to avoid locking tables.
- Email queue must ensure idempotency to prevent duplicate sends when retries occur; rely on booking id + email type dedupe.

## Open Questions (owner, due)

- Q: Which durable queue backend is approved (Redis/BullMQ, AWS SQS, or existing infrastructure)? (Owner: Infra, before implementation)
- Q: Can we provision Redis credentials (UPSTASH Redis token) in deployed environment for worker + API? (Owner: DevOps, before queue integration)
- Q: Preferred notification channel for policy drift (webhook endpoint vs email service)? (Owner: Capacity PM, before implementation)

## Recommended Direction (with rationale)

- Adopt BullMQ with Upstash Redis (if acceptable) for durability; encapsulate queue producer helper in `server/queue/email.ts` and worker in new script (`scripts/queues/email-worker.ts`). Configure retries/backoff per acceptance criteria and expose metrics endpoints.
- Refactor booking side-effects to enqueue jobs instead of `setTimeout`, persisting job metadata (booking id, email type, delay). Implement DLQ (BullMQ separate queue) for 5+ failures with alert logging.
- Extend `confirmHoldAssignment` with retry wrapper `confirmWithPolicyRetry` that re-quotes upon `POLICY_CHANGED`, re-creates hold, and limits attempts to 2; log drift details and fire admin notification via new webhook/email service.
- Implement hold metadata validator ensuring presence of policy hash, table ids, and selection snapshot fields; add migration/backfill script for active holds.
- Add observability (metrics counters + events) for queue stats, policy drift recoveries/failures, and hold metadata rejects to reach success metrics.
