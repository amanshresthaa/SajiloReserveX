# Plan – Display Seeded Dashboard Bookings

## Goal

Ensure the dashboard uses the seeded bookings (e.g., `example-bistro`) instead of the outdated hardcoded restaurant ID. Resolve the “default restaurant” dynamically so UI + APIs surface real data for the signed-in user.

## Steps

1. **Dynamic Default Restaurant Resolution**
   - Update `server/supabase.ts` so `getDefaultRestaurantId()` becomes async and resolves the value by:
     - Checking `NEXT_PUBLIC_DEFAULT_RESTAURANT_ID` (fast path).
     - Falling back to `NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG` (query `restaurants` via service client; cache result).
     - Ultimately falling back to the legacy constant if nothing is found.
   - Keep the value cached in-memory to avoid repeated queries.

2. **Propagate Async Usage**
   - Update all call sites (`app/dashboard/page.tsx`, `app/api/bookings/route.ts`, `app/api/bookings/[id]/route.ts`, others if present) to `await getDefaultRestaurantId()` instead of using the synchronous constant.
   - Remove direct imports of `DEFAULT_RESTAURANT_ID` where the async helper is now used.

3. **Dashboard Query Update**
   - In `app/dashboard/page.tsx`, fetch the resolved restaurant ID before querying bookings.
   - Ensure TypeScript types align after switching to async helper.

4. **Validation**
   - Run `pnpm typecheck` and `pnpm test` to confirm no regressions.
   - Optionally run `pnpm lint` if edits touch linted files.

## Notes

- Existing static venue metadata (`lib/venue.ts`) can keep the fallback constant; it’s orthogonal to pulling live bookings.
- Cached ID avoids repeated service-role queries while still allowing env-driven configuration.
