# Sprint S6 — Server Reservation Data Access: Research

## Goal

Prepare to introduce a dedicated `@server/reservations/getReservation` module and slim down the Next.js route `app/reserve/[reservationId]/page.tsx` so it delegates both data access and domain normalization.

## Current state overview

### Route implementation (`app/reserve/[reservationId]/page.tsx`)

- Handles **all** responsibilities inline:
  - Parameter sanitisation (`sanitizeReservationId`).
  - Supabase client acquisition via `getServerComponentSupabaseClient()`.
  - Auth lookups (`supabase.auth.getUser()`), redirect on anonymous user.
  - Direct Supabase query (`bookings` table with `restaurants(name)` join) plus error handling.
  - Domain mapping using `reservationAdapter` and manual extraction of restaurant name.
  - React Query priming (`QueryClient`, `dehydrate`) and rendering `HydrationBoundary`.
- No caching/memoization around data fetches; the route is marked `dynamic = 'force-dynamic'`.
- Logging uses `console.error` inline.

### Client component (`ReservationDetailClient.tsx`)

- Relies on `useReservation(reservationId)` which hits the API layer; server-rendered data is dehyrdated from the page.
- Maintains local helpers for date/time formatting.
- No direct impact on S6 aside from expecting the page to continue providing initial query cache + restaurant name.

### Supporting modules

- `reservationAdapter` already transforms Supabase payload into domain `Reservation` entity.
- No existing `@server/reservations` directory; supabase data access is scattered across route files and API handlers.
- Error handling patterns: API route (`app/api/bookings/[id]/route.ts`) recently refactored to use shared helpers but still interacts with Supabase inline.

## Opportunities for S6 implementation

- Extract Supabase fetch (including relational join and adapter) into `@server/reservations/getReservation.ts` returning `{ reservation, restaurantName }` (or richer metadata). This keeps the data access reusable in other contexts (e.g., dashboards, emails).
- Page can become a thin orchestrator:
  1. Resolve params and enforce auth via helper (maybe reuse existing auth guard if available).
  2. Call `getReservation` with dependency injection (Supabase client or configuration).
  3. Handle `null`/errors (`notFound` or redirect).
  4. Prime React Query cache and render client component.
- Centralise error logging inside helper (or raise typed errors) to avoid duplicated console calls in the page.

## Risks / considerations

- Need to confirm whether server helper should handle auth and tenant scoping or expect caller-provided supabase client with correct policy.
- Ensure type safety for `restaurants(name)` relation; new helper should codify the expected structure (e.g., using Supabase generated types or manual interfaces).
- `dynamic = 'force-dynamic'` may remain necessary if Supabase data should not be cached; confirm before removing.
- The extracted helper must be safe for server-only usage (no client references) and maintain current behaviour (redirect unauthenticated users, 404 on missing bookings).

## Unknowns / questions for planning

1. Should `getReservation` accept a user context to enforce ownership (e.g., verifying the Supabase row matches the authenticated user)? Current page implicitly trusts Supabase row-level security.
2. Do we also need a helper for updating reservation metadata, or is the fetch-only helper sufficient for this sprint?
3. Is there a shared error type (e.g., `NotFoundError`, `UnauthorizedError`) we can leverage? If not, we may introduce minimal custom errors inside the server module for clarity.

## Verification baseline

- `pnpm test` and `pnpm lint` currently pass (lint surfaces existing hook dependency warnings unrelated to this work).
- No existing tests for the page route; new helper likely needs unit/integration tests (Vitest) mocking Supabase client behaviour.
