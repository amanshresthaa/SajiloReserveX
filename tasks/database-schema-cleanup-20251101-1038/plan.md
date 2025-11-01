# Implementation Plan: Database, Migration, and Schema Cleanup

## Objective

Document a comprehensive cleanup strategy for database artifacts and prepare supporting scripts.

## Success Criteria

- [x] Repository assets inventoried with multi-angle verification.
- [x] Cleanup recommendations validated against code usage.
- [x] Backup and rollback strategies defined.

## Architecture & Components

- Supabase Postgres is the single source of truth; schema managed via timestamped SQL migrations under `supabase/migrations`.
- Application code talks to Supabase via `@supabase/supabase-js` across Next.js route handlers (`src/app/api/**`) and server utilities (`server/**`). No ORM abstraction exists; tables are referenced directly via `.from('<table>')`.
- Generated typings live in `types/supabase.ts` but lag behind actual usage (missing `leads`, `waiting_list`, etc.), indicating the schema snapshot/types regeneration pipeline is stale.
- Seeds under `supabase/seeds/` assume a rich dataset (booking slots, operating hours, loyalty, etc.) and rely on `supabase/utilities/init-seeds.sql` orchestration.
- Legacy automation (`cleanup.sh`, `cleanup.py`, `squash_migrations.sh`) and documentation directories (`SUPABASE_*`, `SEED_*`) provide prior attempts at structuring migrations but now diverge from reality.

## Data Flow & API Contracts

- CRUD flows and domain services interact with Supabase tables such as `bookings`, `booking_table_assignments`, `table_inventory`, `restaurant_memberships`, `loyalty_*`, `profile_update_requests`, etc.
- Several API endpoints (`src/app/api/config/merge-rules`, `/lead`, `server/bookings` waitlist methods) reference tables that are missing or dropped from migrations (`merge_rules`, `leads`, `waiting_list`).
- SQL functions (e.g., `assign_tables_atomic_v2`, `refresh_table_status`) undergo frequent redefinitions via migrations, often with slight variations, leading to layered overrides and potential drift.
- Observability and analytics flows depend on views/functions introduced in migrations (`capacity_selector_rejections_v1`, `observability_events` metrics) and require consistent grants.

## UI/UX States

- N/A (backend focused).

## Edge Cases

- Repeated `remote_schema` dump migrations clutter the timeline and risk unintended privilege resets when replayed.
- Hotfix cascades (`fix_assign_tables_atomic_*`, `refresh_table_status_*`) introduce nearly identical function bodies; reordering/removal could break historical consistency if not squashed carefully.
- Dropped tables (`merge_rules`) still power API routes; removing their migrations without reintroducing replacements leads to runtime failures.
- Missing migrations for tables referenced in code (`leads`, `waiting_list`) suggest manual DB changes or forgotten commits; cleanup must capture and formalize these before deletion.
- Seeds and backups reference legacy tables—pruning them without updating seeds will break `db:reset` workflows.

## Testing Strategy

- Unit: Validate helper scripts (cleanup/backup) with dry-run mode and schema diff assertions.
- Integration: Run `db:verify` equivalent once recreated to ensure Supabase CLI sees zero drift; optionally execute representative Supabase client flows via existing tests (e.g., `tests/integration/table-slot-constraints.test.ts`).
- E2E: Ensure Playwright smoke tests touching bookings still succeed after schema consolidation (if run by CI).
- Accessibility: N/A (no UI work), but document manual checks for CLI prompts.

## Rollout

- Feature flag: N/A (infrastructure change).
- Exposure: Stage cleanup in a dedicated branch & Supabase shadow env; once validated, apply to production via controlled migration push.
- Monitoring: Compare `supabase migration list` and `supabase db diff` outputs before/after; monitor application logs for Supabase errors post-cleanup.
- Kill-switch: Maintain full schema backup (pg_dump) and the pre-cleanup migrations directory under git history; rollback by restoring dump and reverting migrations commit if issues arise.

## Cleanup Strategy

- Archive dump-style migrations (`remote_schema*.sql`, comment-only placeholders) and replace them with a regenerated baseline produced via `supabase db diff` once schema drift is resolved.
- Collapse iterative PATCH chains (e.g., `assign_tables_atomic_v2*`, `refresh_table_status*`, feature flag override migratons) into single canonical migrations to reduce replay time.
- Recreate tracked migrations for drifted tables (`leads`, `waiting_list`, reinstated `merge_rules`) so application code has matching DDL.
- Remove or rewrite automation scripts that conflict with AGENTS non-negotiables (e.g., destructive `cleanup.sh`, stale Supabase docs) after preserving archival copies.
- Drop unused Supabase assets (`stripe_events`, `strategic_simulation_runs`, `capacity_selector_rejections_v1`) so only active tables/views remain.
- Update seeds, Supabase docs, and TypeScript types to align with the cleaned schema snapshot.

## Backup & Rollback

- Take schema-only `pg_dump` snapshots before moving or deleting any migration files; store under `backups/schema-cleanup-<timestamp>/`.
- Capture Supabase CLI migration status (`supabase migration list`) and store logs in the task directory for traceability.
- Ensure a reversible git branch encapsulates all cleanup commits; if issues appear, rollback by restoring the dump and resetting the branch.
- Coordinate with feature owners before dropping tables flagged as unused to confirm there are no hidden dependencies or downstream analytics consumers.
