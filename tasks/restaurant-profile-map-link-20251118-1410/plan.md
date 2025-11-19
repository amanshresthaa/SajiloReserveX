---
task: restaurant-profile-map-link
timestamp_utc: 2025-11-18T14:10:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Restaurant Profile Google Map Link

## Objective

Enable restaurant owners to save a Google Maps link in Restaurant Profile and include it in guest-facing emails so diners can open the venue location directly.

## Success Criteria

- [ ] Restaurant Profile form exposes a Google Maps link field with URL validation and helper text; saving updates persists without errors.
- [ ] API and services accept/return the new map link; existing fields continue working for restaurants without a link.
- [ ] Booking emails include a Google Maps link when available and remain unchanged otherwise (no layout regressions).

## Architecture & Components

- `components/ops/restaurants/RestaurantDetailsForm`: add UI input, state, validation for `googleMapUrl`.
- `src/components/features/restaurant-settings/RestaurantProfileSection`: seed initial values and submit payload including map link.
- API layer: `src/app/api/ops/restaurants/schema.ts`, `src/app/api/ops/restaurants/[id]/route.ts`, `server/restaurants/update.ts`, `server/restaurants/select-fields.ts` to carry the new column.
- Email rendering: `lib/venue.ts`, `server/emails/bookings.ts` (and preview script) to surface map link.
- Data: Supabase `restaurants` table via new nullable column `google_map_url` with migration in `supabase/migrations/` plus updated generated types.

## Data Flow & API Contracts

- PATCH `/api/ops/restaurants/:id` accepts `googleMapUrl?: string | null` (validate URL, optional) and persists to `restaurants.google_map_url`.
- GET returns `googleMapUrl` so UI can prefill and emails can use it.

## UI/UX States

- Field displays current link or empty; shows validation error for malformed URLs; optional helper text suggests sharing link format.
- Save button disabled while submitting; handles existing error handling via existing mutation flow.

## Edge Cases

- Empty value -> stored as null; email renders address without link.
- Invalid URL rejected client-side and server-side.
- Emails should handle long URLs without breaking layout (use short label and wrap).

## Testing Strategy

- Unit/logic: Adjust any validation helpers if needed; rely on TypeScript coverage.
- Manual QA: save profile with/without map link; ensure API payload contains `googleMapUrl`; send/preview booking email to see link.
- Accessibility: verify label/description and keyboard focus for new input.

## Rollout

- No feature flag planned; column is nullable and backwards compatible. Ensure migration accompanies code.

## DB Change Plan

- Migration: add nullable `google_map_url text` column to `public.restaurants` default null.
- Backfill: none (optional manual entry by owners).
- Rollback: drop column (if safe) via inverse migration; code handles nulls.
