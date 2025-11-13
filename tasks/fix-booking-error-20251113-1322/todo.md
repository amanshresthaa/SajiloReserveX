# Implementation Checklist

## Payload & Type Updates

- [x] Extend `ReservationDraft` + `buildReservationDraft` to carry `restaurantSlug`.
- [x] Update customer + ops `useCreate*Reservation` hooks (and tests) to submit `restaurantSlug`.

## API Changes

- [x] Expand `bookingSchema` to accept `restaurantSlug` and add a helper that resolves IDs via slug → default with explicit 404 when nothing matches.
- [x] Add route tests covering slug fallback and no-context (expected 404).

## Verification

- [x] Run `pnpm run lint`.
- [x] Manual QA via Chrome DevTools MCP: submit booking on `/reserve/r/white-horse-pub-waterbeach` (booking reaches step 4; `/api/bookings/confirm` still 400 without confirmation token, noted below).
