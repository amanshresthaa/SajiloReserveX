# Plan: Restore `/profile/manage` access

## Context recap

- Authenticated users hitting `/profile/manage` trigger `getOrCreateProfile`, which performs SELECT/UPSERT on `public.profiles` (`lib/profile/server.ts`).
- RLS policies allow `auth.uid() = id`, but the table lacks explicit grants for the `authenticated` role (`supabase/migrations/20241006000008_create_profiles_table.sql`).
- Result: Postgres raises `42501 permission denied for table profiles` before RLS evaluates.

## Implementation steps

1. **Grant privileges via migration**
   - Create a new Supabase migration (e.g. `20241105000018_grant_profiles_authenticated.sql`).
   - Follow existing grant migrations: include a short comment header, then `GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;`.
   - Run formatting check if applicable (file is plain SQL; no formatter hook).
2. **(Optional) Document grant rationale**
   - If desired, mention grant addition in `DATABASE_CHECKLIST.md` or similar operational docs; confirm whether prior grants were tracked. (Skip if redundant.)

## Verification

- After adding the migration, run a targeted Supabase check (e.g. `pnpm supabase db lint` or apply migration locally) and confirm it succeeds.
- Optionally smoke-test `/profile/manage` locally once the database migrates, ensuring the page loads without 42501 errors.
