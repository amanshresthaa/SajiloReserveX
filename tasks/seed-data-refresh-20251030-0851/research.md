# Research: Seed Data Refresh

## Requirements

- Functional:
  - Replace the current Supabase seed script with a freshly authored version that derives all inserts from the live schema/migrations.
  - Populate the full restaurant experience dataset (8 venues, zones, tables, customers, bookings, assignments, holds, analytics, loyalty, feature flags).
  - Ensure every table that participates in booking/tables/holds flows receives representative rows so dashboards, APIs and allocator routines work with non-empty data.
  - Produce a backup of the existing seed file(s) before removal/replacement.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Seed script must be idempotent (safe to rerun) and respect FK constraints, unique indexes, generated columns.
  - Maintain realistic but synthetic PII (no real secrets) and keep hash placeholders for auth passwords.
  - Balance data volume (realistic load for allocator/perf views) without making reset runs excessively long.
  - Keep timestamps/timezones aligned with `Europe/London` expectations from schema defaults.

## Existing Patterns & Reuse

- `supabase/seed.sql` – legacy comprehensive seed with 8 restaurants, 40 zones, 320 tables, 3 date buckets of bookings. Shows TRUNCATE strategy, service period scaffolding, and booking generation loops.
- `supabase/seeds/seed.sql` – alternative streamlined script with bookings + baseline table inventory plus auth grants; useful for CTE layout and membership seeding.
- `supabase/seeds/capacity-fixtures.sql` – deterministic fixture dataset for allocator tests demonstrating explicit UUID usage, zone/table distribution, table adjacency inserts.
- `supabase/utilities/init-seeds.sql` – orchestrator (`\ir`) executed by `pnpm db:seed-only`; new script must stay compatible.
- `SEED_DATA_SUMMARY.md` & `SEED_SCALE_SUMMARY.md` – describe target counts, per-restaurant distributions, and time-slot logic that should remain true after rewrite.

## External Resources

- [SEED_DATA_SUMMARY.md](../../SEED_DATA_SUMMARY.md) – reference dataset specs (counts, distributions, time ranges).
- [SEED_SCALE_SUMMARY.md](../../SEED_SCALE_SUMMARY.md) – outlines scaling goals (zones, tables, bookings) used by allocator tests.
- [supabase/migrations/20251019102432_consolidated_schema.sql](../../supabase/migrations/20251019102432_consolidated_schema.sql) – authoritative schema snapshot for core tables.
- [supabase/migrations/20251020140700_add_booking_occasions_catalog.sql](../../supabase/migrations/20251020140700_add_booking_occasions_catalog.sql) – booking occasion catalogue details.
- [supabase/migrations/20251026104700_add_table_holds.sql](../../supabase/migrations/20251026104700_add_table_holds.sql) & follow-on hold migrations – define table holds/members/windows that require new seed coverage.
- [supabase/migrations/20251029165000_feature_flag_overrides.sql](../../supabase/migrations/20251029165000_feature_flag_overrides.sql) – feature flag override model to populate.

## Constraints & Risks

- Must respect TRUNCATE order + CASCADE to avoid FK violation while keeping auth schema in sync (auth.users vs public.profiles).
- Booking inserts require matching `booking_type` keys from `booking_occasions`; service periods must be set first so FKs succeed.
- New tables (table*holds, table_hold_members, table_hold_windows, booking_table_assignments, booking_state_history, allocations, observability_events, capacity_metrics_hourly, loyalty*\* tables, feature_flag_overrides) are currently empty in seeds and need coherent data; risk of missing them leading to runtime regressions.
- `table_hold_windows` trigger only materializes data when `app.holds.strict_conflicts.enabled` is set; seed must either set config or backfill windows manually.
- Large booking volumes increase seed time; need to strike balance between realism and pipeline runtime.
- Remote-only policy forbids local Supabase; all verification must be static reasoning/test queries not run.
- Password hashes should remain placeholder but valid (60-char bcrypt) to satisfy auth constraints.

## Open Questions (owner, due)

- Q: Do we need to seed downstream analytics (e.g., `capacity_metrics_hourly`, `observability_events`) with multiple days of history or is a single representative day sufficient?  
  A: Assumed: provide a concise multi-day sample (today, +/-1 day) to exercise views without bloating runtime.
- Q: Should we keep deterministic UUIDs for fixture accounts or rely on `gen_random_uuid()`?  
  A: Keep deterministic IDs for owner + key demo user to avoid churn in downstream automation (matches current scripts).
- Q: Do we retain special manager grant for `amanshresthaaaaa@gmail.com`?  
  A: Yes; maintain existing optional grant block so ops access remains available.

## Recommended Direction (with rationale)

- Rebuild `supabase/seeds/seed.sql` using CTE-driven phases: truncate, static lookup seeds (occasions, feature flags), core restaurant scaffolding, per-restaurant generative data, followed by derived data (bookings, assignments, holds, analytics).
- Introduce helper CTEs to compute per-restaurant calendars (past/today/future) and reuse them for bookings, slots, holds, and state history ensuring referential integrity.
- After populating base tables, generate dependent datasets (booking_state_history, booking_table_assignments, allocations, table_holds/members/windows) from previously inserted bookings/tables to guarantee consistency.
- Seed supporting tables (loyalty_programs, loyalty_points/events, customer_profiles, capacity_metrics_hourly, observability_events, feature_flag_overrides) with realistic aggregate values derived from the same bookings to maintain believable insights.
- Automate hold window population by enabling `app.holds.strict_conflicts.enabled` during seed execution, then disabling to leave system default unchanged.
