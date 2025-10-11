# Implementation Plan: Remote DB Backup & Reset Scripts

## Objective

Provide scripts and SQL to safely back up the remote Supabase database, wipe it, replay migrations, and reseed data.

## Success Criteria

- [x] Backup script producing timestamped `pg_dump` using `SUPABASE_DB_URL`.
- [x] Wipe SQL dropping/recreating `public` schema only.
- [x] Clean script orchestrating wipe → migrations → seed with confirmation prompt.
- [x] Documentation updated with workflow.
- [x] Scripts accept environment sourcing for convenience.

## Approach

- Implement shell scripts under `scripts/` with `set -euo pipefail`.
- Support optional `--env` flag to source `.env.local`.
- Use `psql` to execute SQL files.
- Ensure instructions emphasise taking backups first.

## Steps

1. Create `scripts/backup-remote-db.sh` (wrap `pg_dump`).
2. Create `supabase/wipe-public-schema.sql`.
3. Create `scripts/clean-remote-db.sh` with confirmation and env support.
4. Update documentation referencing new workflow.
5. Record verification notes.

## Verification

- Manual review of scripts (no destructive execution here).
- Validate doc links.

## Rollout

- Share instructions with team post-merge; require explicit confirmation before running.
