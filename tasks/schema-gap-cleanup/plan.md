# Plan: Schema cleanup + operational primitives

## Goals

1. Remove unused/immature features (table assignment + waitlist) to simplify bookings.
2. Introduce foundational tables for operating hours, service periods, and capacity rules to cover the documented gaps.
3. Update application logic, types, and tests to align with the streamlined schema.

## Step-by-step

1. **Design updated data model**
   - Define new tables:
     - `restaurant_operating_hours` (standard weekly schedule; support optional special dates).
     - `restaurant_service_periods` (named periods like breakfast/lunch tied to restaurants).
     - `restaurant_capacity_rules` (covers per service/date/time window).
   - Draft exact columns, constraints, RLS policies, and grants. Cross-check with Supabase defaults and existing patterns.
   - Decide which legacy elements are dropped (`restaurant_tables`, `bookings.table_id`, `customer_profiles.last_waitlist_at`, waitlist-related event types) and how to mitigate downstream impacts.

2. **Write Supabase migration**
   - Drop dependent constraints, policies, triggers, indexes, grants referencing `restaurant_tables` and `bookings.table_id`.
     - Remove `no_overlap_per_table` exclusion constraint, related indexes, and FK.
     - Drop table `restaurant_tables`.
     - Drop waitlist-related columns (`customer_profiles.last_waitlist_at`) and enum value `booking.waitlisted` if no longer used.
   - Create new tables with full RLS + policy coverage and grant statements mirroring existing conventions.
   - Ensure migration is reversible/transaction-safe in Supabase (no `DROP TYPE` if enums still used elsewhere).

3. **Regenerate Supabase types & update shared typings**
   - Run `pnpm supabase gen types` (or equivalent) after migration to refresh `types/supabase.ts`.
   - Verify new tables appear and removed columns vanish. Update custom types if generation unavailable.

4. **Refactor server logic**
   - Remove references to `restaurant_tables` and `table_id` across server modules (`server/bookings.ts`, `server/cache/availability.ts`, `server/jobs/...`, `server/analytics.ts`, `app/api/bookings/...`).
   - Simplify booking creation/update flows to avoid table allocation; rely on capacity rules (Placeholder logic: maybe assume unlimited or use new rules in later iteration).
   - Strip waitlist-related code paths, analytics events, and payloads.
   - Update utilities (`scripts/verify-*`, tests) to match the new schema.

5. **Adjust client apps**
   - Update reserve wizard, dashboards, and emails to remove table & waitlist terminology.
   - Surface new operational data placeholders if needed (e.g., show service period name or note capacity rules TBD).

6. **Testing & verification**
   - Run linting, typecheck, unit/integration tests.
   - Validate migrations on a local Supabase instance (dry-run, ensure no leftover references).
   - Document schema changes in relevant markdown (database checklist, migration notes).

## Risk mitigation & follow-ups

- Large blast radius: coordinate incremental commits if necessary.
- Potential data loss for existing `restaurant_tables` records — capture/export before dropping.
- Defer implementing actual capacity logic until requirements clarified; ensure new tables don’t block existing flows if unused initially.
