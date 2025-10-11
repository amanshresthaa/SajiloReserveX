# Verification Report

## Manual Review

- [x] Confirmed `scripts/backup-remote-db.sh` validates env vars and wraps `pg_dump` correctly.
- [x] Reviewed `supabase/wipe-public-schema.sql` (drops/recreates `public` only).
- [x] Confirmed `scripts/clean-remote-db.sh` sources env files, prompts before destructive action, and runs wipe → migrate → seed.

## Execution Status

- [ ] Backup script executed against remote (pending credentials/approval).
- [ ] Clean script executed (destructive; run only after stakeholder sign-off).

## Notes

- Always run `scripts/backup-remote-db.sh` immediately before `scripts/clean-remote-db.sh`.
- Ensure `.env.local` includes `SUPABASE_DB_PASSWORD` when using `--env` flag.
