# Implementation Plan: Time-Overlap Safety & Schema Hardening

## Objective

Deliver Sprint 1 Outcomes (“Hard Guarantees & Algorithm Correctness”): prevent overlapping assignments/holds via database constraints, harden hold hygiene, align schema/indexes for high-concurrency reads, fix allocator rule regressions, and introduce an atomic confirm RPC plus verification tooling.

## Success Criteria

- [ ] Generated range columns and GiST indexes exist for `booking_table_assignments`/`table_hold_windows`; exclusion constraints created `NOT VALID`, validated post-cleanup; overlap insert now fails (acceptance test).
- [ ] Hold hygiene guardrails (`expires_at >= end_at`, duplicate member rejection) enforced and validated; composite FK for table capacities works; hot-path btree/GiST indexes created.
- [ ] Allocator behavior matches business rules (lookahead no longer over-penalizes combos, merged-set capacity enforced, adjacency map immutable, lunch overruns config-driven, zone gating consistent); regression tests cover scenarios.
- [ ] `confirm_hold_assignment_tx` RPC performs hold validation, assignments, allocations, idempotency ledger upsert (with checksum/range), transactional outbox insert, and hold release atomically; TypeScript paths use RPC; duplicate idempotency requests return deterministic result.
- [ ] Lint/tests (unit + integration + new pg/Node tests) pass locally and capture concurrency/overrun cases; verification.md documents QA plus constraint validation evidence.

## Architecture & Components

- **Database layer (Supabase/Postgres)**:
  - New migration(s) adding generated columns, GiST indexes, exclusion constraints, check constraints, composite FK updates, and transactional RPC.
  - Index/constraint creation split into transactional vs concurrent files (due to `CREATE INDEX CONCURRENTLY` limitations).
  - Backfill scripts (SQL views + optional Node script) placed under `scripts/` referencing `booking_table_assignments` & `table_hold_windows`.
- **Server capacity module**:
  - `server/capacity/table-assignment/availability.ts`: extend `filterAvailableTables`, `applyLookaheadPenalties`, adjacency map usage, and options typing.
  - `server/capacity/table-assignment/manual.ts`: adjust validator for merged capacity + zone/time rules.
  - `server/capacity/table-assignment/quote.ts`: propagate `allowMaxPartySizeViolation`, zone restrictions, and adjacency immutability; plan building uses updated config.
  - `server/capacity/table-assignment/assignment.ts`: replace orchestrator path with RPC, ensure idempotency ledger/outbox updates removed from app layer (RPC handles).
  - Config/policy modules (`server/capacity/policy.ts`, `server/capacity/v2.ts` as needed) to add `policy.services.<service>.lunch.allowOverrun` or `serviceClamp` reading.
- **RPC definition**:
  - `supabase/functions`? Actually stored procedure under `supabase/migrations`, returning inserted rows with `id`, `table_id`, `assignment_window`.
  - Grants for `service_role`.
- **Testing harness**:
  - Extend `tests/server/capacity` (lookahead, filter, manual) plus new concurrency tests (maybe using `vitest`/`node:worker_threads` to race `confirm_hold_assignment_tx` via mocked client).
  - Add SQL-level test script or `pgTAP` under `supabase/tests` (if infrastructure exists) verifying overlap constraints reject duplicates.

## Data Flow & API Contracts

- **Range columns**: `assignment_window := tstzrange(start_at, end_at, '[)')`. computed by DB, no client writes.
- **Exclusion constraints**:
  - `booking_table_assignments`: `EXCLUDE USING gist (table_id WITH =, assignment_window WITH &&) WHERE (table_id IS NOT NULL)`.
  - `table_hold_windows`: `EXCLUDE USING gist (table_id WITH =, hold_window WITH &&)` renamed to `thw_no_overlap`.
- **Atomic RPC**:
  - Signature (draft): `confirm_hold_assignment_tx(p_hold_id uuid, p_booking_id uuid, p_table_ids uuid[], p_idempotency_key text, p_assigned_by uuid, p_require_adjacency bool, p_policy_version text, p_transition booking_status, ...) RETURNS TABLE(table_id uuid, assignment_id uuid, start_at timestamptz, end_at timestamptz, merge_group_id uuid)`.
  - Steps inside transaction:
    1. Validate hold metadata snapshot/policy version; load booking + window.
    2. Upsert `booking_table_assignments` (insert new rows, update start/end + range), linking to allocations.
    3. Update `allocations` window and ensure resource rows exist (insert missing).
    4. Upsert `booking_assignment_idempotency` row: `table_ids uuid[]`, `assignment_window tstzrange`, `payload_checksum text`, `merge_group_allocation_id`.
    5. Insert into `outbox` table `capacity.assignment.sync`.
    6. Release hold rows + `table_hold_members`.
  - Return values consumed by TypeScript to confirm assignments + update UI.

## UI/UX States

- No direct UI modifications planned; manual QA still ensures admin/reservation flows unaffected. Any future UI toggles (zone gating) rely on existing states (loading/empty/error).

## Edge Cases

