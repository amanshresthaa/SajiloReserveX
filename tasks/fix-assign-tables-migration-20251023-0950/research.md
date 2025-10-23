# Research: Fix assign_tables_atomic Migration

## Existing Patterns & Reuse

- Existing migrations that redefine functions often pair `CREATE FUNCTION` with follow-up `GRANT` statements. To keep compatibility with the Supabase CLI (v2.48.3), we can wrap related DDL into a single `DO $$` block that issues each command via `EXECUTE`, reducing the top-level statement count to one.
- Earlier migrations (e.g. `20251019102432_consolidated_schema.sql`) already ran successfully and appear in `schema_migrations`, so our changes only need to address newly pending migrations.
- Seed data currently relies on `LATERAL` joins without `ON` clauses and large chained CTEs. Supabase’s SQL parser in managed environments rejects that pattern, so we need to rewrite the seed logic using window functions and simpler inserts.

## External Resources

- [Supabase Migration Docs](https://supabase.com/docs/guides/database) – confirm migration formatting requirements.

## Constraints & Risks

- Remote database only; changes must be safe for production data.
- Supabase CLI 2.48.3 prepares every migration file as a single statement (`Parse` protocol message). Any file containing multiple top-level commands (e.g. `CREATE ...; ALTER ...; GRANT ...;`) fails with `SQLSTATE 42601: cannot insert multiple commands into a prepared statement`.
- Wrapping DDL in `DO $$` blocks introduces quoting complexity; mistakes could lead to invalid SQL or unintended behavior.
- Seed script must stay performant—rewriting for parser compatibility should avoid exploding row counts or adding heavyweight correlated subqueries.

## Open Questions (and answers if resolved)

- Q: Does Supabase/Postgres require splitting statements when using certain tooling?
  A: Yes. Supabase CLI now prepares each migration file; only one top-level statement is permitted. We must refactor migrations accordingly.
- Q: Which migrations are affected?
  A: `20251021094504_recreate_assign_tables_atomic.sql`, `20251021094505_recreate_unassign_tables_atomic.sql`, `20251021152000_add_update_booking_capacity_rpc.sql`, and `20251022224206_add_last_seating_buffer.sql`.
- Q: Why does the seed file fail?
  A: Managed Supabase disallows `LATERAL` joins without explicit predicates and struggles with the nested CTE/UNION pattern we use to synthesise bookings. Rewriting with window functions and smaller `INSERT ... SELECT` blocks should resolve it.

## Recommended Direction (with rationale)

- Refactor the affected migrations so that each file contains exactly one top-level statement. Use `DO $$ ... $$` wrappers with `EXECUTE` blocks to run `CREATE FUNCTION`, `ALTER FUNCTION`, and `GRANT` statements together while satisfying the prepared-statement requirement. For pure `ALTER TABLE` flows, either split into separate files or wrap the DDL statements with conditional `EXECUTE` calls inside a `DO` block.
