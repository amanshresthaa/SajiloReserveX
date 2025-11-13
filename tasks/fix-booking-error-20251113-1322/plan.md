# Implementation Plan: Booking Wizard Missing Restaurant Context

## Objective

Ensure customer and ops booking submissions always identify the target restaurant so `/api/bookings` no longer fails with 500 "Restaurant not found".

## Success Criteria

- [ ] Submitting `/reserve/r/white-horse-pub-waterbeach` posts a payload that includes both `restaurantId` and `restaurantSlug`.
- [ ] `/api/bookings` resolves the correct restaurant even when `restaurantId` is absent but the slug is present, responding with 404 (not 500) if neither resolves.
- [ ] `pnpm run lint` passes.

## Architecture & Components

- `reserve/features/reservations/wizard/model/reducer.ts`: extend `ReservationDraft` to include `restaurantSlug` and propagate it from `buildReservationDraft`.
- `reserve/features/reservations/wizard/api/{useCreateReservation,useCreateOpsReservation}.ts`: include the slug in request payloads.
- `src/app/api/bookings/route.ts`: update schema + POST handler to accept `restaurantSlug`, resolve IDs via slug or default, and surface a clean 404 when lookup fails.
- Tests: update transformer + mutation tests, add coverage for slug fallback in `route.test.ts`.

## Data Flow & API Contracts

- Request shape gains optional `restaurantSlug` (lowercase hyphenated). Server uses order: explicit ID → slug lookup (`getRestaurantBySlug`) → validated default → reject.

## UI/UX States

- No visible UI change; wizard should show the same error messaging when fetch fails, but the primary path should now succeed.

## Edge Cases

- Missing slug + missing/invalid ID should return a deterministic 404 instead of throwing inside schedule lookup.
- Slug lookup failure should not mutate caches.

## Testing Strategy

- Unit: extend existing Vitest suites (transformer + `useCreateReservation` + API route) to cover slug propagation and fallback.
- Manual: run `pnpm run dev`, submit booking flow (Chrome DevTools MCP) to confirm booking succeeds.
- Lint: `pnpm run lint`.

## Rollout

- No flags required; change is safe to land since API remains backward compatible (slug optional) and still honors `restaurantId` when provided.
