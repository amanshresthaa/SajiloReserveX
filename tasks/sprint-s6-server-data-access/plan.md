# Sprint S6 — Server Reservation Data Access: Plan

## Goal

Create a reusable server-side data accessor (`@server/reservations/getReservation.ts`) that returns the reservation domain object plus metadata, then refactor `app/reserve/[reservationId]/page.tsx` to delegate to it while remaining a thin orchestrator.

## Implementation steps

1. **Introduce server accessor module**
   - Define `getReservation(id, { supabase })` in `@server/reservations/getReservation.ts`.
   - Responsibilities:
     - Query Supabase for the booking + related restaurant name (matching current select).
     - Run `reservationAdapter` to produce domain entity.
     - Return `{ reservation, restaurantName }` or `null` when not found.
     - Surface structured errors (e.g., `SupabaseApiError`, `UnknownError`) or minimally return `null` with logged context.
   - Accept injected Supabase client to maximise reuse; fall back to creating one only if not provided.

2. **Refactor page route**
   - Move parameter sanitisation into a small utility (keep or inline) and offload data fetch to `getReservation`.
   - Handle auth using existing `getServerComponentSupabaseClient` and redirect logic (consider extracting to helper if future reuse needed).
   - Replace inline Supabase query with helper call; redirect/notFound on `null`.
   - Maintain React Query hydration logic.

3. **Error logging and edge cases**
   - Ensure helper logs errors with context (reservation id) and rethrows/returns null so the page can `notFound`.
   - Confirm behaviour for invalid IDs remains unchanged (still 404).

4. **Testing**
   - Add unit tests for `getReservation` (Vitest) mocking Supabase client responses (success, not found, error).
   - Optional but valuable: add route-level integration test ensuring `notFound` is thrown when helper returns null.

5. **Verification**
   - Run `pnpm test` (focused filter acceptable + full suite if fast) and `pnpm lint`.
   - Use `rg` afterwards to confirm no remaining direct Supabase queries inside the route.

## Notes

- Existing `ReservationDetailClient` expects both reservation data and restaurant name primed in React Query; ensure helper returns these values so hydration stays intact.
- Keep `dynamic = 'force-dynamic'` unless business requirements change.
- If we decide to standardise error types later, leave TODO comments documenting the hook point.
