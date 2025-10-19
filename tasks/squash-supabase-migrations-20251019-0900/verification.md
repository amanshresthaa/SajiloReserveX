# Verification Report

## Summary

- Non-UI change; Chrome DevTools MCP verification not applicable.
- Consolidated migration generated, applied, and remote reset completed via Supabase CLI.
- Consolidated seed replays end-to-end, creating data for every public table and exercising all enumerated types (booking statuses, seating preferences, loyalty tiers, capacity override types, etc.).

## Supabase CLI Checks

- `supabase migration list`: ✅ remote and local both show only `20251019102432_consolidated_schema.sql`.
- `supabase db reset --linked --yes`: ✅ remote database dropped, migration replayed, and the delegated `supabase/seeds/seed.sql` script executed without errors (adjacency/merge guards satisfied).
- `supabase db diff --linked`: ⚠️ emits a long series of `REVOKE` statements against anon/authenticated/service_role plus a request to drop the `pg_net` extension. This appears to be Supabase baseline grants/extensions that are not captured in the consolidated SQL; needs follow-up before we can say diff is clean.

## Follow-ups / Known Issues

- Investigate `supabase_diff_output.sql` / `supabase db diff --linked` output to decide whether to encode Supabase-managed grants/extensions in the consolidated migration or accept them as platform defaults.
- Confirm seeded data meets application expectations after the destructive reset.
