# Implementation Checklist

## Setup

- [x] Review `supabase/utilities/init-seeds.sql` for insertion points and existing CTE dependencies.
- [x] Note helper functions (`assign_table_to_booking`, `get_or_create_booking_slot`, `increment_capacity_metrics`) signatures for reuse.

## Core

- [x] Expand seed preamble (TRUNCATE/DELETE and status logic) to include new tables and `checked_in` coverage.
- [x] Add capacity rule seeding and slot generation, ensuring idempotency and reserved counts.
- [x] Seed lifecycle artifacts (table assignments, booking state history, booking versions) tied to seeded bookings.
- [x] Seed analytics, loyalty, invites, profile update requests, and hourly capacity metrics.
- [x] Extend closing statistics to report on newly populated tables.

## UI/UX

- [ ] N/A

## Tests

- [x] Static validation (e.g., lint/format if applicable) and manual SQL review since remote Supabase execution is out of scope here.

## Notes

- Assumptions:
  - Admin Supabase user already exists (`amanshresthaaaaa@gmail.com`).
  - Script continues to target remote database via `pnpm run db:reset`.
- Deviations:
  - Cannot execute the seed remotely from this environment; rely on reasoning and SQL validation.

## Batched Questions (if any)

- ...
