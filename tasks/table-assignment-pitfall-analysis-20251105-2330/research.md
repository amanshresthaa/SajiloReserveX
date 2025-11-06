# Research: Table Assignment Pitfall Analysis

## Requirements

- Functional:
  - Automatically assign restaurant tables to newly created bookings, update booking status, and trigger guest communications without manual intervention.
  - Maintain temporary holds while evaluating candidate plans to prevent double-booking and enforce assignment consistency.
  - Support both inline assignment during booking creation and background job retries for resiliency.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Sub-second inline assignments to avoid API latency spikes; background retries bounded to protect database load.
  - High reliability and observability through structured event logging for monitoring and RCA.
  - Strong concurrency guarantees via advisory locks and exclusion constraints to prevent conflicting assignments.

## Existing Patterns & Reuse

- Inline auto-assign path in `src/app/api/bookings/route.ts` triggers quoting and confirmation within a 4s SLA before falling back to async job @src/app/api/bookings/route.ts#755-849.
- Background job `autoAssignAndConfirmIfPossible` handles retries, cutoff enforcement, observability events, and email side-effects @server/jobs/auto-assign.ts#20-208.
- Core capacity planner (`quoteTablesForBooking`, `buildScoredTablePlans`, hold management) encapsulated in `server/capacity/*.ts`, leveraging feature flags and strategic config for behaviour tuning @server/capacity/tables.ts#3092-3402, @server/capacity/selector.ts#156-466, @server/capacity/holds.ts#96-136.
- Database enforcement via `assign_tables_atomic_v2` RPC and associated migrations documented in `docs/table-assignment-business-rules.md` for transactional guarantees @docs/table-assignment-business-rules.md#124-161.

## External Resources

- `docs/table-assignment-business-rules.md` — comprehensive catalogue of DB constraints, feature flags, and operational policies underpinning assignments.
- Supabase schema migrations under `supabase/migrations/` — authoritative source for stored procedures and constraints referenced by the allocator.
- Observability events emitted via `recordObservabilityEvent` for analytics dashboards and alerting.

## Constraints & Risks

- Feature flag sprawl governs critical behaviours (lookahead, holds, combinations); misconfiguration can materially change assignment quality @server/feature-flags.ts#32-137.
- Strict hold conflict enforcement optional; when disabled, relies on application-level checks that may race under load @server/capacity/tables.ts#3368-3402.
- Scarcity and demand multipliers cached (30s–5m), introducing short-term staleness after operational changes @docs/table-assignment-business-rules.md#332-354.
- Retry loop bounded by start-time cutoff; late bookings may never receive automated confirmation if cutoff windows misaligned with operations @server/jobs/auto-assign.ts#70-199.

## Open Questions (owner, due)

- Q: Do we have production telemetry on assignment latency, success rate, and reassignment frequency? (Owner: Ops Analytics, Due: 2025-11-08)
  A: Pending — analytics queries not yet gathered.
- Q: Are strict hold conflicts enabled in production environments by default? (Owner: Platform Infra, Due: 2025-11-07)
  A: Pending confirmation from infra team.

## Recommended Direction (with rationale)

- Collect quantitative telemetry (success/failure rates, latency, reassignment churn) before modifying algorithm to ensure evidence-based prioritization.
- Evaluate feature flag defaults and governance to reduce configuration drift across environments.
- Prioritize analysis of load balancing, matching accuracy, and failure recovery given their direct impact on customer experience and operational load.
