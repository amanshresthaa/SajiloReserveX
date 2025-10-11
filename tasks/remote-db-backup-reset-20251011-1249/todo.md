# Implementation Checklist

## Scripts

- [x] Write `scripts/backup-remote-db.sh` with timestamped pg_dump using `$SUPABASE_DB_URL`.
- [x] Create `supabase/wipe-public-schema.sql` to drop/recreate `public` schema safely.
- [x] Write `scripts/clean-remote-db.sh` orchestrating wipe + migrations + seeds (with env support).

## Documentation

- [x] Update `docs/database/migrations-and-patches.md` with backup/reset instructions.
- [x] Ensure usage guidance is embedded in scripts (help text, prompts).

## Verification

- [x] Dry-run review of scripts to ensure safety (no execution here).
- [ ] Execute scripts against remote (requires credentials/approval).
- [x] Noted manual steps: take backup before clean, confirm environment.
