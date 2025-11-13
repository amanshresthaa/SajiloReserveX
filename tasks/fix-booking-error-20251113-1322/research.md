# Research: Booking POST 500 (Restaurant not found)

## Requirements

- Functional: Stop `POST /api/bookings` from returning 500 "Restaurant not found" when submitting `/reserve/r/white-horse-pub-waterbeach` in local dev.
- Non-functional: Keep wizard UX unchanged, avoid leaking Supabase errors, and preserve multi-tenant safety (no hard-coded IDs or seeds).

## Existing Patterns & Reuse

- `reserve/features/reservations/wizard/model/transformers.ts` builds the payload (`ReservationDraft`) that `useCreateReservation` submits via `apiClient`.
- `/api/bookings` (app route) validates payload via `bookingSchema` and resolves missing `restaurantId` by calling `getDefaultRestaurantId()` from `server/supabase.ts`.
- `getRestaurantBySlug` already exists for slug → ID lookups (used by `/reserve/r/[slug]` to render the wizard and by schedule/calendar APIs).

## External Resources

- Internal scripts under `tasks/investigate-schedule-miss-booking-500-20251109-0043/` already hit bookings + schedule APIs and confirm Supabase data for `white-horse-pub-waterbeach`.

## Constraints & Risks

- Env defaults (`BOOKING_DEFAULT_RESTAURANT_ID`, `NEXT_PUBLIC_DEFAULT_RESTAURANT_ID`, slug) currently point at `the-queen-elizabeth-pub`, which does **not** exist in the seeded database.
- `getDefaultRestaurantId()` caches the env override before attempting any DB lookup, so a stale env value silently poisons all code paths that rely on the default.
- Client and ops flows share the `ReservationDraft` type; changes must keep both Mode = customer/ops builds compiling.

## Open Questions (owner, due)

- Q: Why is `ReservationDraft.restaurantId` missing during wizard submit despite being required client-side? _(Owner: me — after diagnosing payload shape, concluded some browsers/local storage replay flows can drop the field; regardless, lack of server fallback is the blocker.)_

## Recommended Direction (with rationale)

1. **Augment the payload** so the client always sends `restaurantSlug` alongside `restaurantId`. This is already known on the route (`state.details.restaurantSlug`), costs almost nothing to include, and gives the server enough information to recover when IDs drift or the client fails to hydrate the ID.
2. **Teach `/api/bookings` to resolve missing IDs via slug before falling back to `getDefaultRestaurantId()`**. Use `getRestaurantBySlug` (service-role client) to translate, and return a 404 with a friendly message if neither ID nor slug resolve.
3. **Guard the fallback path**: if the env default resolves to an ID that no longer exists, return an actionable 404 rather than bubbling an unhandled "Restaurant not found" error.
4. **Update transformer/tests** so `ReservationDraft` carries slug metadata, and extend both customer + ops mutations to transmit it. This keeps both code paths consistent and future-proofs additional API endpoints that rely on the same draft type.

This approach keeps server trust anchored on Supabase data (no new hard-coded IDs), unblocks local dev regardless of env drift, and requires minimal UI changes beyond adding one extra field to the payload.
