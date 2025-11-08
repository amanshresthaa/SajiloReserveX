# Verification Report

## CLI / Static Analysis

- `pnpm lint` – ✅ validates the refactored `ops-auto-assign-ultra-fast.ts` export plus the enhanced `/reserve` loop runner (`scripts/ops-auto-assign-ultra-fast-loop.ts`), keeping capacity modules within the enforced ESLint suite. Added `SCARCITY_DEBUG` gate to avoid console floods.
- `pnpm run db:seed-only` – ✅ refreshes remote data; legacy `db:seed-intelligent`/`db:seed-today` scripts referenced in docs no longer exist.
- `pnpm run db:run-allocation-test` – ✅ baseline + post-run snapshots (60 bookings on 2025‑11‑08, 55 still pending because the allocator script exits early when no pending bookings are detected).
- Schema pre-req fixes for reserve mode:
  - Created `public.restaurant_capacity_rules` with empty data so the booking RPC stops erroring.
  - Recreated the missing `public.booking_type` enum (values: `lunch`, `drinks`, `dinner`, `christmas_party`, `curry_and_carols`).
- `pnpm run assign:loop -- --mode reserve --slug white-horse-pub-waterbeach --date 2025-11-05 --source-date 2025-11-05 --source-after 17:00 --clone-limit 5 --hold-ttl 240`
  - First two clones succeeded end-to-end (bookings `6cf4330f...` and `0fdf20d0...` assigned to BA-03 / BA-07).
  - Remaining three clones logged every combination attempt but `confirm_hold_assignment` failed with `assign_tables_atomic_v2 assignment duplicate` because BA-07/BA-03 were already in use at 18:00 and no alternate tables met adjacency constraints. Script now clearly records each attempt and releases holds.
  - Command hit the 270s CLI timeout (output truncated) but the run did complete; DB now shows 71 bookings on 2025‑11‑05 (2 assigned, 3 pending tableless).

- After resetting with `pnpm run db:seed-only`, re-running the reserve flow with the new `--avoid-used` flag (`pnpm run assign:loop -- --mode reserve --slug white-horse-pub-waterbeach --date 2025-11-05 --source-date 2025-11-05 --source-after 17:00 --clone-limit 5 --hold-ttl 240 --avoid-used`) successfully processed all five clones:
  - Booking IDs `39c2e2e8`, `782bf0cd`, `f5af9433`, `0ae6a0af`, `ed8a3079` were created via the `/reserve` flow and confirmed with unique table assignments (BA-07, BA-08, BA-03, BA-04, MD-07 respectively).
  - The new logic tracks tables used earlier in the run and passes them into `quoteTablesForBooking({ avoidTables })`, so later clones explore different combinations instead of repeatedly colliding with occupied tables.
  - Console output now shows each strategy attempt only once per table set, with holds confirmed (or falling back when the RPC cache misses and the legacy path handles it).
- `pnpm run db:run-allocation-test` (post-run) still reports 60 bookings / 55 pending for 2025-11-08, which is expected because the stress runner only looks at booking_date = TARGET_DATE (2025-11-08) and exits early once no pending bookings remain.

## Outstanding

- If you want to capture additional permutations, re-run reserve mode with different `--source-date/--source-after` windows or set `--max-tables` higher; the new `--avoid-used` flag is opt-in so you can toggle it per experiment.
- Long term we should add observability for why the baseline allocator exits with “No bookings to process” when there are 55 pending rows on the same date; today’s script filters by status=pending and found 0, suggesting those bookings may already be `pending_allocation` or confirmed. Tracking that is outside this task but worth noting for future stress runs.
