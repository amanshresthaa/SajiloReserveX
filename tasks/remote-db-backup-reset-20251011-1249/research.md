# Research: Remote Supabase Backup & Reset

## Current Knowledge

- `AGENTS.md` requires working directly with remote Supabase; backups and destructive operations must be coordinated.
- Existing scripts mainly target local Docker (`supabase_db_...`); new scripts should work with remote connection strings.
- `supabase/create-database.sql` orchestrates baseline + incremental migrations.
- Seeds live in `supabase/seed.sql`; clean workflow should run migrations before seeding.

## Backup Options

- Supabase CLI `supabase db dump` or standard `pg_dump` using `SUPABASE_DB_URL`.
- Backups should be timestamped and stored under a predictable directory (e.g., `backups/remote`).

## Wipe Approach

- Dropping/recreating `public` schema is safe if we immediately replay migrations; must avoid touching Supabase-managed schemas (`auth`, `storage`, etc.).
- Provide SQL script to perform schema wipe along with prompts reminding about backups.

## Rebuild Workflow

1. Take a backup (pg_dump).
2. Wipe `public` schema.
3. Replay `supabase/create-database.sql`.
4. Seed via `supabase/seed.sql`.
5. Run verification queries (optional script).

## Considerations

- Scripts should support sourcing environment variables from `.env.local`.
- Use `set -euo pipefail` and confirmation prompts for destructive actions.
- Document usage in repository docs for future operators.
