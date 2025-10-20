# Research: Fix Booking Type Enum Migration

## Existing Patterns & Reuse

- Supabase migrations use transactional scripts with explicit casting when mutating enum-backed columns (see `20250930121500_update_customer_status_enum.sql` for pattern of casting to `::text` before comparisons).
- Consolidated schema (`20251019102432_consolidated_schema.sql`) defines `public.booking_type` enum with values `breakfast`, `lunch`, `dinner`, `drinks`, so literals outside this set must be compared as text.

## External Resources

- [PostgreSQL Docs – ENUM Type](https://www.postgresql.org/docs/current/datatype-enum.html) – highlights that direct comparisons with enum literals coerce unknown strings to the enum type, causing runtime errors for invalid values; casting columns to `text` avoids this.

## Constraints & Risks

- Migration must remain idempotent and safe to rerun; statements should succeed whether or not previous steps partially executed.
- `booking_type` column participates in FK restoration later in the script, so interim data type conversions must keep data consistent.
- We cannot insert `'brunch'` into the enum type because the type is dropped at the end; any solution must work without modifying the enum definition.

## Open Questions (and answers if resolved)

- Q: Do any existing rows actually store `'brunch'` today, or is it only referenced in the script?
  A: Regardless of data, the literal `'brunch'` triggers enum coercion failure before the `ALTER TYPE ... USING` executes, so we must guard the comparison.

## Recommended Direction (with rationale)

- Update the migration to compare `booking_type::text` against text literals (and `booking_option::text` for symmetry) before coercing the column to `text`. This prevents Postgres from attempting to cast `'brunch'` to the enum while preserving the intended data correction path. No other structural changes are required.
