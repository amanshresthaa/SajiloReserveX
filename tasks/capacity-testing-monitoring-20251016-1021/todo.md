# Implementation Checklist

## Unit & Integration Tests

- [x] Expand `server/capacity/__tests__/service.test.ts` with override and unlimited capacity edge cases
- [x] Add retry exhaustion case to `server/capacity/__tests__/transaction.test.ts`
- [x] Create integration test for overrides in `tests/integration/capacity-api.test.ts`
- [x] Ensure booking conflict responses include metrics event assertions (mock observability)

## Load Testing Infrastructure

- [x] Add Artillery script `tests/load/capacity-load.yml` simulating ≥50 concurrent bookings
- [x] Create helper runner `tests/load/run-capacity-load.ts` (handles env, cleanup)
- [x] Document load test usage in `docs/capacity/testing-and-monitoring.md`

## Observability & Metrics

- [x] Update `server/capacity/transaction.ts` to record structured events (success/conflict/overbooking)
- [x] Create `server/capacity/metrics.ts` utility for aggregating counters
- [x] Introduce migration for `capacity_metrics_hourly` table (or equivalent storage)
- [x] Update any API routes/services to invoke metrics utility

## Alerts & Automation

- [x] Implement `server/alerts/capacity.ts` (threshold checks + notification handler)
- [x] Add secured endpoint or scheduled job `/api/internal/capacity/check-alerts`
- [x] Wire Slack/email/webhook configuration via env vars
- [x] Add documentation for alert runbook

## CI/Tooling

- [ ] Update lint/test scripts if new directories need inclusion
- [ ] Consider GitHub Action (or script) to run smoke load test (optional, behind flag)

## Verification

- [ ] Run unit + integration tests locally
- [ ] Execute load test against staging and capture report in `reports/load-tests`
- [ ] Validate metrics entries via Supabase console / SQL
- [ ] Confirm alert path triggers when thresholds breached (staging)
- [ ] Record outcomes in `verification.md`
