---
task: fix-remaining-gaps
timestamp_utc: 2025-11-14T00:23:08Z
owner: github:@amankumarshrestha
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Stub Supabase migration for allocations archive + pruner function.
- [ ] Add task-specific env knobs (retention days, sweeper interval) if needed.

## Sweeper + Archival Jobs (A8 & A11)

- [x] Enhance `runHoldSweeper` with observability summary + exported CLI script + npm script.
- [x] Update `docs/ops/holds-stuck.md` with cron/runbook + SLO references.
- [x] Add `allocations_archive` table + move/prune function via migration.
- [x] Implement `server/jobs/allocations-pruner.ts` + CLI runner + docs.

## Manual Slack Enforcement (A9)

- [x] Introduce helper to compute allowed slack (selector config + override).
- [x] Extend manual validation to add slack check + tests.
- [x] Ensure error surfaces to manual APIs (manual validate/hold/confirm routes) as 422.

## Cache Invalidation (A10)

- [x] Create helper to invalidate capacity caches for a restaurant.
- [x] Call helper after table insert/update/delete + zone mutations.
- [x] Add targeted unit tests for invalidation triggers.

## Error Taxonomy & Status Codes (A12)

- [x] Expand `AssignTablesRpcError` usage to map new codes (POLICY_DRIFT, HOLD_BOOKING_MISMATCH, SLACK_BUDGET_EXCEEDED, etc.).
- [ ] Update staff confirm APIs to translate codes → HTTP status (409 vs 422) + add Location header on idempotent duplicates if applicable.
- [x] Update tests (manualConfirm, API route tests) to cover new responses.

## Verification

- [ ] Unit + integration tests (manual validation, confirm routes, ops tables).
- [ ] Lint/typecheck if time allows.
- [ ] Capture evidence in `verification.md` (CLI output, logs, reasoning).
