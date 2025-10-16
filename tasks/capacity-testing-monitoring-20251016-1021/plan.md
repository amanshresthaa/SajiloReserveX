# Implementation Plan: Capacity Testing & Monitoring

## Objective

We will harden the capacity engine with automated tests, load simulations, and production-grade observability so we can detect and prevent overbooking regressions under real-world load.

## Success Criteria

- [ ] Unit tests cover critical CapacityService branches (overrides, null configs, retry failures) with >90% statement coverage.
- [ ] Load test simulating ≥50 concurrent booking create requests completes without overbooking and reports metrics.
- [ ] Automated verification detects race conditions (zero bookings recorded beyond configured capacity).
- [ ] New metrics emitted for booking success rate, capacity utilization, and conflict frequency, visible in observability dashboard.
- [ ] Alerting in place for overbooking incidents and high conflict rates.

## Architecture & Components

- **Unit tests**: Expand `server/capacity/__tests__/service.test.ts` & `transaction.test.ts`; add new spec for overrides & retry exhaustion.
- **Integration tests**: Extend `tests/integration/capacity-api.test.ts` or add new spec focusing on overrides and conflict responses.
- **Load testing**: Introduce Artillery config under `tests/load/capacity-load.yml` plus helper script `tests/load/run-capacity-load.ts` (wrap CLI, handle environment vars).
- **Observability**:
  - Update `server/capacity/transaction.ts` to emit structured events for result status (success/overbook/conflict).
  - Add new metrics aggregator utility `server/capacity/metrics.ts` for counters (persist in Supabase or observability_events).
  - Scheduled job/cron (Supabase Edge Function or Next.js route) to evaluate metrics & trigger alerts.
- **Alerts**: Implement `server/alerts/capacity.ts` to encapsulate threshold checks and send notifications (email/webhook; integrate with existing support alias if available).

## Data Flow & API Contracts

- **Load Test Setup**
  - Environment variables: `LOAD_TEST_RESTAURANT_ID`, `LOAD_TEST_SERVICE_KEY`, `LOAD_TEST_BASE_URL`.
  - Artillery scenario: sequential ramp-up of 50 users hitting `POST /api/bookings` with unique `Idempotency-Key`. Validate responses and totals via afterHook calling Supabase to count bookings.
  - Output: JSON report saved under `reports/load-tests/<timestamp>.json`.

- **Metrics Recording**
  - Extend `recordObservabilityEvent` usage: include `eventType` = `booking.success`, `booking.capacity_exceeded`, `booking.retry_exhausted`, `booking.overbook_prevented` with metadata (restaurantId,date,time,attempts).
  - Optionally, create new table `capacity_metrics_hourly` (migration) storing aggregated counters; update via background job.

- **Alerts Trigger**
  - API/cron endpoint `/api/internal/capacity/check-alerts` (secured) computing thresholds: e.g., any `booking.overbook_detected > 0`, or `booking.conflict_rate > 5% per hour`.
  - Notifications: send to Slack webhook or email depending on infra config (config via env).

## UI/UX States

- Not UI-driven, but developer tooling: create README updates for running load tests, interpreting reports, and monitoring dashboards.

## Edge Cases

- Load test cleanup: ensure bookings created are flagged (e.g., custom `source` value) and deleted post-run to avoid polluting analytics.
- Retry exhaustion: simulate by mocking Supabase RPC to throw serialization errors > retries; ensure metrics capture failure path.
- Rate limiting: tests should respect API rate limits; incorporate pacing/delay to avoid 429 except when purposely testing limit behavior.
- Multi-tenant: ensure metrics keyed by restaurantId so alerts are scoped correctly.

## Testing Strategy

- **Unit**: new cases for override precedence, unlimited capacity, alternative slot generation boundaries, retry exhaustion, metrics logging.
- **Integration**: scenarios where capacity hits limit, verifying conflict response & metrics insertion; run against staging Supabase.
- **Load**: Artillery run at least daily in CI (flagged), with guard to skip on forks/local unless explicitly enabled.
- **Regression**: add GitHub workflow (if permitted) to run unit tests + load smoke (reduced concurrency) per PR.

## Rollout

- Draft documentation (`docs/capacity/testing-and-monitoring.md`) for ops/eng.
  - Include how to run load tests, interpret results, and thresholds for alert triage.
- After implementation, run load test on staging, capture results in `reports/` and attach to PR.
- Enable alerts gradually: start with staging notifications → once validated, point to production channel.
