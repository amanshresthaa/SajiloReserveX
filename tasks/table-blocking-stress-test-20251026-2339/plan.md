# Implementation Plan: Table Blocking Stress Test

## Objective

We will reproduce and stress test table blocking behaviour to confirm whether tables remain reserved beyond booking windows and identify the underlying cause.

## Success Criteria

- [ ] Reproduce issue locally with automated or scripted load.
- [ ] Capture diagnostics (logs, DB state) demonstrating tables remain blocked post-window.
- [ ] Document hypotheses and next steps for remediation.

## Architecture & Components

- Add a one-off stress harness under `scripts/` (TypeScript) that uses the existing `pg` dependency to connect to Supabase via `SUPABASE_DB_URL`.
- The script wraps all writes in a transaction (`BEGIN`/`ROLLBACK`) to avoid persisting any fixtures while still invoking the live `refresh_table_status` function.
- Reuse helper utilities (e.g., `dotenv` loader) to read environment variables without duplicating configuration.

## Data Flow & API Contracts

- Script workflow:
  1. Insert temporary `restaurants`, `zones`, `table_inventory`, `customers`, and `bookings` rows (transactional) to satisfy foreign keys.
  2. Insert an `allocations` row for the synthetic table, iteratively updating its `window` to cover _past_, _present_, and _future_ ranges.
  3. After each window mutation, call `SELECT public.refresh_table_status($1)` and read back `table_inventory.status`.
  4. Emit structured logs summarising status transitions and flag any lingering `reserved` state after the window elapsed.

## UI/UX States

- Not applicable.

## Edge Cases

- Time-based assertions rely on Postgres `now()`; script will compute windows relative to UTC to guarantee deterministic comparisons.
- Ensure maintenance/occupied paths are bypassed (set `is_maintenance = false`, booking status `confirmed`) so we observe pure reservation behaviour.

## Testing Strategy

- Manual execution: `pnpm tsx scripts/stress-check-table-blocking.ts` (documented in `todo.md`).
- Capture script output in `verification.md`, noting whether status returns to `available` after the allocation window closes.

## Rollout

- Not applicable.
