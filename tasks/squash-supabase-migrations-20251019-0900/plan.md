# Implementation Plan: Squash Supabase Migrations

## Objective

We will consolidate the Supabase migration history into a single authoritative SQL file so schema management becomes simpler while preserving the current production structure.

## Success Criteria

- [x] Legacy migrations backed up and removed from `supabase/migrations/`, leaving a single consolidated SQL file.
- [x] Backups (migrations directory + full schema) stored under `backups/<timestamp>/`.
- [x] Consolidated seed populates every core table and enum value when replayed via `supabase db reset --linked`.
- [ ] `supabase db diff` returns no unexpected changes once remote reset completes and schema is reconciled.

## Architecture & Components

- Filesystem changes within `supabase/migrations/` and `backups/`.
- Supabase CLI usage: `supabase db dump`, `supabase db reset --linked`, `supabase migration list`, `supabase db diff`.
- Helper script `squash_migrations.sh` to encapsulate the workflow.

## Data Flow & API Contracts

- CLI interacts with the linked Supabase project using the authenticated profile; no application APIs change.
- Dumps captured via `supabase db dump --file <path>`.
- Reset replays the single migration plus `supabase/seed.sql` onto the remote database.

## UI/UX States

- Loading: CLI progress logs.
- Success: CLI reports migration applied and seeds executed.
- Error: Non-zero exit code with Supabase CLI error message; requires manual intervention.

## Edge Cases

- Reset wiping remote data; ensure backup taken before proceeding.
- Potential schema drift if consolidated file misses objects (e.g., policies, triggers); monitor `supabase db diff` output.
- Seed script assumptions could fail after reset—confirm no errors in CLI output.

## Testing Strategy

- Run `supabase migration list` to verify remote history shows only the consolidated migration.
- Run `supabase db diff` to detect residual drift; investigate any remaining statements (currently reports multiple drops to reconcile).
- Optional: inspect key tables/functions in the consolidated SQL for completeness.

## Rollout

- Reset already executed against the linked remote project; coordinate announcement with stakeholders due to data wipe.
- Monitor application logs and Supabase dashboard for errors post-reset.
- Prepare rollback by restoring backups if unintended issues arise.
