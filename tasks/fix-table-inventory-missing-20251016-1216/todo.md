# Implementation Checklist

## Setup

- [x] Review existing Supabase tables and schema usage
- [x] Confirm API route dependencies

## Core

- [x] Move rollback migration into `supabase/manual-rollbacks/`
- [x] Mark capacity engine migrations as reverted and reapply them remotely
- [x] Update Supabase generated types

## UI/UX

- [ ] Verify `/ops/tables` loads without errors

## Tests

- [ ] (Optional) Hit `/api/ops/tables` locally to confirm success

## Notes

- Assumptions:
- Deviations:
  - Reused existing capacity engine migrations via `supabase migration repair` + `up --include-all` instead of creating a brand new migration file.

## Batched Questions (if any)

-
