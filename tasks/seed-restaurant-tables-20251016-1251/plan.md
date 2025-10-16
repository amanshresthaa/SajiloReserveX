# Implementation Plan: Seed Tables For All Restaurants

## Objective

We will create a SQL seed script that populates dining tables for each restaurant so that environments have baseline data for capacity features.

## Success Criteria

- [ ] Script inserts sensible default tables for every existing restaurant record.
- [ ] Script is idempotent or safe to rerun without duplicating data.
- [ ] Script aligns with current schema constraints (capacity, seating type, etc.).

## Architecture & Components

- `supabase/seeds/table-inventory.sql` (new) – contains seed logic; follows existing seed style (`BEGIN; ... COMMIT;`).
- Schema tables touched: `public.table_inventory`, `public.restaurants`.

## Data Flow & API Contracts

- Seed script queries existing restaurants and inserts related tables.
- Outputs static inserts (SQL) executed via Supabase CLI.

## UI/UX States

- Not applicable (backend seed only).

## Edge Cases

- Restaurants missing `capacity` (null) – still receive default table mix.
- Script rerun should not duplicate records (`ON CONFLICT DO NOTHING`).
- Optionally skip restaurants that already have any tables to avoid mixing seeded/manual data.

## Testing Strategy

- Manual verification by running the seed against a safe environment (not in scope here).
- Peer review of SQL; rely on Supabase constraints and `ON CONFLICT` for idempotency guarantees.

## Rollout

- Run via `supabase db seed` targeting remote environment per AGENTS policy.
- Communicate with team before applying to production data.
