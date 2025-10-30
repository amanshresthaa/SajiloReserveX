# Implementation Checklist

## Setup

- [x] Rename the generated range column in the migration to avoid reserved keyword usage.

## Core

- [x] Update exclusion constraint and any references inside the migration to use the new column name.
- [x] Align the booking status filter in `is_table_available_v2` with enum values.
- [x] Adjust server code (`server/capacity/holds.ts`) to query the renamed column.
- [x] Update Supabase generated types (`types/supabase.ts`) to match.

## Tests

- [x] Run `supabase db push` to verify the migration succeeds remotely.
- [x] (Optional) Run `pnpm lint` or `pnpm tsc --noEmit` to ensure no type errors.

## Notes

- Assumptions: Column rename is safe because table is not yet deployed (migration failed earlier).
- Deviations: None.

## Batched Questions (if any)

- None.
