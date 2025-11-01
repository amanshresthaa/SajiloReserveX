# Implementation Checklist

## Setup

- [x] Create Supabase migration to guard capacity validation/update functions against missing `restaurant_capacity_rules`.

## Core

- [x] Update `validate_booking_capacity_after_assignment` definition with `to_regclass` guard and default maxima.
- [x] Update `update_booking_with_capacity_check` to reuse guard and avoid querying missing table.
- [x] Add telemetry/warning when table absent (if lightweight).
- [x] Backfill Vitest coverage for `translateSupabaseError` case `42P01`.

## UI/UX

- [ ] (Not applicable)

## Tests

- [x] Unit (`pnpm test:ops` with new coverage)
- [ ] Integration (N/A)
- [ ] E2E (N/A)
- [ ] Axe/Accessibility checks (N/A)

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

-
