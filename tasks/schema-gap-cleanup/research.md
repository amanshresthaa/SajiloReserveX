# Research: Schema cleanup for operational features

## Data sources consulted

1. `supabase_full_dump.sql` and `current.sql` — provide the authoritative Postgres schema snapshot.
2. `types/supabase.ts` — generated Supabase client typings confirming exposed tables/columns.
3. Repository search (`rg`) for operational keywords (operating hours, service periods, waitlist, restaurant_tables) to uncover application usage.
4. `server/` and `app/api/` modules to see runtime dependencies on the current schema.

## Findings

### Operating hours / service periods

- Schema review (`supabase_full_dump.sql`, `current.sql`) shows **no table** storing restaurant opening hours, special closures, or service periods. Cross-checked by searching for `operating`, `hours`, `service_period` tokens — none exist.
- Application code also lacks models for operating hours; scheduling logic relies solely on bookings with `start_time`/`end_time`.

### Table assignment and `restaurant_tables`

- The `public.restaurant_tables` table exists with FK from `public.bookings.table_id` and numerous policies, indexes, and triggers. Verified in both dumps and `types/supabase.ts`.
- Extensive runtime usage: `server/bookings.ts`, `app/api/bookings/...`, `server/cache/availability.ts`, reservation wizard tests, analytics jobs, etc. All assume tables remain present even though auto-assignment logic is incomplete.
- Removing table assignments implies eliminating the `restaurant_tables` table, the `bookings.table_id` column / FK, associated policies, indexes, triggers, and code paths that join or expect table data.

### Waitlist references

- No dedicated waitlist table exists in the schema. However, multiple code paths reference waitlist behaviour:
  - `customer_profiles.last_waitlist_at` column.
  - Booking side-effect jobs (`server/jobs/booking-side-effects.ts`), analytics (`server/analytics.ts`), booking APIs, and reserve wizard state incorporate waitlist concepts.
  - Scripts such as `scripts/db/backfill-customers-loyalty.sql` expect waitlist-derived data.
- Removing waitlist logic therefore requires pruning columns (`last_waitlist_at`), event types (`booking.waitlisted`), analytics payloads, and code paths that branch on waitlisted state.

### Availability / capacity rules

- No schema objects define per-slot capacity rules or operating constraints. Verified by scanning for `capacity_rule`, `covers_per_slot`, `availability_rules`, etc. Booking throttling currently relies on per-table overlap checks and ad-hoc logic.

## Implications for implementation

- Dropping tables/columns (e.g. `restaurant_tables`, `bookings.table_id`, `customer_profiles.last_waitlist_at`) cascades into a large set of TypeScript type updates, API rewrites, and test adjustments.
- Introducing new tables for operating hours / service periods / capacity limits will require fresh migrations and server logic, but the immediate request emphasises **removing** table assignment and waitlist artefacts first.
- Need a carefully staged migration plan to avoid breaking Supabase policies and dependent code. Default privileges and grants must be updated to reflect removed objects.

## Open questions / risks

- Clarify whether any frontend flows still need a placeholder for “table choice”; removal may necessitate UI/UX adjustments.
- Determine whether downstream analytics / integrations rely on waitlist events; removing them could break reporting.
- Assess whether to add new tables (operating hours, service periods, availability rules) in this iteration or leave as documented gaps.
