# Research – Display Seeded Dashboard Bookings

## Current Behaviour

- `app/dashboard/page.tsx` fetches bookings using the Supabase client, but filters by `DEFAULT_RESTAURANT_ID` from `lib/venue.ts` (lines 11-13). The fallback UUID (`f6c2…`) no longer matches the seeded restaurant.
- API routes (`app/api/bookings/*`) also rely on `getDefaultRestaurantId()` from `server/supabase.ts`, which returns the same static ID (lines 60-83). This affects server-rendered dashboard data and booking APIs alike.
- `lib/venue.ts` hardcodes venue metadata using `DEFAULT_RESTAURANT_ID`. There is no runtime lookup of the actual restaurant seeded in the database.

## Seed Data Snapshot

- The provided SQL seed upserts a restaurant with slug `example-bistro`, plus customers & bookings tied to that restaurant ID.
- Booking rows reference `customer_email = 'amanshresthaaaaa@gmail.com'` and are confirmed across different dates in 2025.

## Gap Identified

- Because the hardcoded `DEFAULT_RESTAURANT_ID` doesn’t match the seeded `example-bistro` ID, dashboard queries return no rows even though bookings exist.
- The codebase already has a service-role Supabase client (`getServiceSupabaseClient`) that can query arbitrary tables. We can leverage it to resolve the default restaurant dynamically (e.g., by environment variables or slug lookup).

## Constraints / Considerations

- Multiple modules expect a synchronous `getDefaultRestaurantId()`; converting it to async requires updating every usage site.
- Some parts of the UI (e.g. `DEFAULT_VENUE`) rely on the same ID for static metadata; they may need a fallback if the restaurant isn’t found yet.
- We should avoid hardcoding the new UUID; instead, resolve it via slug (`example-bistro`) or allow configuration via environment while caching the lookup for reuse.

## Open Questions

1. Should we treat `example-bistro` as the canonical default (via a slug env var) or add a more generic lookup strategy (e.g. first restaurant associated with the signed-in user)?
2. Do we need to surface multiple restaurants if the user has access to more than one, or is showing a single default sufficient for current scope?
