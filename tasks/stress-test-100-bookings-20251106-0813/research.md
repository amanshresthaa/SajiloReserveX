# Research: 100-Booking Stress Test

## Requirements

- Functional:
  - Execute the allocation stress validation against the current Supabase environment with 100 "today" bookings.
  - Capture outcomes (pass/fail details, any errors) for visibility.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Run from local CLI but target remote Supabase via `SUPABASE_DB_URL` (no local DB).
  - Ensure scripts finish within reasonable time and avoid PII in shared logs.

## Existing Patterns & Reuse

- `pnpm run db:stress-test` → wraps `supabase/seeds/stress-test-allocation.sql` via `scripts/run-allocation-stress-test.sh` for validation.
- `pnpm run db:seed-today` → generates ~100 realistic bookings for the current date (documented in `ALLOCATION_STRESS_TEST_README.md`).
- Prior artifacts (`stress-test-output-*.log`, `STRESS_TEST_RESULTS.md`) show expected console output and success criteria.

## External Resources

- `ALLOCATION_STRESS_TEST_README.md` – outlines the end-to-end workflow and confirms the booking counts.

## Constraints & Risks

- Requires valid Supabase credentials in `.env.local` (remote only per handbook).
- Running `db:seed-today`/`db:stress-test` mutates remote data; ensure target environment is safe (staging/shared).
- Need to clear/restore state if tests modify existing bookings.

## Open Questions (owner, due)

- Q: Which Supabase environment should be targeted (staging vs. prod)?
  A: Assuming staging per local `.env.local`; verify via connection string naming before execution.

## Recommended Direction (with rationale)

- Follow documented flow: seed intelligent base data if needed, generate today's 100 bookings, then execute `pnpm run db:stress-test` and capture log. This reuses vetted SQL and avoids bespoke scripts.
- Store command outputs under the task directory for traceability.
