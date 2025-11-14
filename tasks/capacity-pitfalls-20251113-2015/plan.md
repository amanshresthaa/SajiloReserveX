---
task: capacity-pitfalls
timestamp_utc: 2025-11-13T20:15:00Z
owner: github:@codex-ai
reviewers:
  - github:@maintainers
risk: high
flags: []
related_tickets: []
---

# Implementation Plan: Capacity Hold + Assignment Hardening

## Objective

Deliver DB + allocator updates so holds/allocations enforce tenant-safe overlaps, adjacency requirements can be tightened, and confirming a hold is idempotent even if the hold row disappears.

## Success Criteria

- [ ] `allocations_no_overlap` enforces `(restaurant_id, resource_type, resource_id, window)` without redundant GiST index.
- [ ] Feature flag (env) lets us choose adjacency mode; pairwise mode rejects “path-only” combinations via selector + manual flows.
- [ ] `POST /manual/confirm` (and internal callers) can retry with the same idempotency key/hold id and receive the prior assignments instead of `HoldNotFoundError`.
- [ ] Vitest coverage for adjacency modes + confirm idempotency passes; existing suites stay green.

## Architecture & Components

- **Supabase migrations**: one migration to (a) ensure `btree_gist`, (b) drop/recreate exclusion constraint, drop redundant GiST index, and (c) add `booking_confirmation_results` table + trigger changes to `confirm_hold_assignment_tx`.
- **Feature flag plumbing**: update `config/env.schema.ts`, `lib/env.ts`, and `server/feature-flags.ts` with `allocator.adjacencyMode` (string enum). Default to `connected`.
- **Allocator runtime**: modify `server/capacity/selector.ts` + manual selection + availability filters to accept adjacency mode and perform pairwise checks when requested. Provide helper(s) to evaluate adjacency status + diagnostics.
- **Hold confirmation**: before loading the hold, check (`booking_confirmation_results`) for an existing entry keyed by `bookingId` + `idempotencyKey` OR by `holdId`. If found, fetch assignments via existing repo helper and return.
- **Supabase RPC**: edit `confirm_hold_assignment_tx` to insert confirmation record before deleting hold (wrap in `BEGIN/EXCEPTION` block similar to outbox).

## Data Flow & API Contracts

- New table schema:
  - `booking_confirmation_results`: `{ booking_id uuid, hold_id uuid, restaurant_id uuid, idempotency_key text, table_ids uuid[], assignment_window tstzrange, created_at timestamptz, actor_id uuid, metadata jsonb }`.
  - PK `(booking_id, idempotency_key)` + unique `hold_id`.
- RPC `confirm_hold_assignment_tx` gains `INSERT ... ON CONFLICT DO NOTHING` into new table after successful assignments.
- `confirmHoldAssignment` TS path:
  1. If caller provided `idempotencyKey`, query confirmation table. If found, return assignments (via helper) and skip hold lookup.
  2. Otherwise, attempt lookup by `holdId` (covers deterministic key cases). If found, same return.
  3. Fallback to current flow (load hold → compute deterministic key → call RPC).

## UI/UX States

- No new UI; manual confirm API now returns cached result on retries.

## Edge Cases

- Ensure adjacency evaluation gracefully handles empty adjacency maps (fail closed when strict modes enabled).
- Confirmation lookup must verify assignments exist (booking may have been manually mutated) and throw a deterministic error if mismatch occurs.
- Migration ordering: re-create constraint + drop index without leaving table unprotected; wrap in `BEGIN`.

## Testing Strategy

- Unit: `tests/server/capacity/selector.scoring.test.ts` / new spec verifying adjacency statuses for `connected` vs `pairwise`.
- Unit: extend `manualConfirm.test.ts` to hit confirm twice with same idempotency key and assert second call returns cached assignments even after hold delete.
- DB/regression: rely on Vitest + targeted manual run of `pnpm test --filter capacity`.

## Rollout

- Feature flag default keeps adjacency mode `connected`; pairwise can be toggled per env once operators are ready.
- Migration deploy order: run new SQL on staging (Supabase remote), validate constraint via `NOT VALID` + `VALIDATE CONSTRAINT` if needed (current plan adds constraint directly because data set is small). Document in verification.

## DB Change Plan

- `CREATE EXTENSION IF NOT EXISTS btree_gist;`
- `ALTER TABLE allocations DROP CONSTRAINT ...` (both) then `ADD CONSTRAINT ... EXCLUDE USING gist (restaurant_id WITH =, resource_type WITH =, resource_id WITH =, window WITH &&) WHERE (NOT shadow);`
- `DROP INDEX IF EXISTS allocations_resource_window_idx;`
- `CREATE TABLE booking_confirmation_results` + indexes + RLS policies.
- `ALTER FUNCTION confirm_hold_assignment_tx` to upsert into new table.
- Attach migration artifact (`artifacts/db-diff.txt`) in verification.
