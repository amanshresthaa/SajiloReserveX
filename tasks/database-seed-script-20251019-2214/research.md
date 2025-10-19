# Research: Database Seed Script

## Existing Patterns & Reuse

- `supabase/seed.sql` simply delegates to `supabase/seeds/seed.sql`, but both files are stubs; no reusable seed content currently exists.
- The consolidated Supabase schema is captured in `supabase/migrations/20251019102432_consolidated_schema.sql`; this is the authoritative source for table/enum definitions.
- Existing RLS policies and `auth.users` references mean we should mirror Supabase's usual pattern of inserting support records (e.g., profiles, memberships) with deterministic UUIDs for easy cross-linking.

## External Resources

- `SUPABASE_SCHEMA_EXPORT_GUIDE.md` – documents how schema dumps are created; confirms we should target the consolidated schema file when generating seeds.
- Supabase default `auth.users` schema (implicit) – required to understand mandatory columns when inserting linked application profiles.

## Constraints & Risks

- Foreign keys require inserts in dependency order: `restaurants → zones → allowed_capacities → table_inventory → bookings → …`.
- Several enums (`booking_status`, `table_status`, `loyalty_tier`, etc.) must be exercised; forgetting values would limit downstream testing.
- Some generated columns (`customers.email_normalized`, `phone_normalized`) and check constraints (e.g., `customers_email_check`, `restaurant_invites_role_check`) enforce strict data formats.
- References to `auth.users` mean we either need to seed that schema or avoid creating dependent rows; omitting users would prevent seeding `profiles` and `restaurant_memberships`.

## Open Questions (and answers if resolved)

- Q: Do we need to seed Supabase `auth.users` directly?
  A: Yes—`profiles.id` has a FK to `auth.users(id)`. We'll include minimal `auth.users` inserts featuring required system columns.
- Q: Should `_migrations` be populated?
  A: No new rows required; Supabase manages this internally.

## Recommended Direction (with rationale)

- Produce a single deterministic SQL script (likely `supabase/seeds/seed.sql`) that uses explicit UUID constants and `WITH`-scoped CTEs to create records in dependency order, ensuring constraints pass.
- Group inserts by domain (core restaurant, capacity + tables, customers + loyalty, bookings, analytics/audit) so maintainers can reason about the data.
- Cover every enum at least once, include variety in boolean flags, and provide realistic timestamps/JSON payloads to support analytics and reporting use-cases.
