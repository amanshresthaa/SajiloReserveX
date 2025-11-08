# Implementation Plan: Booking/Table Assignment Stress Test - Create Flow

## Objective

Expand the existing allocation stress runner to bruteforce all feasible table combinations for create bookings so we can validate algorithm coverage before moving on to edit/delete flows, and embed a `/reserve`-style create flow (booking creation + sequential assignment attempts) for deeper stress coverage.

## Success Criteria

- [ ] Database seeded with today's bookings suitable for stress scenario.
- [ ] Automated loop runs allocation for each restaurant repeatedly until no pending bookings remain or max iterations reached (legacy mode).
- [ ] `/reserve` create mode clones/creates bookings and iterates every strategy/combination sequentially until status becomes confirmed, with verbose logging for each attempt.
- [ ] Logs capture combination attempts, conflicts, and final metrics for review (both modes).

## Architecture & Components

- Shell runner script orchestrates seeding + stress tests using existing `scripts/run-allocation-stress-test.sh` as baseline.
- Core allocation mode uses `scripts/ops-auto-assign-ultra-fast.ts` with environment variables `TARGET_RESTAURANT_SLUG` & `TARGET_DATE`.
- `/reserve` create mode will use `createBookingWithCapacityCheck`, `quoteTablesForBooking`, and manual confirmation/release helpers to mimic UI flow 1 booking at a time.
- Additional logging/perf metrics stored under `reports/` with timestamped filenames.

## Data Flow & API Contracts

- CLI -> Supabase via `psql` (through `.env.local` `SUPABASE_DB_URL`).
- tsx script interacts with Supabase REST APIs (existing logic). No new endpoints planned; we are orchestrating existing flows.

## UI/UX States

- CLI output states: baseline stats, iteration progress, completion summary. No user interface changes required.

## Edge Cases

- Bookings partially allocated require cleanup before rerun (clear assignments per run or rely on script resets).
- Script failure mid-run should not leave DB inconsistent; we may re-run after verifying assignments.

## Testing Strategy

- Primary verification via `pnpm run db:stress-test` before/after running allocation loops.
- Capture outputs to log files for comparison.

## Rollout

- Manual invocation only. Provide log path + instructions for reproduction.
