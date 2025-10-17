# Research: Seed Data Expansion

## Existing Patterns & Reuse

- `supabase/utilities/init-seeds.sql` already orchestrates seeding for restaurants, operating hours, service periods, customers, bookings, customer profiles, table inventory, and admin memberships using CTE-heavy SQL; extending this file keeps the single-entry workflow (`pnpm run db:reset`) intact.
- `supabase/utilities/init-database.sql` exposes full schema ordering, so any new seed data can rely on objects defined by migrations (e.g., booking lifecycle tables, capacity metrics).
- Helper functions created in migrations (`public.get_or_create_booking_slot`, `public.assign_table_to_booking`, `public.increment_capacity_metrics`) provide reusable logic we can invoke inside the seed script instead of reimplementing business rules.

## External Resources

- [VISUAL_ARCHITECTURE.md](../../VISUAL_ARCHITECTURE.md) – overview of current seeding strategy and dataset sizes.
- [supabase/utilities/init-seeds.sql](../../supabase/utilities/init-seeds.sql) – baseline script to augment.
- [supabase/migrations/20251016\*](../../supabase/migrations) – recent capacity engine migrations that introduced `booking_slots`, `booking_table_assignments`, `booking_state_history`, `capacity_metrics_hourly`, and new columns/enums.
- [supabase/seeds/README.md](../../supabase/seeds/README.md) – documentation of legacy data model useful for consistency checks.

## Constraints & Risks

- Seeds execute against the **remote** Supabase instance; we must not assume local Postgres access and must avoid destructive commands outside the structured TRUNCATE/DELETE blocks already present.
- New data must respect foreign key constraints and CHECK constraints (e.g., `restaurant_capacity_rules_scope`, `booking_slots_capacity_valid`, enum values such as `capacity_override_type` and `booking_status` with the added `checked_in` state).
- Need to avoid generating excessive volume that slows `pnpm run db:reset`; target realistic yet performant dataset sizes.
- Booking-derived artifacts (slots, table assignments, versions, analytics events) must stay logically consistent with seeded bookings to prevent downstream logic/test failures.

## Open Questions (and answers if resolved)

- Q: Which additional tables require coverage to satisfy “most of the tables” after the latest migrations?
  A: Newly introduced or previously unseeded tables include `restaurant_capacity_rules` (with override metadata), `booking_slots`, `booking_table_assignments`, `booking_state_history`, `booking_versions`, `capacity_metrics_hourly`, `restaurant_invites`, `loyalty_programs/points/events`, `analytics_events`, and `profile_update_requests`. Covering these plus confirmation token fields should deliver broad dataset coverage.
- Q: Should seeds leverage stored procedures (`assign_table_to_booking`, `get_or_create_booking_slot`, `increment_capacity_metrics`) or perform raw inserts?
  A: Prefer stored procedures where available to ensure business logic (e.g., slot creation, table status updates) mirrors production behaviour and reduces maintenance.

## Recommended Direction (with rationale)

- Extend `supabase/utilities/init-seeds.sql` with additional sections that seed capacity rules, slots, table assignments, lifecycle history, analytics/loyalty data, invites, and profile update records while reusing existing restaurant/customer/bookings context.
- Generate deterministic yet diverse datasets (e.g., slot grids over 14 days, mix of override types, varied booking states) so product teams can exercise UI/API flows for capacity, lifecycle, and reporting features.
- Keep everything wrapped in the existing transaction, reuse CTE patterns for clarity, and add stats `SELECT`s for newly seeded tables to aid verification during `pnpm run db:seed-only`.
