# Implementation Plan: Fix Auto Assign

## Objective

Ensure auto-assignment respects each restaurant’s timezone so bookings receive table windows that align with their actual service periods.

## Success Criteria

- [ ] `autoAssignTablesForDate` uses the restaurant’s stored timezone (or safe fallback) when computing windows and RPC payloads.
- [ ] Updated tests cover a non-default timezone scenario and pass locally.

## Architecture & Components

- `server/capacity/tables.ts#autoAssignTablesForDate`: load restaurant timezone (via `loadRestaurantTimezone`) alongside bookings/tables, derive `policy` with `getVenuePolicy({ timezone })`, and reuse it for window calculations and the `assignTableToBooking` call.
- `tests/server/capacity/autoAssignTables.test.ts`: extend the Supabase client mock to capture RPC window arguments and add an assertion for non-London timezones.

## Data Flow & API Contracts

Endpoint: `POST /api/ops/dashboard/assign-tables` (unchanged request/response shape).
Request: `{ restaurantId: string; date?: string | null }`
Response: `{ date: string; assigned: { bookingId: string; tableIds: string[] }[]; skipped: { bookingId: string; reason: string }[] }`
Errors: HTTP 4xx for validation/auth, 5xx for Supabase failures (unchanged).

## UI/UX States

- Loading / success / error handled by existing mutation toast flow; no UI changes required.

## Edge Cases

- Restaurant lacks timezone → fall back to default policy as today.
- No tables or assignments remain unaffected by timezone update.

## Testing Strategy

- Unit: augment `autoAssignTablesForDate` tests for timezone handling.
- Integration/E2E: not required for this backend-only fix.
- Accessibility: not applicable.

## Rollout

- No feature flag; deploy with existing release flow.
- Monitoring: rely on Ops dashboard telemetry/ logs (unchanged).
