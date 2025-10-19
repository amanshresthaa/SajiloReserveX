# Implementation Checklist

## Setup

- [x] Confirm Supabase CLI is installed (`supabase --version`) and project is linked.
- [x] Capture any environment-specific variables required for CLI authentication (existing profile already authenticated).

## Core

- [x] Create timestamped backup directory under `backups/`.
- [x] Copy existing `supabase/migrations` into the backup directory.
- [x] Dump current clean schema to `current_clean_schema.sql` (later removed after use).
- [x] Remove legacy migration files from `supabase/migrations/`.
- [x] Copy the schema dump into `supabase/migrations/<timestamp>_consolidated_schema.sql`.
- [x] Optionally generate `squash_migrations.sh` encapsulating the workflow.

## UI/UX

- [x] N/A (non-UI task)

## Tests

- [x] (Policy-approved) Run `supabase db reset --linked` to replay the consolidated migration on the remote project.
- [x] Run `supabase migration list` to confirm the new migration registers correctly.
- [x] Run `supabase db diff` to inspect schema differences (still reports drop statements requiring follow-up).
- [x] Record outcomes in `verification.md`, including deviations and outstanding issues.

## Notes

- Assumptions:
  - Supabase CLI profile already authenticated; no additional env vars required.
  - Remote reset acceptable once stakeholders approved data wipe.
- Deviations:
  - `supabase db diff` continues to emit drop statements; needs deeper reconciliation.
  - `supabase/seed.sql` now delegates to `supabase/seeds/seed.sql` where the consolidated data set lives.
  - Removed legacy Supabase docs/tests/utilities directories, leaving only `migrations/`, `seed.sql`, and `seeds/`.

## Batched Questions (if any)

- Do we want to commit to the drop statements reported by `supabase db diff`, or adjust the consolidated migration to include the missing objects so diff is clean?
