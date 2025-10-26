# Implementation Plan: Table Holds Permission Fix

## Objective

We will restore the manual hold workflow by ensuring the Supabase service role regains SELECT/INSERT/DELETE access to `table_holds` and `table_hold_members`, eliminating 42501 errors in `/api/staff/manual/hold`.

## Success Criteria

- [ ] Running `supabase db push` applies the pending RLS/grant migration without errors.
- [ ] A service-role Supabase client can `select` from `table_holds` with no permission error (verified via script).
- [ ] Manual hold creation in dev no longer yields `[staff/manual/hold] unexpected error` logs.

## Architecture & Components

- Supabase migrations `20251026161309_add_table_holds_unconditional.sql` and `20251026164913_add_table_holds_rls.sql`; no application code changes expected.
- Supabase CLI (remote) to apply migrations.

## Data Flow & API Contracts

- `/api/staff/manual/hold` POST should succeed when the service client inserts into `table_holds` and associated members.
- No new contracts; ensure existing Supabase policies align with staff access.

## UI/UX States

- Loading: N/A (backend fix).
- Empty/Error/Success: Confirm manual hold UI reports success rather than 500 (via devtools QA if feasible after backend fix).

## Edge Cases

- Supabase CLI not linked to remote project → need to link or use service env to target correct instance.
- Migration already applied remotely → CLI should report no-op; ensure verification still passes.
- Unexpected policy conflicts → fall back to manual inspection before retrying.

## Testing Strategy

- Unit: N/A (schema-only change).
- Integration: Run Node script using service client to read/write `table_holds`.
- E2E: (If authentication available) attempt manual hold flow in dev UI.
- Accessibility: N/A.

## Rollout

- Feature flag: none.
- Exposure: immediate; migrations affect all environments using this database.
- Monitoring: Watch Next dev logs for lingering permission warnings; confirm Supabase metrics (if available) show successful hold inserts.
