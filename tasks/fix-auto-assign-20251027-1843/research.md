# Research: Fix Auto Assign

## Existing Patterns & Reuse

- `autoAssignTablesForDate` (server/capacity/tables.ts:1688-1754) currently creates a venue policy via `getVenuePolicy()` without injecting the restaurant timezone, which defaults to `Europe/London`.
- Other capacity flows such as `assignTableToBooking` (server/capacity/tables.ts:1390-1412) and `evaluateManualSelection` (server/capacity/tables.ts:928-966) reuse `loadRestaurantTimezone` to hydrate a policy with the restaurant’s actual timezone before computing booking windows.
- `loadRestaurantTimezone` helper (server/capacity/tables.ts:504-541) already wraps the Supabase lookup for the restaurant’s timezone and is available for reuse.
- The Ops dashboard route (`src/app/api/ops/dashboard/assign-tables/route.ts:4-85`) simply forwards to `autoAssignTablesForDate`, so fixing the server function keeps the API surface unchanged for the UI (`useOpsTableAssignmentActions` in src/hooks/ops/useOpsTableAssignments.ts:49-105).

## External Resources

- Supabase table definitions confirm `restaurants.timezone` exists (types/supabase.ts:1426-1466) and table-status enums remain unchanged, so reading timezone stays compatible.
- Existing Vitest coverage for auto assignment lives in `tests/server/capacity/autoAssignTables.test.ts` and already stubs the restaurants query, making it a good place to extend with a timezone-specific assertion.

## Constraints & Risks

- Adding a timezone lookup introduces another DB call per auto-assign execution; mitigate by parallelising with existing queries where possible to minimise latency.
- Must handle missing timezone gracefully by falling back to the default policy timezone to avoid regressions for legacy tenants.
- Tests currently assume the mock restaurant timezone is `Europe/London`; updating logic requires adjusting the mock or assertions so the suite still passes.
- Any change to window computation affects the RPC payload (`p_start_at` / `p_end_at`) in `assignTableToBooking`; incorrect values could cause overlaps or Supabase constraint failures.

## Open Questions (and answers if resolved)

- Q: Do we need to expose the resolved timezone back through the API response?
  A: No, the UI already receives the service date via the summary endpoint; only server-side window calculations need the correct timezone.
- Q: What happens if the restaurant row lacks a timezone?
  A: We will continue to fall back to the default policy timezone (`getVenuePolicy().timezone`) to retain current behaviour.

## Recommended Direction (with rationale)

- Fetch the restaurant timezone once inside `autoAssignTablesForDate`, derive a policy with `getVenuePolicy({ timezone })`, and reuse it for window calculations and downstream `assignTableToBooking` calls—aligning auto assignment with manual flows and ensuring bookings in non-default timezones receive correct windows.
- Update the unit tests to verify that `autoAssignTablesForDate` respects non-default timezones by asserting the RPC payload uses the expected UTC window, preventing regressions.
