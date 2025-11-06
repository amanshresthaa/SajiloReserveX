# Verification Report

## CLI Validation

- [x] `pnpm run db:seed-today`
  - First attempt failed (FK constraint missing `booking_occasions.drinks`); inserted missing occasion and reran successfully.
  - Output stored in `tasks/stress-test-100-bookings-20251106-0813/db-seed-today.log`.
- [x] `pnpm run db:stress-test`
  - Completed with "✅ Stress test complete!" and no SQL errors.
  - Output stored in `tasks/stress-test-100-bookings-20251106-0813/db-stress-test.log`.

## Observations

- Pre-run booking count for today: 17.
- Post-seed booking count for today: 117 (existing 17 + 100 generated).
- Inserted missing booking occasion via `booking_occasions` table to unlock seed script (idempotent `ON CONFLICT DO NOTHING`).

## Known Issues

- None observed during this run. Consider housekeeping if 117 vs. 100 exact count is a concern for downstream tests.

## Sign-off

- Engineering: ✅

## Allocation Script Results

- [x] `pnpm run db:run-allocation-test`
  - Processed 2 pending bookings across 117 total; both allocated successfully (multi-table assignments).
  - Post-run pending bookings: 115; tables used: 2/90; average allocated party size: 6.
  - Execution duration: 7s overall (~4.6s per booking) with report persisted under `reports/auto-assign-ultra-fast-2025-11-06-2025-11-06T08-26-17.376Z.json`.
  - Noted console warnings about adjacency asymmetry and feature-flag safety (mirrors prior runs); no hard failures.

## Logs

- `db-seed-today.log` – seed attempts/results.
- `db-stress-test.log` – validation run after seeding and allocation script.
- `db-run-allocation-test.log` – full allocation runner output including validation rerun.
