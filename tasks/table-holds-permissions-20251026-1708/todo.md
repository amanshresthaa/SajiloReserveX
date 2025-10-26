# Implementation Checklist

## Setup

- [x] Check Supabase migration status / pending SQL for `table_holds`.

## Core

- [x] Apply pending migrations to remote via `supabase db push`.
- [x] Re-run service-role Supabase query to confirm permissions restored.

## UI/UX

- [ ] Smoke test manual hold creation in dev (watch Next logs for success).

## Tests

- [ ] Unit
- [x] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
  - Service-role key targets intended Supabase project.
- Deviations:
  - Manual hold UI smoke-test pending valid staff credentials; verified service-role access via script instead.
  - Applied grants/policy statements directly via `psql` after migration to immediately restore remote access.

## Batched Questions (if any)

-
