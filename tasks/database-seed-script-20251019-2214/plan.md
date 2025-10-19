# Implementation Plan: Database Seed Script

## Objective

We will enable developers to populate the database with representative seed data so that local and staging environments have realistic records for testing and demos.

## Success Criteria

- [ ] Seed script populates every public table (except system `_migrations`) without FK violations.
- [ ] Seed data exercises every enum value and representative boolean/path columns.
- [ ] Script is idempotent when re-run (via truncation or conflict handling).

## Architecture & Components

- `supabase/seed.sql`: entry point retained (delegates to `seeds/seed.sql`).
- `supabase/seeds/seed.sql`: consolidated script containing truncation, deterministic UUID definitions, and grouped insert statements.
  - Section A — helper `WITH` CTE defining UUID constants & timestamp anchors.
  - Section B — truncate/tidy existing rows (respect dependency order, disable triggers if needed).
  - Section C — domain inserts (restaurants → tables → bookings → analytics → audit).

## Data Flow & API Contracts

Endpoint: N/A (pure SQL script)
Request: Executes via `psql`/`supabase db remote commit`.
Response: SQL command tags (`INSERT 0 n`); errors surface directly from Postgres constraints.
Errors: Constraint violations, enum mismatches, generated column format errors.

## UI/UX States

- Not applicable.

## Edge Cases

- Unique constraints: `restaurants.slug`, `restaurant_invites.token_hash`, `booking_slots` PK composite → ensure unique combos.
- Generated/checked columns: `customers.email` must be lowercase; phone length limits; `table_adjacencies.table_a <> table_b`.
- Sequences: rely on defaults (`booking_state_history_id_seq`) so we need not manage values manually.
- RLS: script likely runs as service role; provide note in script header about required role.

## Testing Strategy

- Local dry run: `supabase db commit --tag seed-dry-run --file supabase/seeds/seed.sql` targeting a disposable branch (if available).
- Manual `psql` execution against a scratch database to confirm row counts and FK integrity.
- Optional smoke query examples included in `verification.md` (e.g., count checks).

## Rollout

- Deliver SQL script only; execution owned by maintainers via Supabase CLI (`supabase db remote commit` targeting staging).
- Document prerequisites (service role credentials) and safe re-run instructions in `verification.md`.
