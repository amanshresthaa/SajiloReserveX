# Implementation Plan: Fix 500 on Booking Create

## Objective

We will prevent 500 errors on POST `/api/bookings` when the capacity RPC returns success without an embedded booking by recovering the record from the database using idempotency/signature.

## Success Criteria

- [ ] POST `/api/bookings` no longer 500s for the observed case.
- [ ] Recovery emits `booking.create.recovered` event.

## Architecture & Components

- Update `src/app/api/bookings/route.ts` POST handler.
- Add small recovery helper (inline) that queries Supabase by idempotency key or booking signature.

## Data Flow & API Contracts

- Input/Output unchanged. Only internal path changes. If recovered, proceed as normal.

## UI/UX States

- No UI change.

## Edge Cases

- No idempotency key provided: use signature fallback.
- Duplicate create: `duplicate: true` should still return the booking.

## Testing Strategy

- Manual: Reproduce booking create flow, verify 201/200 and thank-you redirect.
- Logs: Verify no `[bookings][POST] Booking creation succeeded but no booking data was returned.`

## Rollout

- Feature flag not required; safe server-side change.
