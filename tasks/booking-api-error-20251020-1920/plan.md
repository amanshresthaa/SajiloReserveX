# Implementation Plan: Booking API Error

## Objective

Ensure customer booking creation succeeds by hardening the Supabase capacity RPC so it works on environments that have not yet adopted the new `booking_type` enum, while improving observability for future failures.

## Success Criteria

- [ ] `POST /api/bookings` returns 201/200 for valid payloads on current remote schema (no 500 due to enum casting).
- [ ] The RPC surfaces `sqlstate`/`sqlerrm` inside `details`, allowing the API layer to log diagnostic context.

## Architecture & Components

- Supabase migration redefining `create_booking_with_capacity_check` to use `%TYPE` variables instead of hard-coded enum casts and to wrap diagnostic fields inside `details`.
- No changes required in `src/app/api/bookings/route.ts`; existing `createBookingWithCapacityCheck` consumer should continue to work.
- Optional refinements in `server/capacity/transaction.ts` to pass through newly-populated `details` without regression.

## Data Flow & API Contracts

Endpoint: `POST /api/bookings`  
Request: `{ restaurantId?, date, time, party, bookingType, seating, name, email, phone, ... }`  
Response: `201` with `{ booking, confirmationToken, capacity, ... }` or non-500 error codes (`409`, `422`) for business constraints.  
Errors: Maintain existing contract; `error` string plus optional `details` for internal diagnostics (no user-facing change).

## UI/UX States

- Loading: existing wizard spinner remains unchanged.
- Empty/Error/Success: no visual adjustments; improvement is strictly backend reliability.

## Edge Cases

- Environments where `bookings.booking_type` is already an enum must continue to insert successfully (implicit cast from text).
- RPC should still return conflict/capacity exceeded responses unchanged.
- Ensure migration deploys cleanly on existing data (no dependent objects broken).

## Testing Strategy

- Unit: update/add Jest/Vitest coverage around `createBookingWithCapacityCheck` error handling if necessary.
- Integration: run targeted server integration test that mocks RPC result to ensure `details` are logged (if existing suite covers).
- Manual: exercise booking flow via `pnpm run dev` → wizard submission after migration verified (DevTools MCP later in verification).

## Rollout

- Feature flag: not required.
- Exposure: deploy migration through Supabase pipeline; safe immediately on apply.
- Monitoring: observe `[bookings][POST]` logs and observability events for reduced 500s; ensure new detail payloads appear.
