# Implementation Plan: Fix Missing table_inventory Table

## Objective

We will enable ops dashboard table view to load without schema cache errors so that capacity data remains accessible.

## Success Criteria

- [ ] Ops tables API returns data successfully using existing Supabase schema.
- [ ] No runtime errors when loading `/ops/tables`.

## Architecture & Components

- `supabase/manual-rollbacks/20251016092200_capacity_engine_rollback.sql`: store rollback script outside auto-run migration path.
- Existing migrations `20251016091800`–`20251016092100`: reapply using `supabase migration repair` + `supabase migration up --include-all`.
- `types/supabase.ts`: regenerate or update types to include `table_inventory` after migration (if necessary).

## Data Flow & API Contracts (unchanged)

Endpoint: GET /api/ops/tables?restaurantId=...
Request: { query parameters }
Response: { tables: Table[] }
Errors: { code, message }

## UI/UX States

- Loading: Existing spinner.
- Empty: Existing empty state.
- Error: Existing error display.
- Success: Data grid renders inventory.

## Edge Cases

- Restaurant without inventory records.
- Permission errors from Supabase.
- Migration replay must succeed even if some objects already exist.

## Testing Strategy

- Unit: None (schema change).
- Integration: Validate `/api/ops/tables` route by calling it after migration.
- E2E: Manual check via browser once API responds.
- Accessibility: Existing patterns.

## Rollout

- Feature flag: none
- Exposure: 100%
- Monitoring: API logs for `[ops/tables]` errors; Supabase dashboard for migration status.
