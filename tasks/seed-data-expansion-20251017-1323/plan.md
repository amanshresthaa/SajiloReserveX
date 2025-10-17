# Implementation Plan: Seed Data Expansion

## Objective

Deliver a richer Supabase seed dataset that exercises the new capacity/lifecycle features by populating most operational tables (capacity rules, slots, assignments, analytics, loyalty, invites) so developers can query realistic data across the platform.

## Success Criteria

- [ ] `supabase/utilities/init-seeds.sql` seeds additional tables without breaking existing flows (`pnpm run db:seed-only` remains one command).
- [ ] Newly seeded tables (`restaurant_capacity_rules`, `booking_slots`, `booking_table_assignments`, `booking_state_history`, `booking_versions`, `capacity_metrics_hourly`, `restaurant_invites`, `loyalty_*`, `analytics_events`, `profile_update_requests`) contain representative rows tied to existing restaurants/bookings.

## Architecture & Components

- Extend the existing seed transaction with new sections:
  - Capacity setup: base & override rows in `restaurant_capacity_rules`, pre-generated `booking_slots` derived from seeded bookings plus availability padding.
  - Lifecycle artifacts: call helper functions to assign tables, populate `booking_state_history`, `booking_versions`, and update slot `reserved_count`.
  - Engagement data: insert analytics events, loyalty programs/points/events tied to seeded customers and bookings.
  - Admin ops: seed `restaurant_invites`, `profile_update_requests`, and hourly capacity metrics for reporting.
    State: N/A | Routing/URL state: N/A

## Data Flow & API Contracts

- SQL-only orchestration; leverage existing helper functions (`get_or_create_booking_slot`, `assign_table_to_booking`, `increment_capacity_metrics`) to mirror production behaviour.
- Ensure inserts respect FK relationships and update dependent computed values (e.g., `reserved_count`, loyalty totals).

## UI/UX States

- Loading: N/A
- Empty: N/A
- Error: N/A
- Success: Seed script prints new summary statistics for the additional tables.

## Edge Cases

- Idempotency: guard inserts with `TRUNCATE`/`DELETE` or `ON CONFLICT` so rerunning the script does not duplicate records.
- Enum coverage: include `checked_in` status and `capacity_override_type` values to validate downstream handling.
- Timezone handling: keep everything in UTC while deriving local times to avoid future DST issues.

## Testing Strategy

- Unit: N/A (pure SQL).
- Integration: Manual verification by reviewing final `SELECT` stats, plus targeted queries (documented in `verification.md`).
- E2E: Ensure Playwright/API suites can rely on seeded data once run against remote Supabase (cannot run locally here).
- Accessibility: N/A

## Rollout

- No feature flags; seeds execute via existing `pnpm run db:reset`.
- Exposure: All developers using remote test database benefit immediately after seed file merges.
- Monitoring: Rely on final `SELECT` summaries and Supabase dashboard to confirm dataset health post-deploy.
