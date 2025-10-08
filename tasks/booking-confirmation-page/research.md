# Research — Booking Confirmation Page (US-003)

## Task Framing

- Loader: `/reserve/[reservationId]` must prefetch reservation data server-side, gate on auth, surface not-found, and hydrate React Query clients.
- SEO: Emit JSON-LD for reservations, ensure SSR-safe hydration props, avoid double serialization bugs.
- Analytics & offline: Confirm `emit` + `track` behaviours, queue offline events, expose offline UX.
- Tests: Add Vitest (unit/integration) and Playwright coverage for share CTA + offline alert.

## Existing Server/Data Patterns

- `app/reserve/[reservationId]/page.tsx` already resolves `params`, requires Supabase auth via `getServerComponentSupabaseClient`, redirects unauthenticated users, and calls `getReservation` (`server/reservations/getReservation.ts`). Errors bubble into `defaultErrorReporter` then `notFound()`. On success, it hydrates a React Query cache (`QueryClient.setQueryData(['reservation', reservationId], reservation)`).
  - Cross-check 1: Verified code path via file inspection.
  - Cross-check 2: Confirmed React Query key matches `reservationKeys.detail` (`reserve/shared/api/queryKeys.ts`).
- `getReservation` queries Supabase `bookings` table with a comprehensive select, maps through `reservationAdapter`, and returns `{ reservation, restaurantName }`. It throws `GetReservationError` on DB errors and returns `null` if record missing.
  - Cross-check: Reviewed Vitest coverage in `reserve/tests/server/getReservation.test.ts` to ensure expectations on success, not-found, and error wrapping.
- `useReservation` (client hook) fetches `/bookings/:id`, adapts payload with same adapter, caches under `['reservation', id]`, and handles missing ID / not-found errors; SSR loader must match this contract (reservation shape `Reservation`).
- `ReservationDetailClient` expects props `{ reservationId, restaurantName }`, reads React Query data, and builds share payloads + JSON-LD client-side.

## JSON-LD & SEO Patterns

- Client component currently injects `<script type="application/ld+json">` using `JSON.stringify(reservationJsonLd)` within `dangerouslySetInnerHTML` and `suppressHydrationWarning`.
  - Potential issues: JSON-LD recalculation occurs client-side only; SSR loader should provide serialized data to avoid flash or hydration mismatch.
- Blog article page (`app/blog/[articleId]/page.tsx`) shows precedent for server-rendered JSON-LD via `<Script>`; we can mirror semantics (unique `id`, SSR output).
- `libs/seo.tsx` offers general meta scaffolding but no direct reservation schema helper.

## Analytics & Offline Handling

- `ReservationDetailClient` uses `useOnlineStatus` to show warning alert when offline, disables share CTA, and tracks offline events via `track('network_offline')` plus async `emit('network_offline')`. Renders analytics events on various user actions (`reservation_detail_*`).
  - Cross-check: `lib/analytics.ts` defines Plausible events; `lib/analytics/emit.ts` handles queueing/flush, offline resilience (localStorage anon ID, sendBeacon fallback). Verified through Vitest tests (`reserve/tests/unit/analytics.emit.test.ts`).
- Offline detection resets `lastOnlineAtRef` to compute downtime; ensures one event per offline session. Need to ensure SSR loader surfaces enough data even when API offline (pre-hydrated fallback?).

## Sharing & Calendar Utilities

- `lib/reservations/share.ts` builds ICS downloads (`downloadCalendarEvent`) and share text (`shareReservationDetails`). Ensures fallback messages when share payload incomplete.
- Share buttons in client component disable when offline (share) or while loading.

## Testing Landscape

- Vitest: server tests live under `reserve/tests/server`, React component analytics tests under `reserve/tests/features`. No existing tests for reservation detail analytics/offline UI; we’ll add new ones respecting existing patterns (React Testing Library + vi mocks).
- Playwright: E2E suite in `tests/e2e/reservations`. `confirmation-download.spec.ts` seeds bookings via `/api/test/bookings`, signs in with fixtures (`tests/fixtures/auth`). Provides reference for hitting `/reserve/:id`, waiting for downloads, using API helpers. Share/offline scenarios currently untested.

## Accessibility & UX Guidelines

- UI uses shadcn primitives (Alert, Button, Skeleton). Buttons already meet ≥44px height; share button handles disabled state when offline to prevent user confusion.
- Alerts set `role="status"` and `aria-live="polite"` for share feedback; offline alert currently lacks `aria-live`. Need to ensure focus management/focus-visible is intact.

## Open Questions & Uncertainties

- Loader currently exists — confirm requirement is to extend (e.g., include JSON-LD data, analytics props) vs rewrite. No conflicting instructions yet.
- JSON-LD schema type: currently using generic `Reservation`; need to validate whether more specific `FoodEstablishmentReservation` improves search (future refinement).
- Analytics verification scope: unclear if tests should mock Plausible `track` or internal `emit` queue; likely focus on `emit` calls.

## Next Steps

- Validate loader responsibilities (SSR fallback state, error surfaces) and whether additional props (JSON-LD payload) should flow from server component.
- Audit offline alert semantics & ensure server-provided hydration state prevents flicker when JS disabled.
- Design Vitest + Playwright strategies aligning with existing fixtures (seed bookings, intercept analytics).
