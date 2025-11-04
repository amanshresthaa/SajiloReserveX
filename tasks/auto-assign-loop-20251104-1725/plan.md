# Implementation Plan: Auto-Assign Loop Runner

## Objective

We will continuously run the ultra-fast assignment script for Prince of Wales on 2025-11-10 until all pending bookings have tables, adapting env flags between iterations based on failures and performance.

## Success Criteria

- [ ] Loop exits successfully when remaining unassigned (pending) bookings = 0
- [ ] Logs include iteration, assigned count, remaining, top failure reasons
- [ ] Adaptive tuning applies reasonable flag changes when failures persist

## Architecture & Components

- Runner (`scripts/ops-auto-assign-ultra-fast-loop.ts`):
  - Spawns ultra-fast script via `pnpm tsx ...`.
  - Parses stdout failure breakdown; loads latest JSON report for metrics.
  - Queries remote DB via `pg` and `SUPABASE_DB_URL` to count/list unassigned.
  - Applies env-based feature flags to influence the next iteration.

## Data Flow & API Contracts

- DB: `bookings`, `booking_table_assignments` via SQL:
  - Unassigned: pending bookings with no matching rows in `booking_table_assignments`.

## UI/UX States

- N/A (CLI). Console output only.

## Edge Cases

- Ultra-fast script fails mid-run → continue based on DB state.
- No bookings to assign → exit immediately with success.
- Same bookings remain across multiple iterations → mark as stuck and suggest fixes.

## Testing Strategy

- Unit-light: exercise locally against remote with seeded data.
- Manual assertions via logs and final remaining count.

## Rollout

- Run via `pnpm run assign:loop`.
- Can override date/slug via CLI flags.
