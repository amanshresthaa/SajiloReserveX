# Implementation Plan: Fix assign_tables_atomic Migration

## Objective

We will restructure the pending Supabase migrations and seed script so each executes cleanly under Supabase’s prepared-statement parser, preserving intended privileges, constraints, and seed data fidelity.

## Success Criteria

- [x] `supabase db push` applies migrations `20251021094504`, `20251021094505`, `20251021152000`, and `20251022224206` without errors.
- [x] Updated seed scripts avoid unsupported `LATERAL` joins / complex nested CTEs and run without parser errors.
- [ ] Functions `assign_tables_atomic`, `unassign_tables_atomic`, and `update_booking_with_capacity_check` remain `SECURITY DEFINER` with `service_role` (and other intended roles) privileges intact.
- [ ] Restaurant column `reservation_last_seating_buffer_minutes` exists with constraint and comment after push.

## Architecture & Components

- Refactor each migration into a single `DO $$ ... $$` block that issues the necessary DDL via `EXECUTE`, ensuring compatibility with CLI prepared statements.
- Rewrite `supabase/seed.sql` and `supabase/seeds/seed.sql` to use window functions and deterministic `JOIN`s instead of unsupported `LATERAL` patterns, splitting large `INSERT`s where needed.
- Maintain existing drop/create sequence so newly created functions replace their predecessors cleanly.
  State: n/a | Routing/URL state: n/a

## Data Flow & API Contracts

Endpoint: n/a
Request: n/a
Response: n/a
Errors: n/a

## UI/UX States

- Not applicable.

## Edge Cases

- Re-running migrations should be effectively idempotent ( guards or `IF NOT EXISTS` checks where practical).
- Ensure function grants cover `service_role`, `authenticated`, and `anon` as originally defined.

## Testing Strategy

- Manual: Run `supabase db push` (with `--dry-run` if supported, otherwise apply directly) and confirm completion.
- Manual: Execute `pnpm run db:seed-only` (psql wrapper) to verify the seed script runs remotely.
- Post-push validation: `supabase db diff` (if necessary) to ensure no unexpected drift.
- Automated tests: none applicable (database-only change).
- Accessibility: not applicable.

## Rollout

- Feature flag: n/a
- Exposure: n/a
- Monitoring: Observe migration logs.
