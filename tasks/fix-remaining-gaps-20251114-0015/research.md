---
task: fix-remaining-gaps
timestamp_utc: 2025-11-14T00:23:08Z
owner: github:@amankumarshrestha
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Research: Remaining capacity gaps (A8–A12)

## Requirements

- Functional: automate hold cleanup (A8), enforce slack on manual assignments (A9), invalidate caches on table/zone changes (A10), trim allocations growth (A11), normalize error taxonomy/status codes (A12).
- Non-functional: maintain observability + runbooks, avoid regressions in planner RPCs, preserve existing Supabase policies + RLS, keep backwards compatibility for API clients.

## Existing Patterns & Reuse

- Job helpers already live in `server/jobs/*` (e.g., `auto-assign`, `outbox-worker`). Follow same structure for sweeper + archival job scripts.
- Manual selection builds check array in `server/capacity/table-assignment/manual.ts`; extend this with slack budget enforcement.
- Capacity caches implemented via `server/capacity/cache.ts`; reuse `invalidateInventoryCache` and `invalidateAdjacencyCache`.
- Observability events recorded via `recordObservabilityEvent`; use same instrumentation for new jobs.
- Supabase migrations in `supabase/migrations` use plain SQL; follow naming/time format.

## External Resources

- [Postgres partition + unique constraint limitation](https://www.postgresql.org/docs/current/ddl-partitioning.html#DDL-PARTITIONING-CONSTRAINTS) — reason we can’t range-partition `allocations` without refactoring uniqueness/PK. Opt for retention/archive strategy instead.

## Constraints & Risks

- Partitioning `allocations` is blocked by Postgres requirement that every unique/PK include partition key; current schema has `PRIMARY KEY (id)` and unique `(booking_id, resource_type, resource_id)`. Mitigation: introduce archival table + pruning job that caps live rows.
- Sweeper/archival jobs must be idempotent and safe to run in cron/queue contexts.
- Manual slack enforcement could frustrate ops if limit too strict; need configurable default (reuse selector max overage) and clear error messaging.
- Cache invalidation must remain best-effort (no throwing on cache failures) to avoid breaking mission-critical routes.

## Open Questions

- What cadence should hold sweeper + allocation pruner use? **Assumption**: ops cron runs every minute; document this.
- How much history to retain in `allocations`? **Decision**: keep 30 days live, move older data to archive table.

## Recommended Direction

1. **A8:** Build dedicated CLI (`scripts/jobs/run-hold-sweeper.ts`) that runs `runHoldSweeper`, emits observability metrics, and document cron wiring in `docs/ops/holds-stuck.md`. Add npm script for easy scheduling.
2. **A9:** Add slack budget check in manual validation using selector config’s `maxOverage` with optional env override; fail validation + surface actionable error.
3. **A10:** Create shared `invalidateRestaurantCapacityCaches()` helper and call it after table + zone mutations; unit test ensures invalidation triggered.
4. **A11:** Add archival table + pruning job (`server/jobs/allocations-pruner.ts` + CLI). Migration seeds archive table and adds supporting index. Job moves rows older than retention threshold with metrics + doc.
5. **A12:** Introduce structured error codes (e.g., `POLICY_DRIFT`, `HOLD_CONFLICT`, `ADJACENCY_MISMATCH`) and map API responses to 409 vs 422 (validation). Update schema/types + tests.
