# Research: Booking/Table Assignment Stress Test - Create Flow

## Requirements

- Functional:
  - Stress test booking create flow plus table assignment algorithm covering all table combinations.
  - Focus on automatic table allocation logic under heavy load for create scenarios.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Reproducible automated script; remote Supabase only; ensure scripts finish within existing performance targets mentioned in allocation docs.

## Existing Patterns & Reuse

- `scripts/run-allocation-stress-test.sh` orchestrates per-restaurant allocation using `scripts/ops-auto-assign-ultra-fast.ts`.
- Stress documentation in `ALLOCATION_STRESS_TEST_README.md` plus historical logs in repo (e.g., `stress-test-run-*.log`).
- Database seeding commands `pnpm run db:reset`, `pnpm run db:seed-intelligent`, and `pnpm run db:seed-today` configure baseline dataset for allocation tests.

## External Resources

- Refer to `ALLOCATION_STRESS_TEST_README.md` for metrics/steps.
- `STRESS_TEST_RESULTS.md` summarises expected behaviours.

## Constraints & Risks

- Remote database only; ensure `.env.local` has Supabase connection.
- Data resets may disrupt other collaborators; coordinate before wiping.
- Stress tests can take time; ensure scripts handle concurrency without saturating resources.

## Open Questions (owner, due)

- Q: Do we need to expand data set beyond 105 bookings for create-only tests?  
  A: Pending confirmation; will start with provided dataset and adjust if necessary.

## Recommended Direction (with rationale)

- Follow documented seed + stress commands to simulate create flow and table assignment loops, capturing results in `reports/` or new log file.
- Enhance verification to ensure every table combination is attempted by configuring script to iterate bookings multiple times and log coverage.
