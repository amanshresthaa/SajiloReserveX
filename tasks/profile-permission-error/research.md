# Research: `/profile/manage` 42501 error

## Repro & symptoms

- Visiting `http://localhost:3001/profile/manage` immediately throws a Supabase/Postgres error with code `42501` (permission denied).
- The page is a server component that calls `getOrCreateProfile` before rendering `ProfileManageForm` (`app/(authed)/profile/manage/page.tsx`:14-33).
- Both the server component and the `/api/profile` route build Supabase clients with the anon key (`server/supabase.ts`) and rely on row-level policies for access.

## Code path highlights

- `getOrCreateProfile` (`lib/profile/server.ts`) first runs `select(PROFILE_COLUMNS).eq("id", user.id)`. If no row exists it calls `.upsert(...).select(...).single()`.
- RLS policies on `public.profiles` allow `auth.uid() = id` for SELECT/INSERT/UPDATE (`supabase/migrations/20241006000008_create_profiles_table.sql`).
- However, that migration never grants table privileges to the `authenticated` role; it only defines policies.

## Database privilege findings

- Supabase requires both a GRANT and an RLS policy. Without grants, Postgres raises `42501` even if RLS would pass.
- Existing migrations follow this pattern: core tables created in `20241006000001_initial_schema.sql` include `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated;`.
- Subsequent migrations add explicit grants when tables should be accessible (e.g. `20241105000016_grant_service_role_bookings.sql`).
- No migration grants privileges on `public.profiles` to `authenticated` (checked via `rg "GRANT .* profiles" supabase/migrations`).

## Hypothesis

- Authenticated users hit `/profile/manage`; Supabase maps them to the `authenticated` Postgres role. Because `public.profiles` lacks grants for that role, any SELECT/UPSERT attempts fail with `permission denied`.
- Adding `GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;` (and possibly `GRANT` on related future objects) should unblock access while letting existing RLS policies enforce ownership.

## Open questions

- Confirm whether anonymous users ever need read-only access; current UX requires authentication, so `authenticated` grant appears sufficient.
- Verify if additional objects (future triggers/functions) need grants, though current usage only touches table rows.
