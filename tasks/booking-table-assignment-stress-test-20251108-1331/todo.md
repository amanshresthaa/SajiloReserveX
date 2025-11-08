# Implementation Checklist

## Setup

- [ ] Confirm `.env.local` contains valid Supabase connection for remote stress tests.
- [ ] Review/refresh seed data per stress test README.

## Core

- [x] Add iterative assignment loop runner covering adjacency/table count combinations.
- [x] Extend loop to new `/reserve` create mode (clone bookings, create via capacity RPC).
- [x] Seed remote via `pnpm run db:seed-only` (legacy `db:seed-intelligent`/`db:seed-today` scripts no longer exist).
- [x] Execute `pnpm run db:run-allocation-test` to capture baseline stats (acts as `db:stress-test` replacement).
- [x] Run enhanced reserve-flow loop (`pnpm run assign:loop -- --mode reserve ... --avoid-used`) and capture console output.
- [x] Re-run `pnpm run db:run-allocation-test` after reserve loop to observe deltas (60 bookings remain on 2025-11-08 because allocator skips when no pending rows exist).

## Verification

- [ ] Store CLI outputs/logs in `reports/` with timestamp.
- [ ] Summarize findings in `verification.md`.

## Notes

- Assumptions: Starting from clean dataset; remote DB accessible.
- Deviations: TBD
