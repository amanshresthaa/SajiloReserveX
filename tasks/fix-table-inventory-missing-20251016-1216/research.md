# Research: Fix Missing table_inventory Table

## Existing Patterns & Reuse

- Supabase migrations already define the `table_inventory` table in `supabase/migrations/20251016091800_create_table_inventory.sql`.
- A companion rollback script exists at `supabase/migrations/20251016092200_capacity_engine_rollback.sql`, currently placed in the auto-run migrations folder.
- API handlers (`src/app/api/ops/tables`) and services (`src/services/ops/tables.ts`) already expect the `table_inventory` table.

## External Resources

- Supabase CLI docs on managing migrations and manual rollback scripts.

## Constraints & Risks

- Supabase remote database is authoritative; any schema change must be applied remotely.
- `supabase/migrations/20251016092200_capacity_engine_rollback.sql` drops the new tables when executed; it was executed automatically because it sits in the migrations directory.
- Remote DB currently lacks `table_inventory` (`to_regclass('public.table_inventory')` returned NULL), causing `/api/ops/tables` to fail.
- Removing or moving executed migrations requires careful handling to keep `supabase_migrations.schema_migrations` consistent.

## Open Questions (and answers if resolved)

- Q: Why was the table removed even though the create migration exists?
  A: The rollback migration in the same directory executed after the create migration, dropping `table_inventory`.

## Recommended Direction (with rationale)

- Move the rollback script into `supabase/manual-rollbacks/` so future deploys do not auto-run it.
- Use `supabase migration repair` to mark the capacity engine migrations as reverted, then reapply them remotely (`supabase migration up --include-all`) to recreate all dropped objects.
- Regenerate Supabase types once the schema is restored so API code has up-to-date typings.
