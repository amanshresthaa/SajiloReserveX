# Implementation Checklist

## Setup

- [x] Confirm `SUPABASE_DB_URL` points to intended staging environment.
- [x] Capture pre-run booking count for today (optional safety check).

## Core

- [x] Run `pnpm run db:seed-today` (if bookings need refreshing) and save output.
- [x] Execute `pnpm run db:stress-test` and save output to task folder.

## UI/UX

- [ ] n/a (CLI only).

## Tests

- [x] Verify command exit codes were zero.
- [x] Review stress test SQL output for failures/warnings.

## Notes

- Assumptions:
  - Using staging database defined in `.env.local`.
- Deviations:
  - Inserted missing `booking_occasions.drinks` row to satisfy FK and enable seed (idempotent).

## Batched Questions (if any)

- None.
