# Research: DB Schema Mismatch

## Requirements

- Functional:
  - Restore the ops dashboard assignment flow so `/api/ops/dashboard/assign-tables` no longer returns 500 due to missing columns (`server/capacity/tables.ts:2740` derives the API error).
  - Enable `strategic-config` loading from the database instead of falling back to env defaults when querying `strategic_configs` (`server/capacity/strategic-config.ts:118`).
- Non-functional (a11y, perf, security, privacy, i18n):
  - Apply schema updates via remote Supabase only (per `AGENTS.md` §6).
  - Ensure migrations are idempotent and safe to run against production-sized data sets (minimal locking, null-safe defaults).
  - Maintain existing RLS/security posture on affected tables/functions.

## Existing Patterns & Reuse

- Supabase migrations already follow idempotent `DO $$ BEGIN ... END; $$` blocks that guard against reapplying changes (e.g., `supabase/migrations/20251026104800_booking_table_assignments_group.sql` adds `merge_group_id` with `IF NOT EXISTS` checks).
- Strategic config loading expects a table with numeric columns and falls back gracefully when schema is missing (`server/capacity/strategic-config.ts:118`), so once the table/columns exist no code changes should be required.
- Prior task plan (`tasks/booking-rejection-analysis-20251031-0849/plan.md`) documents the intended `strategic_configs` schema (weights, penalties, metadata), which can anchor the final DDL.

## External Resources

- [Supabase CLI – `supabase db push`](https://supabase.com/docs/guides/cli/local-development#push-your-database-schema-changes) for applying pending SQL migrations remotely (ensures migration ordering and state tracking).

## Constraints & Risks

- Remote-only migrations: we must target the correct Supabase project via `SUPABASE_DB_URL` and cannot validate via local Docker.
- The production database may already contain a `strategic_configs` table with a divergent schema; blindly recreating it risks data loss—DDL must handle both “table missing” and “table exists without required columns”.
- Adding `merge_group_id` touches `booking_table_assignments`, a hot table; the `ALTER TABLE ... ADD COLUMN` should be quick but still requires caution during peak traffic.
- Any new RLS or grant statements need to preserve existing service roles; missing grants could break live traffic.

## Open Questions (owner, due)

- Q: Which remote environment should the migrations target first—staging, production, or both? (Owner: TBD, Due: before implementation)  
  A: Apply to both; stage first, then production after validation.
- Q: Does the existing `strategic_configs` table hold data that requires backfill into the new numeric columns? (Owner: TBD, Due: before rollout)  
  A: Yes—migrations must map any legacy `weights` JSON into the new numeric columns before dropping it (staging currently empty).

## Recommended Direction (with rationale)

- Inspect the remote schema (via Supabase CLI `db pull` or `pg_table_def`) to confirm the absence of `booking_table_assignments.merge_group_id` and `strategic_configs.scarcity_weight`, establishing the exact delta.
- Ship an idempotent migration that (a) adds `merge_group_id` and related FK/index if missing and (b) ensures `strategic_configs` has the expected numeric columns and metadata—reusing/expanding existing migrations to avoid manual SQL.
- Apply the migrations remotely using Supabase CLI with the correct connection string, documenting the rollout/rollback steps in `plan.md` and `verification.md`.
- After schema alignment, rerun `/api/ops/dashboard/assign-tables` and strategic config lookups to confirm the RPC succeeds and no env fallback occurs; capture results in `verification.md`.
