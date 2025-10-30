# Research: Fix hold window migration

## Requirements

- Functional: Ensure the `table_hold_windows` migration succeeds remotely and retains the ability to enforce non-overlapping hold windows via a generated range column. Update application code and Supabase types to align with schema changes.
- Non-functional (a11y, perf, security, privacy, i18n): Maintain existing performance characteristics of conflict checks; preserve data integrity in Supabase migrations; no impact on UI accessibility.

## Existing Patterns & Reuse

- `supabase/migrations/20251029183500_hold_windows_and_availability.sql` already defines the table, constraints, and triggers; only the generated column name conflicts with reserved keyword usage.
- `server/capacity/holds.ts` queries the `window` column using overlap filters; needs to track any rename.
- `types/supabase.ts` holds generated types that mirror the Supabase schema and will require updates if the column name changes.

## External Resources

- PostgreSQL documentation on [quoted identifiers](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS) – confirms that `window` is a reserved keyword, so using it as an unquoted column name causes syntax errors.

## Constraints & Risks

- Migration must remain idempotent for deployments where the table might already exist; changing the column name requires coordinated updates to any dependent SQL statements and triggers.
- Renaming the column impacts application queries and Supabase generated types; missing updates would break runtime range overlap checks.
- Need to ensure exclusion constraints and generated column logic still use the renamed column to preserve behavior.
- The availability helper references booking statuses; ensure literals align with the current `booking_status` enum (no `'seated'` value).

## Open Questions (owner, due)

- None identified; issue is isolated to reserved keyword usage.

## Recommended Direction (with rationale)

- Rename the generated range column from `window` to `hold_window` (or similar) within the migration and update all references (constraints, indexes, triggers, application code, Supabase types). This avoids reserved keyword conflicts while keeping semantics clear.
- Regenerate or patch Supabase types manually to keep column names in sync until a formal type generation step runs again.
