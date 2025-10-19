# Research: Squash Supabase Migrations

## Existing Patterns & Reuse

- Migrations live in `supabase/migrations/` and follow Supabase CLI timestamp naming; prior history shows 30+ files from `20250101000000_remote_schema.sql` through `20251019085441_remote_schema.sql`.
- No existing automation for squashing migrations; previous work was manual via Supabase CLI commands.

## External Resources

- [Supabase CLI docs – db dump](https://supabase.com/docs/reference/cli/supabase-db-dump) for exporting schema backups.
- [Supabase CLI docs – db reset](https://supabase.com/docs/reference/cli/supabase-db-reset) for replaying migrations on linked projects.

## Constraints & Risks

- Repository policy mandates **remote-only** Supabase access; destructive commands against shared environments require explicit approval and documentation.
- Squashing removes incremental history, so backups (SQL + schema) are essential for rollback or forensic diffing.
- `supabase db reset --linked` drops all data in the remote project; coordinate timing and ensure seeds handle required bootstrapping.
- Seed scripts must respect Supabase triggers (table adjacency symmetry, merge-group connectivity) and enum constraints—cross-zone allocations or invalid enum values will cause seeding to fail.

## Open Questions (and answers if resolved)

- Q: Are additional environment variables or profiles required for Supabase CLI?  
  A: Existing CLI profile already authenticated; no extra env captured during this run.
- Q: Can we run local Supabase commands for validation?  
  A: Policy discourages local resets; we validated via remote reset once approval was given.

## Recommended Direction (with rationale)

- Back up the existing migrations directory and full schema before making changes so rollback is straightforward.
- Replace the 33 legacy migration files with a single consolidated SQL dump representing the current production schema.
- Use the Supabase CLI helper script (`squash_migrations.sh`) to keep the workflow reproducible and to document each step.
- After consolidation, reset the linked remote database so it replays the lone migration, then verify with `supabase migration list` and `supabase db diff`.
- Author a consolidated seed (`supabase/seeds/seed.sql`) that exercises each public table, enum, and trigger-supported workflow so the reset environment is immediately usable.
