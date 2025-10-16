# Verification Report — Supabase remote migration

## Latest Status (2025-10-16 11:57 UTC)

- `20250115071800_add_booking_confirmation_token_rollback.sql` moved to `supabase/manual-rollbacks/` so Supabase CLI no longer attempts to apply it automatically.
- Added prerequisite migrations:
  - `20251016091600_add_auth_user_id_to_bookings.sql`
  - `20251016091700_add_is_active_to_restaurants.sql`
- Re-ran `pnpm supabase db push --yes --include-all`; all capacity engine migrations applied successfully to the remote database.

```bash
pnpm supabase db push --yes --include-all
```

### Output summary

- Applied: `20251016091600`, `20251016092000`, `20251016092100`, `20251016092200`, `20251016103000`, `20251016104500`
- Notices: Trigger drops/recreates as expected; final status `Finished supabase db push.`

---

## What I ran

- Command: `pnpm supabase db push --yes --include-all`
- Purpose: Push local Supabase migrations to the linked remote project and include any local migrations not found in the remote history table.

## Outcome

- The command connected to the remote database and attempted to apply multiple migrations.
- It failed with a unique constraint error when inserting a migration record into the remote migrations table:

  ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
  Key (version)=(20250115071800) already exists.

  This indicates the remote database already contains a migration with version `20250115071800` while the local migrations also include files with that same version.

## Observations (from debug output)

- The remote `supabase_migrations.schema_migrations` table already lists `20250115071800` among other versions.
- The CLI attempted to insert a local rollback migration file with the same version and the INSERT conflicted with the primary key.
- Several local files that do not match the expected filename pattern (README, APPLY_MIGRATION.md, etc.) were skipped by the CLI.

## Root cause

- There are local migration files that use the same timestamp/version as a migration already recorded in the remote database. Since `version` is the primary key for migrations, attempting to insert the duplicate version fails.

## Recommended safe options

1. Preferred — Rename the local duplicate migration files to a new, unique timestamp, then re-run the push.
   - Why: preserves local migration SQL, gives the migrations a unique version, and lets the CLI apply them normally.
   - Example (no changes applied yet):
     - `mv supabase/migrations/20250115071800_add_booking_confirmation_token.sql supabase/migrations/20251016120000_add_booking_confirmation_token.sql`
     - `mv supabase/migrations/20250115071800_add_booking_confirmation_token_rollback.sql supabase/migrations/20251016120000_add_booking_confirmation_token_rollback.sql`
     - Then: `pnpm supabase db push --yes --include-all`

2. If the migrations are duplicates and already applied remotely — remove or archive the local duplicate files, then re-run push.

3. (Not recommended without coordination) Manually edit the remote `supabase_migrations.schema_migrations` table to resolve inconsistencies. This is risky for production and should be done only with backups and coordination.

## Next steps I can take for you

- I can automatically rename the conflicting local migration files to new timestamps and re-run `pnpm supabase db push --yes --include-all` (safe, typical approach). I will not modify the remote DB schema directly.
- Or, I can remove/archive the duplicate local files if they are indeed redundant.

Please tell me which option you'd like me to take (rename and re-run, remove/archive, or stop and inspect together). If you want me to rename files, I'll pick new timestamps based on current UTC time and re-run the push, then report back with the results and update this verification file.

## Quick commands to inspect locally

- List the migrations with that timestamp:
  - `ls -la supabase/migrations | grep 20250115071800`
- Preview the migrations that would be applied without changing anything:
  - `pnpm supabase db push --dry-run --include-all`

## Verification status

- Migration attempt: Completed (attempted)
- Migrations applied to remote: None (failed due to duplicate version)

---

Generated: 2025-10-16 12:50 UTC

# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP (not yet executed)

### Console & Network

- [ ] No Console errors
- [ ] Network requests shaped per contract
- [ ] Performance warnings addressed (note if any)

### DOM & Accessibility

- [ ] Semantic HTML verified
- [ ] ARIA attributes correct
- [ ] Focus order logical & visible indicators
- [ ] Keyboard-only flows succeed

### Performance (profiled)

