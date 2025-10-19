# Research: Grant Restaurant Access

## Existing Patterns & Reuse

- Supabase schema defines access via `auth.users`, `public.profiles`, and `public.restaurant_memberships` with roles (`owner`, `manager`, `host`, `server`).
- Seed script `supabase/seeds/seed.sql` already inserts operator accounts and memberships, providing a template for new access grants.
- No direct automation exists for granting access; we can reuse the SQL pattern from the seed script.

## External Resources

- `supabase/migrations/20251019102432_consolidated_schema.sql` – authoritative table/constraint definitions for memberships and profiles.

## Constraints & Risks

- `restaurant_memberships` has composite PK `(user_id, restaurant_id)` so duplicates will raise errors unless handled idempotently.
- Email values in `public.profiles` must be lowercase per `profiles_email_check`.
- `restaurant_memberships.role` limited to enum array; choose most appropriate (e.g., `manager` or `owner` depending on requirement).
- Need deterministic UUIDs to reference across tables; can use `gen_random_uuid()` or explicit ones.

## Open Questions (and answers if resolved)

- Q: Should this user be added as `owner` or `manager`?  
  A: Default to `manager` to grant broad access without implying ownership (per existing patterns).
- Q: Do we create an invite as well?  
  A: Not necessary if the user is inserted directly; optional instructions can mention sending invite if email must accept via UI.

## Recommended Direction (with rationale)

- Provide an idempotent SQL block that:
  1. Ensures the user exists in `auth.users` (upsert using Supabase's recommended columns).
  2. Upserts profile information in `public.profiles`.
  3. Inserts `restaurant_memberships` for every restaurant (`SELECT id FROM public.restaurants`) with desired role using `ON CONFLICT DO NOTHING`.
- Share execution instructions (psql/Supabase SQL editor) so maintainers can run against staging/production safely.
