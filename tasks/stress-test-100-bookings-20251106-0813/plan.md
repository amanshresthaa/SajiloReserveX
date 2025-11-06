# Implementation Plan: 100-Booking Stress Test

## Objective

We will execute the documented allocation stress validation so that the current configuration is validated against ~100 bookings for today and results are captured for review.

## Success Criteria

- [ ] `pnpm run db:seed-today` (if required) completes without error and reports booking generation.
- [ ] `pnpm run db:stress-test` finishes successfully with "✅ Stress test complete!".
- [ ] Command output logs are stored under the task directory.

## Architecture & Components

- Supabase remote database (target defined via `SUPABASE_DB_URL`).
- SQL seeds located at `supabase/seeds/stress-test-allocation.sql` executed via `psql`.
- Shell wrapper `scripts/run-allocation-stress-test.sh` invoked through npm scripts.

## Data Flow & API Contracts

Command: `pnpm run db:seed-today`

- Executes SQL to insert 100 bookings for `booking_date = CURRENT_DATE`.

Command: `pnpm run db:stress-test`

- Executes `supabase/seeds/stress-test-allocation.sql` to validate constraints, outputting pass/fail diagnostics.
- Success indicated by exit code `0` and success message.

## UI/UX States

- CLI output only; success text vs. failure text captured in log.

## Edge Cases

- Seed already executed for today → script may report duplicates; monitor output.
- Missing/invalid `SUPABASE_DB_URL` → commands fail early; need to confirm env availability before running.
- Existing assignments may cause stress test to fail; note and coordinate cleanup if necessary.

## Testing Strategy

- Observe command exit codes (CI-style check).
- Inspect log to ensure validation queries run to completion.
- If failures occur, capture output and raise follow-up.

## Rollout

- Target environment: staging (per `.env.local`).
- No feature flags toggled.
- Kill-switch: stop on first failure; avoid re-running until environment state clarified.
