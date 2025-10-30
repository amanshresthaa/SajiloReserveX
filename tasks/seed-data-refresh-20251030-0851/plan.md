# Implementation Plan: Seed Data Refresh

## Objective

Replace the existing Supabase seed script with a schema-aligned, fully populated dataset that covers the eight La Pen Inns restaurants plus all downstream tables (bookings, assignments, holds, loyalty, analytics, feature flags) while keeping the script idempotent and orchestrator-compatible.

## Success Criteria

- [ ] `supabase/seeds/seed.sql` is rewritten from scratch, referencing current migrations and populating every dependent table required for booking/allocator workflows.
- [ ] Backups of the previous seed script(s) are stored (e.g., timestamped copy) before removal, and orchestrator `init-seeds.sql` continues to run successfully with the new file.
- [ ] New data includes 8 restaurants, 5 zones per restaurant, 40 tables per restaurant, bookings across past/today/future, table assignments, holds/windows, customer/loyalty/analytics records, and sample feature flag overrides.
- [ ] Seed script remains idempotent (safe to rerun) with TRUNCATE/reset steps and deterministic owner/manager accounts.

## Architecture & Components

- **Phase 1 – Safety & Reset**: `BEGIN`, `SET search_path`, TRUNCATE cascades for public tables + `auth.users`.
- **Phase 2 – Static Catalogs**: insert/update booking occasions, service policy, feature_flag_overrides baseline rows.
- **Phase 3 – Staff Accounts**: insert owner auth user/profile + optional manager access grant logic.
- **Phase 4 – Restaurant Scaffold**: insert 8 restaurants, memberships, operating hours, service periods, capacity rules, allowed capacities, zones, tables (with categories/seating/mobility), table adjacency samples.
- **Phase 5 – Customers & Loyalty**: bulk-generate customers per restaurant, hook up customer_profiles, loyalty_programs, loyalty_points/events.
- **Phase 6 – Booking Lifecycle**: create deterministic booking cohorts (past/today/future) with metadata, populate booking_state_history, booking_versions snapshots, booking_slots, booking_table_assignments, allocations, booking_assignment_idempotency.
- **Phase 7 – Holds & Availability**: enable strict hold enforcement, insert table_holds + table_hold_members derived from bookings, allow triggers to populate table_hold_windows, then reset config.
- **Phase 8 – Observability & Metrics**: insert observability_events, capacity_metrics_hourly, analytics_events tied to generated bookings/tables.
- **Phase 9 – Cleanup & Commit**: final sanity inserts (e.g., restaurant_capacity_rules, service_policy fallback), `COMMIT`.

## Data Flow & API Contracts

- Inputs: schema-defined tables from migrations; script uses `generate_series` and CTEs to derive rows.
- Process:
  - Derive per-restaurant metadata (slugs, contact details) via VALUES table to drive downstream inserts via joins.
  - Generate customers -> bookings (with computed start/end `tstzrange`), then leverage booking IDs to create assignments, holds, analytics rows.
  - Map bookings to tables using zone-aware logic to cover varying capacities and ensure adjacency coverage.
  - Use computed timestamptz windows (booking date + start/end_time) for all tables needing ranges (allocations, assignments, holds, windows).
- Outputs: populated public + auth tables consistent with FK/unique constraints and ready for allocator/testing flows.

## UI/UX States

Not applicable (database seed script only).

## Edge Cases

- Handle DST considerations when constructing `start_at`/`end_at` (consistently use `Europe/London` via `make_timestamptz`).
- Ensure `table_hold_windows` inserted even if config default is off (explicitly call `set_hold_conflict_enforcement(true)` before hold inserts, then disable).
- Avoid duplicate `feature_flag_overrides` by using `ON CONFLICT`.
- Preserve marketing opt-in booleans and VIP segmentation for customers to mirror analytics expectations.
- Manage large data volumes by capping counts (e.g., 200 bookings per restaurant per day) to keep runtime reasonable.

## Testing Strategy

- Unit: N/A (pure SQL).
- Integration: Document verification queries (counts per table, sample join validations) in `verification.md`; recommend running `pnpm db:seed-only` remotely to confirm.
- E2E: Leverage existing allocator/booking flows once seed is deployed; ensure QA uses Chrome DevTools per SDLC if UI touches are triggered.
- Accessibility: N/A.

## Rollout

- Feature flag: Seed script replacement guarded by Git review; no runtime flag but feature overrides seeded (e.g., `allocator.strict_conflicts`).
- Exposure: Once merged, run `pnpm db:seed-only` (staging) followed by production once validated.
- Monitoring: Use seeded observability/metrics tables to validate aggregator dashboards; cross-check Supabase logs after first run.
- Kill-switch: Retain backed-up seed file to restore if issues arise; ability to `git revert` + re-run seeds.
