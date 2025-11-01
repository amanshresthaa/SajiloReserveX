# Implementation Checklist

## Setup

- [x] Identify Supabase connection string for staging (production pending secure hand-off)
- [x] Capture current schema state for `booking_table_assignments` and `strategic_configs` (psql describe)

## Core

- [x] Apply pending migrations ensuring `merge_group_id` column exists (staging)
- [x] Apply pending migrations ensuring `strategic_configs` schema matches app expectations (staging)
- [ ] Repeat migrations for production environment
- [ ] Verify `assign_tables_atomic_v2` RPC output includes `merge_group_id` via Supabase query
- [ ] Verify strategic config loader can read DB values (no warning logs)

## UI/UX

- [ ] N/A

## Tests

- [ ] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
  - Production Supabase connection string will be provided before migration rollout.
- Deviations:
  - Staging schema audited and updated; production pending credentials.

## Batched Questions (if any)

- None
