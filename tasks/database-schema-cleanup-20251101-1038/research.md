# Research: Database, Migration, and Schema Cleanup

## Requirements

- Functional:
  - Inventory database structure, migrations, seeds, and Supabase-specific assets.
  - Produce a cleanup plan that flags redundant/conflicting/orphaned migrations, unused schema pieces, and stale models.
  - Recommend scripts and documentation updates for a clean baseline.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Must respect "remote only" Supabase policy (no local DB mutations).
  - Preserve data safety by requiring backups and rollback plans.
  - Maintain traceability via SDLC task artifacts.

## Existing Patterns & Reuse

- Supabase-first stack with SQL migrations under `supabase/migrations` (48 timestamped `.sql` files dated 20251019–20251103).
- Generated schema snapshot at `supabase/schema.sql` and type bindings in `types/supabase.ts` consumed by server modules.
- Seeds orchestrated via `supabase/utilities/init-seeds.sql` and `supabase/seeds/*.sql`; `package.json` exposes `db:*` scripts sourcing `.env.local`.
- Server code uses Supabase SDK (`server/supabase.ts`) and table access via `.from("<table>")`; no ORM detected (direct PostgREST usage).
- Existing cleanup/automation utilities (e.g., `cleanup.sh`, `cleanup.py`, `squash_migrations.sh`) may be leveraged or consolidated.
- Extensive Supabase documentation artifacts (`SUPABASE_SCHEMA_EXPORT_GUIDE.md`, `SUPABASE_ORGANIZATION_COMPLETE.md`, `SEED_DATA_SUMMARY.md`, etc.) provide historical context.

## External Resources

- `SUPABASE_SCHEMA_EXPORT_GUIDE.md` – prescribes export process and remote-only safety.
- `SUPABASE_ORGANIZATION_COMPLETE.md` – prior reorganization log (appears stale vs current file layout; needs reconciliation).
- `SEED_DATA_SUMMARY.md` & `SEED_SCALE_SUMMARY.md` – describe seed coverage and scale considerations.
- Supabase CLI docs (implicit dependency via project policies).

## Constraints & Risks

- Remote-only migrations; accidental local execution could diverge from policy.
- Multiple `remote_schema` dump migrations and procedural hotfix chains indicate potential duplication and drift.
- Docs claim orchestrator files (`init-database.sql`) that currently differ (placeholder vs promised behavior) – risk of outdated instructions.
- `package.json` references `scripts/verify-database.sh`, but file absent → risk of broken workflow.
- Backup directory `backups/supabase-backup-20251017-132504` with seeds may contain stale data snapshots needing retention decisions.
- Need to ensure no active branches rely on deprecated tables before deletion (requires coordination beyond repo scan).

## Open Questions (owner, due)

- Is the authoritative schema source the latest migrations or the `schema.sql` snapshot? (Owner: TBD, Due: before consolidation.)
- Are multiple `remote_schema.sql` dumps intentional (e.g., for documentation) or should they be replaced by a single baseline? (Owner: TBD.)
- Do existing application flows depend on tables flagged for removal (needs feature owner confirmation). (Owner: TBD.)
- Which automation script (if any) currently removes legacy migrations, and can we reuse it? (Owner: TBD.)

## Recommended Direction (with rationale)

- Perform chronological audit of `supabase/migrations` to detect redundant dumps, hotfix chains, and conflicting DDL; align with `types/supabase.ts` usage.
- Cross-reference Supabase table references in `/server` modules (via `rg ".from(\""`) to map live entities vs unused tables.
- Catalog seeds, backups, and documentation to decide which remain relevant; deprecate stale ones with justification.
- Propose consolidation into a squashed baseline migration (`20251019102432_consolidated_schema.sql` or newer) plus targeted deltas; remove superseded dump-style files.
- Author a scripted cleanup (likely bash) performing backups, pruning obsolete assets, and regenerating schema snapshot; ensure idempotence and safety prompts.
- Update documentation (`README`, `SUPABASE_*` guides) to reflect the cleaned structure and remote-only workflow.