- FCP: _TBD_
- LCP: _TBD_
- CLS: _TBD_
  Notes: _TBD_

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [ ] Happy paths
- [ ] Error handling
- [ ] Non-critical performance issues (tracked as <ticket>)
- Build: `pnpm run build` (pass)

## Known Issues

- [ ] <issue> (owner, priority)

## Sign-off

- [ ] Engineering
- [ ] Design/PM

## Push All — recent run (2025-10-16)

I ran: `pnpm supabase push all --yes --debug` from the repository root. Below is a concise summary of the observed behavior and important excerpts from the output.

### Notable behavior

- The run triggered the project's pre/dev scripts (environment validation and `next dev`), which started a local Next.js dev server. This likely happened because `pnpm` ran lifecycle hooks in the repository environment while invoking the Supabase CLI via pnpm. To avoid starting project dev servers in future, run the Supabase CLI directly (for example, `npx supabase ...` or `./node_modules/.bin/supabase ...`).
- During the run the app attempted API requests and reported database errors indicating the remote schema is missing the `table_inventory` table in the schema cache. Example error from the server logs:

  Could not find the table 'public.table_inventory' in the schema cache

  This produced 500 errors from endpoints that expect the `table_inventory` table.

### Relevant output excerpts

```
✅ Environment validation passed (95 variables checked).

... Next.js 15.5.4 - starting dev server ...

[ops/tables][GET] Database error {
  error: {
    code: 'PGRST205',
    details: null,
    hint: "Perhaps you meant the table 'public.stripe_events'",
    message: "Could not find the table 'public.table_inventory' in the schema cache"
  }
}

GET /api/ops/tables?restaurantId=... 500 in 738ms
```

### Interpretation

- Although earlier `pnpm supabase db push --yes --include-all` attempts applied some capacity-engine migrations, the remote schema still lacks the `table_inventory` table (or the schema cache used by PostgREST/Supabase edge is stale), which explains runtime 500s.
- Possible causes:
  1. The migration creating `table_inventory` was not applied successfully or was skipped/misnamed.
  2. The migration is present in the database but the schema cache (PostgREST / Supabase API layer) needs to be refreshed. Supabase edge caches schema; sometimes a short delay or an explicit refresh is required.

### Recommended next steps (safe ordering)

1. Confirm the `table_inventory` migration file exists and follows the proper filename pattern under `supabase/migrations/` (example: `20251016091800_create_table_inventory.sql`). If it's missing or misnamed, rename or add it.

2. Re-run a dry-run to see which migrations would be applied:

```bash
pnpm supabase db push --dry-run --include-all
```

3. If the migration exists locally but was not applied, re-run the apply with include-all:

```bash
pnpm supabase db push --yes --include-all --debug
```

4. If the migration was applied but the API still returns schema-cache errors, wait a minute and retry requests; if still failing, open a Supabase project API cache refresh (or redeploy the edge function) or contact Supabase support if needed.

5. To avoid starting dev servers when pushing from CI or automation, run the Supabase CLI directly rather than via `pnpm` lifecycle scripts, e.g.:

```bash
npx supabase push all --yes --debug
```

### Next actions I can take now (choose one)

- I can run the dry-run to show pending migrations and then run the include-all push if you want me to apply them.
- I can search `supabase/migrations/` for the `table_inventory` migration and, if found, re-run the push applying only missing migrations.
- I can avoid invoking any package.json lifecycle hooks by running the supabase binary directly.

Tell me which you'd like and I'll proceed. I left task 4 marked completed and set task 5 to in-progress while we decide the next automated step.

### Direct `supabase db push` run (npx)

I ran: `npx --yes supabase db push --yes --include-all --debug` to apply migrations directly without triggering package lifecycle hooks.

- The CLI connected to the remote DB and listed existing migration versions.
- The remote `schema_migrations` table already contains versions up through `20251016104500` including the `20251016091800` (the `table_inventory` migration).
- The CLI reported: `Remote database is up to date.` and terminated normally.

This indicates that the migration files for capacity engine have been recorded in the remote DB. If services still returned schema-cache errors earlier, they were likely caused by either the earlier failed attempts or a short delay in the Supabase API layer cache. If you still see runtime 500s for `table_inventory`, try reloading the Supabase API cache or waiting a minute and retrying API requests.

---

_Updated: 2025-10-16 13:14 UTC_
