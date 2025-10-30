# Research: Feature Flag Overrides

## Requirements

- Functional: Restore successful reads from `public.feature_flag_overrides` so feature flag overrides load without PostgREST schema cache errors in all environments (the current failure logs `[feature-flags][overrides] failed to fetch overrides ... "Could not find the table 'public.feature_flag_overrides' in the schema cache"`).
- Non-functional (a11y, perf, security, privacy, i18n): Maintain existing fallback behaviour, avoid additional Supabase round-trips, respect "remote-only" DB policy, and keep secrets/env management unchanged.

## Existing Patterns & Reuse

- `server/feature-flags-overrides.ts` already centralises override fetching via the service Supabase client and caches results for 30s. Error handling is in place but currently logs the schema error every refresh.
- Supabase migration `supabase/migrations/20251029165000_feature_flag_overrides.sql` creates the table, grants, and uniqueness constraint. No schema reload notification is issued after the DDL.
- Generated Supabase typings at `types/supabase.ts:774` expose the table shape, so downstream TypeScript calls compile once the API surface is reachable.
- Tests in `tests/server/featureFlags.overrides.test.ts` codify fallback behaviour when Supabase returns a missing-table error, keeping us guarded against regressions.

## External Resources

- [Supabase docs — PostgREST schema cache](https://supabase.com/docs/guides/database/postgres/schema-cache) explains that `NOTIFY pgrst, 'reload schema'` (or `ALTER EXTENSION pgrst VERSION ...`) is required after DDL so the REST layer sees new tables without a service restart.
- Internal runbooks such as `SUPABASE_SCHEMA_EXPORT_GUIDE.md` reinforce the remote-only discipline and safe migration practices for this repo.

## Constraints & Risks

- Remote database only: we must apply any schema/cache refresh through sanctioned remote migrations or Supabase MCP tooling—no local Postgres tinkering.
- The existing migration has likely already run in shared environments; modifying it retroactively would not help the deployed schema and risks divergence between environments.
- Triggering a schema reload must be idempotent to avoid spamming notifications while still guaranteeing the REST cache updates.
- Need to confirm the remote project actually has the table present; if not, simply reloading the schema cache will not resolve the error.

## Open Questions (owner, due)

- Q: Does the remote `development` scope already contain the `public.feature_flag_overrides` table (i.e., migration succeeded, only cache stale)? (owner: codex, due before implementation)
  A: Pending verification via Supabase MCP introspection or coordination with maintainers.

## Recommended Direction (with rationale)

- Ship a follow-up SQL migration that (1) asserts/creates the table if missing, and (2) sends `NOTIFY pgrst, 'reload schema'` to refresh PostgREST, ensuring the REST API sees the table without requiring manual intervention. This keeps history intact and works across environments that may or may not yet have the table.
- As part of verification, use Supabase MCP to confirm the table exists post-migration and that the API endpoint resolves without cache errors.
- Retain existing TypeScript handling so runtime falls back gracefully; success is evidenced by absence of schema-cache warnings in logs and overrides being honoured when present.