- Holds or assignments with NULL `start_at` / `end_at`: generated range will be NULL -> constraint skip; need precheck script to detect & remediate.
- `table_id` may be NULL for unassigned records; `WHERE (table_id IS NOT NULL)` ensures constraint does not block such rows.
- Backfill might detect overlapping rows; plan for manual remediation steps (disable conflicting assignments or adjust windows). Document in `todo.md`.
- RPC failure mid-transaction should roll back outbox + ledger; need to test network/timeouts and concurrency (two holds for same table) to ensure one fails.
- Lunch overrun config must default to current behavior (special-case lunch allowed). Provide fallback for restaurants without `policy.services.lunch`.
- Adjacency map immutability: ensure we clone map per invocation or treat adjacency as `ReadonlyMap` to avoid memory/perf issues.
- same-zone rule: ensure zone fallback logic handles missing zone_id gracefully (should throw or require snapshot).

## Testing Strategy

- **Unit/Vitest**:
  - `filterAvailableTables` spec for `allowMaxPartySizeViolation`, adjacency map immutability (assert original map unchanged), zone filtering.
  - `applyLookaheadPenalties` scenario verifying new flag prevents false positives.
  - `summarizeSelection`/manual validator ensures capacity check catches insufficient merged capacity and no per-table max gating.
  - `computeBookingWindowWithFallback` tests for lunch overrun config.
- **Integration**:
  - Add concurrency test hitting new RPC via mocked `DbClient` or `node-postgres` (simulate two calls same table/time -> second fails with constraint).
  - SQL/pgTAP verifying `bta_no_overlap` rejects overlaps, `th_times_consistent` check, `thm_unique` enforcement, unique index for hold members.
  - jsdom/E2E? Not needed for backend-only change, but we can extend existing `tests/server/capacity/lookahead.scenario.test.ts`.
- **Schema validation**:
  - Write SQL script (under `supabase/utilities`) to `SELECT COUNT(*)` of rows with null `assignment_window` & `hold_window`.
  - Document `ALTER TABLE ... VALIDATE CONSTRAINT` runbook in `verification.md`.
- **Lint/Type-check**:
  - `pnpm lint`, `pnpm test`, `pnpm test --filter capacity` (if supported).

## Rollout

- Create Supabase branch or use staging DB; run migrations there first.
- Sequence:
  1. Deploy structural migration (columns, checks).
  2. Deploy concurrent indexes/exclusion constraints (still NOT VALID).
  3. Run precheck/backfill job; remediate overlaps.
  4. Run `ALTER TABLE ... VALIDATE CONSTRAINT`.
  5. Deploy RPC + TypeScript changes.
  6. Run canary load tests to confirm P95 improvements.
  7. Merge to main -> run production migrations (remote only).
- Rollback: drop new constraints/indexes + revert RPC function; code guards should detect RPC absence and fall back (temporarily) or we ship feature flag.

### Operational Runbook (staging → production)

1. **Pre-flight**
   - Confirm `$SUPABASE_DB_URL` (staging) is set only in a secure shell; never commit values.
   - Capture baseline counts for overlaps/null windows via `psql -f scripts/check_assignment_overlaps.sql $SUPABASE_DB_URL > logs/overlap-pre.txt`.
   - If `null_or_invalid_* > 0`, block constraint validation and coordinate cleanup owners.
2. **Migrations**
   - Run `psql -v ON_ERROR_STOP=1 -f supabase/migrations/20251107060000_time_overlap_structural.sql $SUPABASE_DB_URL`.
   - Run `psql -v ON_ERROR_STOP=1 -f supabase/migrations/20251107061000_time_overlap_indexes.sql $SUPABASE_DB_URL` (expect concurrent index notices).
   - Run `psql -v ON_ERROR_STOP=1 -f supabase/migrations/20251107063000_confirm_hold_assignment_tx.sql $SUPABASE_DB_URL`.
3. **Backfill/cleanup**
   - Execute `scripts/check_assignment_overlaps.sql` again and diff vs baseline (`diff overlap-pre.txt overlap-post.txt`).
   - Resolve any overlapping rows (coordinate manual deletes/updates recorded in `CLEANUP_GUIDE.md`).
4. **Validation**
   - After zero overlaps + null windows, run `psql -f scripts/validate_overlap_constraints.sql $SUPABASE_DB_URL` to VALIDATE constraints.
   - Capture timings + `ANALYZE booking_table_assignments; ANALYZE table_hold_windows;` to refresh planner stats.
5. **Promotion**
   - Repeat steps on production (off-hours), keeping structural/index migrations separated by monitoring windows.
   - Monitor `capacity.assignment.sync` failure dashboards for 30m after RPC rollout.

### Rollback considerations

- To disable overlap enforcement quickly: `ALTER TABLE ... DROP CONSTRAINT bta_no_overlap;` and same for `thw_no_overlap` (safe because `NOT VALID` => minimal lock).
- RPC rollback: `DROP FUNCTION IF EXISTS public.confirm_hold_assignment_tx(...)` followed by redeploy of previous application commit (requires TypeScript fallback path; ensure release checklist includes verifying RPC availability before hitting path).
- Keep exported schema snapshots under `supabase/schema.sql` to confirm drift after each environment run (use `supabase db dump` if needed).
