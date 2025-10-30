# Implementation Checklist

## Setup

- [x] Snapshot existing `supabase/seed.sql` and `supabase/seeds/seed.sql` into timestamped backups.
- [x] Catalogue target table list + column dependencies from migrations for reference while coding.

## Core

- [x] Author new `supabase/seeds/seed.sql` implementing phased seed (truncate, metadata, restaurants, customers, bookings, allocations, holds, analytics).
- [x] Ensure seed script enables/disables hold enforcement when seeding `table_hold_windows`.
- [x] Populate supporting tables (booking_occasions, restaurant_capacity_rules, service_policy, loyalty, feature flags, observability, metrics).
- [x] Remove/replace legacy duplicate seeds that are no longer needed after backup.

## UI/UX

- [ ] N/A

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: Staging/prod resets will be executed via `pnpm db:seed-only`; hashed passwords remain placeholder but valid bcrypt.
- Deviations: None at this time.

## Batched Questions (if any)

- None currently.
