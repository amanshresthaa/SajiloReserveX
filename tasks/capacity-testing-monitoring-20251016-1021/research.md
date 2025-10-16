# Research: Capacity Testing & Monitoring

## Existing Patterns & Reuse

- Unit coverage for capacity logic exists in `server/capacity/__tests__/service.test.ts` and `transaction.test.ts`, focusing on base scenarios and retry logic; edge cases (overrides, max parties, no periods) remain sparse.
- Integration coverage via `tests/integration/capacity-api.test.ts` hits `/api/availability` and booking APIs using Supabase service key; provides a template for additional concurrency/timeout tests.
- The transaction layer emits observability events through `recordObservabilityEvent` (`server/observability.ts`); metrics pipeline currently inserts rows into `observability_events` but lacks aggregate metrics (no counters for booking success/conflict).
- Load testing harness not yet present—`tests/load` directory is empty. Need to introduce k6/Artillery scripts respecting AGENTS instructions (remote Supabase only).
- Booking RPC enforces capacity via `server/capacity/transaction.ts` and `supabase` RPC `create_booking_with_capacity_check`; concurrency tests should exercise this path.

## External Resources

- Supabase rate limits + remote-only rule (AGENTS §7): load tests must target staging/prod instance cautiously; require coordination and throttling.
- Observability/alerts guidelines likely align with existing incident response tooling (not defined here); may leverage Supabase functions or external monitoring (PagerDuty/Grafana) depending on infra team.

## Constraints & Risks

- Running 50 concurrent bookings could trigger real Supabase limits or duplicate data; tests must isolate to dedicated restaurant/test data and clean up.
- Need idempotent load script to avoid violating remote-only policy—should simulate but not exceed safe thresholds; consider configurable concurrency.
- Metrics addition must not slow down hot path; prefer async/event-driven or batched inserts.
- Alerting requires destination (Slack/Webhook). If not established, document placeholder and coordinate with ops.

## Open Questions (and answers if resolved)

- Q: Where to store new metrics?  
  A: Likely `observability_events` or dedicated tables (e.g., `capacity_metrics_daily`). Need migration if new tables required.
- Q: Preferred load-test tool?  
  A: Not specified; Artillery already referenced in Story 4 checklist, so reuse it.
- Q: How to monitor alerts?  
  A: Add server-side cron/Supabase Edge function or external scheduled job to query metrics and trigger webhook; confirm with platform team.

## Recommended Direction (with rationale)

- Expand unit tests covering: overlapping overrides, null capacity combos, serialization failure classification, retry exhaustion, and alternative slot generation boundaries.
- Build an Artillery (or k6) scenario hitting `/api/bookings` concurrently with 50 requests using distinct idempotency keys; verify responses and that total successes match capacity.
- Add helper utilities to query post-test booking counts to assert no overbooking; integrate into CI pipeline with environment guard.
- Enhance observability by instrumenting booking success/conflict/override metrics: record structured events and update aggregated counters (new table or materialized view) for dashboards.
- Implement alerting by creating an API/cron task that checks metrics (e.g., conflicts per hour, overbooking flag) and triggers notifications when thresholds exceeded.
