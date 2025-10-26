# Research: Table Holds Permission Fix

## Existing Patterns & Reuse

- `server/supabase.ts` exposes `getServiceSupabaseClient()` which should use the Supabase service-role key for privileged operations.
- `server/capacity/holds.ts` already wraps all `table_holds` access behind that service client and defensive helpers (`isPermissionDeniedError`)—no need to rework call sites once the DB grants are correct.
- Supabase migration `20251026164913_add_table_holds_rls.sql` attempts to enable RLS and grant `service_role`/`authenticated` the necessary privileges.

## External Resources

- Supabase docs on [Managing Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) – confirm grants + policies behaviour for service role vs authenticated users.
- Supabase CLI docs for [`supabase db push`](https://supabase.com/docs/guides/cli/local-development#supabase-db-push) – required to apply pending migrations remotely.

## Constraints & Risks

- Environment policy forbids running Supabase locally; all schema changes must target the remote instance.
- Missing grants cause 500s for manual hold creation (`/api/staff/manual/hold`), blocking ops workflows—urgent fix.
- Applying migrations against production data needs caution; ensure SQL is idempotent and only modifies privileges/rls (no destructive changes).

## Open Questions (and answers if resolved)

- Q: Is the service-role key present but lacking privileges or entirely missing?
  A: Present in `.env.local` (length 219) and distinct from the anon key, but querying `table_holds` with it returns `42501 permission denied`.
- Q: Do we already ship SQL that should grant access?
  A: Yes (`20251026164913_add_table_holds_rls.sql`), but it appears not applied remotely yet—`supabase db push` likely not rerun after adding it.
- Q: Do authenticated users also need read access?
  A: Yes; the same migration adds a read policy for authenticated staff. Without it, hydrated contexts skip hold info (observed warnings).

## Recommended Direction (with rationale)

- Apply the pending Supabase migrations remotely (`supabase db push`) so `table_holds`/`table_hold_members` receive the grants + RLS policies. This aligns with existing migration files and avoids code changes.
- After push, re-run a service-client query (or the manual hold flow) to verify permissions are granted and 500s disappear.
