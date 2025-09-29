# Research: Reservation Platform Hardening

## Architecture & Framework

- **Next.js 15 App Router** drives the main shell (`app/`), with React 19 and Tailwind 4 (`package.json`). Global providers (`app/providers.tsx`) wrap the tree with a TanStack Query client but there is **no existing SSR prefetch/hydration** pattern (`react-query` never dehydrates). `getServerComponentSupabaseClient` in `server/supabase.ts` is defined but unused, meaning SSR data access is an open space.
- The `/reserve` experience mounts a feature-sliced React Router app under `reserve/` (ADR-0001) when `NEXT_PUBLIC_RESERVE_V2` is enabled. Query + adapter patterns live there (`reserve/app/providers.tsx`, `reserve/entities/reservation`). The Next.js fallback renders legacy client components (`components/reserve/booking-flow`).
- Supabase is the primary backend. `getRouteHandlerSupabaseClient`/`getServiceSupabaseClient` (service-role) mediate API access. Server routes often escalated to service role to dodge RLS (`app/api/bookings/route.ts`:592-676). `middleware.ts` gates `/dashboard` behind Supabase auth but customer-facing routes are public.

## Booking APIs & Schemas

- `app/api/bookings/[id]/route.ts` already exposes `GET /api/bookings/:id`, returning raw booking rows (includes `restaurant_id`, `start_at`, `updated_at`, etc.). The reserve app’s `useReservation` hook reuses this endpoint through `reservationAdapter`, which normalizes to the Zod schema (`reserve/entities/reservation`). No UI currently uses the adapter in the Next.js shell; `reserve/pages/ReservationDetailsPage.tsx` is just a placeholder.
- Booking list (`/api/bookings?me=1`) powers the dashboard table. `useBookings` (client) handles pagination and uses `fetchJson` with browser credentials. There’s no React Query detail cache yet (`queryKeys.bookings.detail` defined but unused).
- Booking records include `pending_ref`, `client_request_id`, `idempotency_key`, `details`, and maintained timestamps. Table triggers update `updated_at` and mirror mutations into `booking_versions` (history), but there is **no optimistic concurrency guard** (updates just `eq("id", bookingId)`), nor idempotency persistence beyond storing the raw key.

## UI Patterns & Accessibility

- Dashboard table & dialogs rely on headless button/dialog components with accessible markup. `EditBookingDialog` uses React Hook Form + Zod, accessible labels, inline errors, and analytics events (`emit`). Focus trapping comes from Radix dialog primitives (`components/ui/dialog`). Skeletons replicate layout (`components/dashboard/BookingsTable.tsx`).
- CTA analytics already exist for edit/cancel flows (`hooks/useUpdateBooking`, `hooks/useCancelBooking`). They emit `booking_edit_*` / `booking_cancel_*` events before/after API calls.
- There is currently **no reservation detail UI**: Next shell lacks a route, and React Router detail page is unimplemented. Conflict/reschedule banners aren’t surfaced anywhere.

## Analytics & Observability

- Front-end analytics events queue in `lib/analytics/emit.ts`, batching POSTs to `/api/events` with hashed identity + context. The server simply validates payloads and responds 202; there is no integration with an external warehouse.
- Server analytics functions (`server/analytics.ts`) log booking lifecycle events into `analytics_events`. API routes attempt to record events and catch/log failures (`app/api/bookings/[id]/route.ts`:257-283, 530-534).
- Observability is limited to `recordObservabilityEvent` writing to `observability_events`, with guardrails documented in `docs/observability/README.md`. No Sentry or OpenTelemetry integration exists yet.

## Auth & Security

- Auth relies on Supabase cookies (SameSite Lax + Secure via platform defaults). There is **no CSRF mitigation** on mutating routes; APIs trust the presence of a valid Supabase session/cookie. No double-submit token, anti-forgery headers, or request signing is in place.
- Supabase RLS today is **tenant-scoped** using `tenant_permitted(restaurant_id)` (database/database.sql:945-1016). PGTap tests (`database/tests/tenant_rls.sql`) confirm tenants can only see their restaurant’s data. There is **no policy enforcing “customer can only read/write own bookings”**; server routes use the service role to bypass RLS and enforce email/phone matches at application level.

## Testing & Tooling

- Playwright config (`playwright.config.ts`) points to `reserve/tests/e2e` with minimal reporters and no test fixtures. Current suites are scaffolds: `reserve/tests/e2e/reserve.smoke.spec.ts` is skipped; `wizard.plan.spec.ts` only checks validation when `baseURL` is configured. There’s no root-level E2E suite exercising the Next app or dashboard.
- MSW is installed but unused. No Playwright fixtures stub network; no Supabase seeding helpers exist, though the SQL schema seeds refer to deterministic IDs. Database folder provides SQL migrations & pgtap tests but **no CLI wiring** for automated seeding.
- There’s no CI pipeline defined here, but instructions call for headless runs with video artifacts—requiring config updates to `playwright.config.ts` and likely GitHub actions (not present yet).

## Performance & Data Handling

- Dashboard pagination is page-number-based, making it susceptible to drift when bookings change. `BookingsTable` renders all rows without virtualization or windowing (10 rows by default). There’s no virtualization library added to the Next workspace (lockfile lists `@tanstack/react-virtual` only as a transitive dependency via tooling).
- Images and assets rely on Next built-ins; no virtualization/infinite scroll exists. Query staleTime for bookings is 30s; refetch on focus disabled.

## Open Questions / Assumptions

- It’s unclear whether the new reservation detail page should live in the Next shell or inside the Reserve React Router app once it leaves placeholder status. The task’s SSR requirement suggests a Next.js route under `/reserve/[reservationId]` or similar, leveraging server components plus client hydration.
- No guidance yet on analytics event naming for “Rebook” or “Conflict” banners. Existing events follow `booking_*` patterns (snake_case). Need confirmation or adopt consistent naming within analytics conventions.
- Supabase CLI usage for seeding isn’t documented; we may need to craft scripts leveraging `supabase db reset/seed` plus fixture SQL. Confirm availability of CLI in CI environment.
- Observability stack target (Sentry DSN, OTEL collector endpoint) is unspecified; integration scaffolding will need environment variables & deployment coordination.
