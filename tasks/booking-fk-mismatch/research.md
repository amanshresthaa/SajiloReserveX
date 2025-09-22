# Research

## Context
- The runtime error when creating bookings locally is `Key (restaurant_id)=(f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68) is not present in table "restaurants"`.
- `app/api/bookings/route.ts` and other booking APIs use `getDefaultRestaurantId()` from `server/supabase.ts` when a restaurant id is absent in the request payload.
- `getDefaultRestaurantId()` falls back to `BOOKING_DEFAULT_RESTAURANT_ID`, `NEXT_PUBLIC_DEFAULT_RESTAURANT_ID`, or the hard-coded UUID `f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68` if neither env var is set.
- Several scripts (e.g. `scripts/perf/booking-conflict-benchmark.sql`) also default to the same UUID, indicating it is the intended demo/default restaurant anchor.

## Schema findings
- `database/migrations/index.sql` defines `public.restaurants` with `id uuid PRIMARY KEY DEFAULT public.app_uuid()`.
- `public.customers.restaurant_id` and `public.bookings.restaurant_id` have `REFERENCES public.restaurants(id)` enforcing referential integrity.
- No seed data is present in the schema file to guarantee a restaurant row with the fallback UUID.

## Existing patterns
- Other helper SQL scripts (e.g. `database/tests/tenant_rls.sql`) manually insert deterministic UUIDs when needed for test data.
- There is a migration helper script `database/migrations/apply_enum_fix.sh` but no incremental migration creating seed data.

## Open choices
- Ensure local/dev environments set `BOOKING_DEFAULT_RESTAURANT_ID` or `NEXT_PUBLIC_DEFAULT_RESTAURANT_ID` to a valid row.
- Or seed a restaurant row with the hard-coded fallback UUID so that the default works out of the box.
- Or relax/remove the FK constraint (not ideal for data integrity).

Need to confirm which approach the user prefers; request was "provide me sql to amend that" followed by "Check this sql", likely expecting SQL that inserts or updates data so the FK passes.
