# Implementation Plan: Sprint 2 Durability & Policy Resilience

## Objective

Deliver durable guest communication and policy-resilient capacity confirmation by replacing transient timers with a persistent queue, auto-recovering from policy drifts, and enforcing hold metadata integrity.

## Success Criteria

- [ ] Booking-created emails flow through a durable queue (with retries + DLQ) and survive worker restarts without loss (validated by tests/observability).
- [ ] Policy drift during confirmation auto-recovers within two attempts or escalates with notifications; metrics reflect recoveries/failures.
- [ ] All holds validated for required metadata; migration backfills active holds and telemetry shows zero incomplete confirmations.

## Architecture & Components

- Queue layer: add `lib/queue/redis.ts` (connection helper), `server/queue/email.ts` (producer), and worker entry `scripts/queues/email-worker.ts` using BullMQ.
- Modify `server/jobs/booking-side-effects.ts` to enqueue `pending-booking-emails` jobs instead of `setTimeout`; include idempotency guards.
- Introduce queue metrics/monitoring endpoint or integration with existing observability (pending count, failures, DLQ size).
- Capacity resilience: create `confirmWithPolicyRetry` helper (likely `server/capacity/policy-retry.ts`) orchestrating re-quote/hold recreation on `POLICY_CHANGED`.
- Notification plumbing via outbox/webhook or email for venue admins when policy drift occurs.
- Hold metadata validator module, executed before `confirmHoldAssignment`, plus Supabase migration/backfill script for active holds.

## Data Flow & API Contracts

- Email queue job payload `{ bookingId, type: 'request_received'|'confirmed'|..., scheduledFor?, attempt }`; BullMQ queue config: `attempts: 5`, exponential backoff (base 60s), DLQ routed to `pending-booking-emails:dlq`.
- Worker loads booking from Supabase at execution time, ensures status still pending before sending; acknowledges success/failure with metrics.
- Policy retry flow: detect `POLICY_CHANGED` in confirm, log drift details, fetch latest policy/adjacency, re-run quoting (max 2 cycles), recreate hold, rerun confirm; escalate if still failing.
- Admin notification triggered via outbox event containing policy hash diff and booking context.
- Hold metadata validation ensures `metadata.policyVersion`, `metadata.selection.snapshot.zoneIds`, `metadata.selection.snapshot.adjacency.edges/hash`, and table IDs exist; rejects otherwise with descriptive error.

## UI/UX States

- N/A (backend only)

## Edge Cases

- Redis/queue unavailable → fallback logging + optionally immediate send (feature-flag fallback) to avoid silent drops.
- DLQ growth indicates stuck jobs; provide manual replay script.
- Policy drift persists beyond retries -> escalate via notification, avoid infinite loops.
- Migration conflicts with concurrent hold creation; ensure transactionally safe update and re-run validator for new holds.
- Worker crash mid-job -> BullMQ retry ensures hand-off; integration test covers scenario.

## Testing Strategy

- Unit: queue helpers, metadata validator, policy retry logic, notification formatter.
- Integration: run worker against local/ephemeral Redis (or mocked ioredis) verifying retries/backoff + DLQ; simulate policy drift scenario confirming recovery; hold validation tests in capacity suite.
- E2E: script/test to enqueue job, stop worker mid-process, restart and assert email send; instrumentation verifying metrics increments.
- Accessibility: N/A

## Rollout

- Feature flag: `FEATURE_EMAIL_QUEUE_ENABLED` gates queue usage; `FEATURE_POLICY_REQUOTE_ENABLED` toggles drift auto-recovery.
- Exposure: enable in staging for at least one week to validate zero lost emails before production rollout.
- Monitoring: dashboards/alerts for queue depth, failure counts, policy drift recovery ratio, holds rejected counts.
- Kill-switch: disable feature flags to revert to prior behavior; provide DLQ drain script/documentation.
