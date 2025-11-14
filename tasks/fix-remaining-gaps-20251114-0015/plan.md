---
task: fix-remaining-gaps
timestamp_utc: 2025-11-14T00:23:08Z
owner: github:@amankumarshrestha
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Implementation Plan: Close remaining capacity gaps

## Objective

Deliver production-ready fixes for the outstanding risks (A8–A12): automate hold cleanup, block oversized manual assignments, ensure cache invalidation after edits, keep allocations table lean via archival, and normalize confirm API error contracts.

## Success Criteria

- [ ] Scheduled sweeper script + instrumentation shipped with docs.
- [ ] Manual validation rejects selections exceeding slack budget; clear error messaging + tests.
- [ ] Table/zone mutations invalidate caches automatically; regression tests cover insert/update/delete.
- [ ] Allocation archival job + SQL schema support live retention + metrics; documentation updated.
- [ ] Confirm API returns structured codes with correct HTTP status (409 conflicts vs 422 validation) + tests.

## Architecture & Components

- **Jobs/CLI:** `server/jobs/capacity-holds.ts`, new `scripts/jobs/run-hold-sweeper.ts`, new `server/jobs/allocations-pruner.ts`, and `scripts/jobs/run-allocations-pruner.ts`.
- **Manual validation:** `server/capacity/table-assignment/manual.ts`, `server/capacity/table-assignment/utils.ts` for slack summary, new helper to compute allowed slack (maybe reusing `getSelectorScoringConfig`).
- **Cache invalidation:** new `server/ops/capacity-cache.ts` helper imported by `server/ops/tables.ts` + `server/ops/zones.ts` and API routes touching same logic.
- **DB Migration:** new SQL migration to create `allocations_archive` table + index and optional view? plus `allocations_prune_history` function for server job to call.
- **Error taxonomy:** `server/capacity/table-assignment/types.ts`, `server/capacity/table-assignment/assignment.ts`, `src/app/api/staff/auto/confirm/route.ts`, `src/app/api/staff/manual/confirm/route.ts`, tests in `tests/server/capacity/manualConfirm.test.ts` + API tests.

## Data Flow & API Contracts

- Sweeper CLI obtains service-role supabase client, runs `runHoldSweeper`, and posts `recordObservabilityEvent` summary. Cron triggers `pnpm jobs:hold-sweeper`.
- Archival job queries allocations older than retention threshold, moves them into `allocations_archive`, deletes originals, and emits telemetry.
- Manual selection returns Slack check entry; API surfaces 422 with structured code `SLACK_BUDGET_EXCEEDED`.
- Confirm API returns JSON `{ error, code, details }` with HTTP 422 for validation (drift, adjacency, slack) and 409 for conflicts/reservations; Policy drift uses new `POLICY_DRIFT` code.

## Edge Cases

- Sweeper CLI should exit cleanly when no holds exist and log zero counts.
- Slack enforcement must respect multi-table merges: slack = total capacity - party size.
- Cache invalidation should never throw; wrap in try/catch to avoid breaking write paths.
- Allocations pruning must run in small batches to avoid long locks; limit + loop with jitter.
- Error mapping must preserve 404 for missing holds and 500 fallback for unknown errors.

## Testing Strategy

- Unit tests for manual validation slack error and new helper.
- Tests for confirm route ensuring HTTP status mapping + codes.
- Table ops tests verifying invalidation helper invoked.
- Job tests using mocked Supabase clients verifying events + metrics payload.
- Migration verification via `supabase db diff` (not run here) + ensure schema snapshot updates.

## Rollout

- Feature flag not required; changes safe by default.
- Document cron setup + retention runbook in `docs/ops/holds-stuck.md` and new `docs/ops/allocations-archival.md` (if needed).
- Monitor observability events for `hold_sweeper.run` + `allocations.pruned` after deploy.
- Backfill archive table by running pruner once manually post-deploy.

## DB Change Plan

- Create `public.allocations_archive` + indexes; no partition conversion due to PK/unique constraint conflict (documented in migration comment).
- Add SQL function `public.move_expired_allocations(batch_limit integer, cutoff_days integer)` for pruner job, returning (#moved, #deleted) stats.
- Migration includes rollback instructions (drop new table/function) if needed.
