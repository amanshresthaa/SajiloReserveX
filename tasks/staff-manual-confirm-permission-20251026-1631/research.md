# Research: Staff Manual Confirm Permission Fix

## Existing Patterns & Reuse

- Manual hold APIs (`src/app/api/staff/manual/hold/route.ts`) already use the route-handler Supabase client to fetch the hold row before checking membership. Successful responses there imply user-level SELECT access is normally available once privileges are granted.
- Core hold logic lives in `server/capacity/holds.ts` and defaults to the service Supabase client for mutations/reads that require elevated access—no changes needed there if user-level read is restored.
- Supabase schema baseline (`supabase/migrations/20251019102432_consolidated_schema.sql`) explicitly GRANTs table privileges (e.g., `GRANT SELECT ON TABLE ... TO "authenticated";`) after creating shared tables.

## External Resources

- Supabase docs on [Managing table privileges](https://supabase.com/docs/guides/auth/row-level-security#realtime-rls-and-privileges) – confirms new tables need explicit GRANT statements for non-owner roles when RLS is disabled.

## Constraints & Risks

- `table_holds` and `table_hold_members` were introduced in `supabase/migrations/20251026104700_add_table_holds.sql` / `20251026161309_add_table_holds_unconditional.sql` without any GRANT statements. As a result, authenticated users receive `permission denied` when the API performs `select` through the route client.
- Adding GRANTs via migration must run against the remote Supabase instance (per AGENTS.md remote-only policy); ensure migration is idempotent for environments that may already have manual grants applied.
- Granting SELECT without RLS means the server can read all hold rows; API must continue enforcing membership checks before exposing data to the client (already in place).

## Open Questions (and answers if resolved)

- Q: Do we also need SELECT on `table_hold_members` for route-level queries?
  A: Not urgently for the failing endpoint, but safe to include because future UI/API reads may join hold members, and privilege symmetry avoids similar regressions.

## Recommended Direction (with rationale)

- Add a new Supabase migration that (a) ensures `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` remains disabled (no change) and (b) issues `GRANT SELECT ON TABLE public.table_holds TO authenticated;` and the counterpart for `table_hold_members`. This mirrors existing privilege patterns and unblocks the confirm/delete flows without code changes.
- After granting, rerun manual confirm flow to verify the 500 error disappears and downstream RPC call succeeds.
