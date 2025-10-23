# Implementation Checklist

## Setup

- [x] Review failing migrations
- [x] Document constraints in research.md

## Core

- [x] Wrap `20251021094504_recreate_assign_tables_atomic.sql` in a single `DO` block
- [x] Wrap `20251021094505_recreate_unassign_tables_atomic.sql` in a single `DO` block
- [x] Refactor `20251021152000_add_update_booking_capacity_rpc.sql` to a single `DO` block with grants
- [x] Refactor `20251022224206_add_last_seating_buffer.sql` to a single `DO` block (or equivalent single statement)
- [x] Re-run `supabase db push`
- [x] Rewrite seed scripts to remove unsupported `LATERAL` joins and simplify CTE usage
- [x] Execute updated seed against remote via `pnpm run db:seed-only`

## UI/UX

- [ ] Not applicable

## Tests

- [x] Confirm `supabase db push` completes successfully
- [x] Confirm `pnpm run db:seed-only` completes successfully

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- ...
