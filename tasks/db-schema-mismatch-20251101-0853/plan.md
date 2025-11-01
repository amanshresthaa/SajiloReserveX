# Implementation Plan: DB Schema Mismatch

## Objective

We will realign the remote Supabase schema with the latest application requirements so that table assignment RPCs and strategic configuration loading run without column-missing errors.

## Success Criteria

- [ ] `POST /api/ops/dashboard/assign-tables` succeeds during manual QA (no `merge_group_id` repository failures in `server/capacity/tables.ts:2740`).
- [ ] `/ops` dashboard loads without logging `[strategic-config] schema unavailable` warnings after schema updates.

## Architecture & Components

- Supabase migrations under `supabase/migrations` applied remotely via Supabase CLI (`pnpm db:push`).
- Existing application services (`SupabaseAssignmentRepository` in `server/capacity/v2/supabase-repository.ts`, strategic config loader in `server/capacity/strategic-config.ts`) continue unchanged but expect the updated schema.
- Supabase types (`types/supabase.ts`) already model the desired columns; schema must match.

## Data Flow & API Contracts

Endpoint: RPC `assign_tables_atomic_v2` invoked by Next API `POST /api/ops/dashboard/assign-tables`.  
Request: `{ p_booking_id, p_table_ids[], p_idempotency_key?, p_require_adjacency?, p_assigned_by?, p_start_at?, p_end_at? }`.  
Response: Array of `{ table_id, start_at, end_at, merge_group_id? }`.  
Errors: Repository surfaces `ASSIGNMENT_REPOSITORY_ERROR` when the underlying table lacks `merge_group_id`.

Secondary data flow: `select scarcity_weight, demand_multiplier_override, future_conflict_penalty, updated_at from strategic_configs` driven by `server/capacity/strategic-config.ts`. Missing columns trigger env fallback and warning logs.

## UI/UX States

- N/A – backend schema remediation; user-facing UI should remain unchanged.

## Edge Cases

- Remote DB already has partial schema (e.g., `strategic_configs` table without numeric columns); migrations must guard with `IF NOT EXISTS`/`ADD COLUMN` checks to avoid failures.
- Backward compatibility: newly added `merge_group_id` column should default to `NULL`, ensuring legacy rows stay valid.
- Supabase RPC definitions must continue to compile even if migrations applied out of order (hence idempotent checks).

## Testing Strategy

- Unit: `pnpm run test:ops` (capacities) to ensure repository mocks align with updated types.
- Integration: Launch `pnpm run dev`, hit `/ops` dashboard and execute a table assignment via UI or API client to confirm RPC success.
- E2E: N/A for this schema fix.
- Accessibility: N/A (no UI changes).

## Rollout

- Feature flag: none (schema-level change).
- Exposure: Apply to staging Supabase first, validate, then production.
- Monitoring: Tail logs for `[strategic-config]` warnings and assignment RPC errors post-migration.
- Kill-switch: If issues arise, revert by dropping `merge_group_id` column and/or renaming the new strategic configs table via targeted SQL while restoring env-based fallback in configuration.
