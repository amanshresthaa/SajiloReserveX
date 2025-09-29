# Plan: Reservation Platform Hardening

## Scope Overview

Deliver six upgrades across reservations UX, QA, security, data integrity, performance, and observability. Work must align with existing TanStack Query + Supabase patterns, reuse Zod adapters, and respect accessibility/performance guardrails.

## 1. Reservation Detail View (SSR + Hydration)

1. **Route placement**: Introduce Next.js route `app/reserve/[reservationId]/page.tsx` (or `/reservations/[id]` if product wants non-reserve path) to satisfy SEO/Shareable link/top-level SSR requirement. Use server component for data fetch.
2. **Data fetch & hydration**:
   - Use `getServerComponentSupabaseClient()` to fetch booking by id via Supabase service (respecting RLS) or call existing REST endpoint.
   - Canonicalize response with `reservationAdapter` + `reservationSchema` (reuse from `reserve/entities/reservation`).
   - Dehydrate TanStack Query state server-side (`dehydrate` + `HydrationBoundary`) and hydrate client component (new `ReservationDetail` using `useReservation` hooking to `/api/bookings/:id`).
3. **UI composition**:
   - Build detail layout with existing design tokens (tailwind) and accessible structure (heading order, definition list/table for details).
   - Surface server-side load states/errors: fallback for 404, network issues. Show conflict/rescheduled banners when booking status indicates `pending_allocation`, `pending`, or `details` embed conflicts (investigate `details` payload; add adapter to detect `allocation_pending`, `details.conflict`).
   - Include CTA group: `Rebook` (links to `/reserve/new` prefilled? or call to action), `Edit`, `Cancel`. `Edit` and `Cancel` open existing dialogs or route to wizard? Confirm handshake (likely reuse `EditBookingDialog`/`CancelBookingDialog`). Manage focus & keyboard per guidelines.
4. **Analytics wiring**: Emit `reservation_detail_viewed`, `reservation_detail_edit_clicked`, `reservation_detail_cancel_clicked`, `reservation_detail_rebook_clicked` (naming TBD). Use `lib/analytics/emit`. Consider server event on SSR view? Document for instrumentation.
5. **Error boundaries**: Provide not-found page (`generateMetadata` for dynamic title) and catch errors with ErrorBoundary to maintain SEO.
6. **Documentation & Tests**: Add unit tests for adapter detection if new logic added; note SSR hydration tests (React Testing Library + `renderToString`?).

## 2. Playwright Green-Path E2E + Smoke Suite

1. **Config upgrades**: Expand `playwright.config.ts` with baseURL, retries for CI, outputDir for traces/videos, workers per env, `use` defaults (headless, viewport, storageState?). Configure `reporter` for CI (list + html or github). Enable artifact retention.
2. **Test scaffolding**:
   - Create root-level `tests/e2e/reservation-happy-path.spec.ts` covering flow: create booking → review → confirm → dashboard view → edit → cancel.
   - Use page objects or helper functions for readability. Ensure accessible selectors (role-based).
3. **MSW integration**: Add Playwright test fixture to spin MSW in browser context for mailer/analytics routes. Possibly load `public/mockServiceWorker.js` via `worker.start()` in `beforeEach`.
4. **Supabase seeding**:
   - Implement CLI-driven seed command (scripts or test hook) to populate deterministic booking/customer data. Possibly call `supabase db reset --env-file` with SQL fixture (`tests/e2e/seed.sql`). Provide helper script invoked pre-test.
   - Document env requirements (SUPABASE_SERVICE_ROLE_KEY etc.). Establish teardown or idempotent seeds.
5. **CI readiness**: Document how to run headlessly (`pnpm test:e2e`) and ensure config writes artifacts to `./test-results`. Add README note for enabling GitHub Actions (if not implemented now, at least config).

## 3. Auth & CSRF Posture

1. **CSRF strategy**: Implement double-submit token or custom header (e.g., `x-csrf-token`).
   - Generate token server-side (e.g., `crypto.randomUUID()`) stored in httpOnly cookie + page meta.
   - Expose via `/api/auth/csrf` or embed in layout (`AppProviders` context) for client fetch.
   - Update `fetchJson` to automatically attach header from cookie/local storage.
   - Add validation middleware for API mutating routes (POST/PUT/PATCH/DELETE) checking header vs cookie.
2. **Supabase RLS verification**:
   - Audit policies to ensure customers can only read/write their own bookings. Possibly create dedicated policy for `authenticated` role restricting to `auth.uid()` + membership.
   - If needed, introduce `customer` role or rely on `profile` linking `auth.users` to `customers` tables.
   - Write Postgrest / pgtap tests confirming read/write isolation for customers vs. staff (extend `database/tests/tenant_rls.sql`).
3. **Session Hardening**: Confirm cookies flagged `SameSite=Lax`, `Secure`. Document in README.

## 4. Concurrency & Idempotency Hardening

1. **Optimistic concurrency**:
   - Add `version` integer (or leverage `updated_at`) to `bookings` table via SQL migration. Default 0 with trigger increment on update.
   - Update `updateBookingRecord` + API routes to require `If-Match`/`If-Unmodified-Since` style guard (e.g., pass `version` in payload and include `where` clause `.eq('version', expected)` or `updated_at` match).
   - Surface 409 Conflict on mismatch; front-end to refetch & show banner (`booking_conflict`, `booking_rescheduled`).
2. **Idempotency store**:
   - Create new table (e.g., `booking_idempotency_keys`) with columns `key`, `response`, `status`, `expires_at`. TTL index.
   - Wrap POST /api/bookings to check store before executing; save response payload for replays.
   - Add GET `/api/bookings/idempotency/:key` to retrieve status (persist response snapshot).
   - Update create reservation client to poll/handle new endpoint on failure.
3. **Bookkeeping**: Ensure TTL job (SQL or script) cleans stale idempotency rows. Add tests verifying duplicate POST returns same response.

## 5. Dashboard Virtualization & Cursor Pagination

1. **API changes**:
   - Extend `/api/bookings?me=1` to support cursor params (`after`, `limit`). Use (`start_at`, `id`) composite cursor (lexicographic) to avoid duplicates.
   - Return `pageInfo` with `nextCursor`, `hasMore`. Maintain backward compatibility (maybe support both page & cursor via feature flag).
2. **Hook updates**:
   - Add `useBookingsInfinite` using `useInfiniteQuery` to consume cursor API; keep existing `useBookings` for fallback until migration complete.
   - Integrate virtualization with `@tanstack/react-virtual` to render rows lazily (10-15 row window). Manage accessible semantics (table roles) with virtualization container.
3. **UI updates**:
   - Replace manual pagination controls when infinite scroll active (maybe load-on-scroll + sentinel). Provide `Load more` button fallback for keyboard users.
   - Ensure focus management when data loads; `scroll-margin-top` for anchored content.
   - Maintain skeleton + empty states.

## 6. Observability Enhancements

1. **Sentry integration**:
   - Add `@sentry/nextjs` and `@sentry/node`. Configure DSN via env. Initialize for both browser & server (wrap in `sentry.server.config.ts` etc.). Tag Supabase request id, user context (email hashed) respecting privacy.
2. **OpenTelemetry traces**:
   - Introduce `@opentelemetry/api` and optional instrumentation libs. Implement simple tracing middleware for API routes capturing request → Supabase call → mailer send (wrap `sendBooking...` with spans).
   - Provide exporter config (OTLP HTTP) with env toggles.
3. **Request correlation**:
   - Generate `x-request-id` per request (middleware or API handler). Propagate through Supabase logs (pass via `details` json) and analytics events.
   - Update `lib/analytics/emit` to include `requestId` in payload props when available.
4. **Documentation & Dashboards**:
   - Update `docs/observability/README.md` with new instrumentation instructions, environment variables, and how to view traces.

## Cross-Cutting Tasks

- **Feature flags**: Consider toggles for major changes (cursor pagination, SSR detail) to mitigate rollout risk.
- **Testing matrix**:
  - Unit tests for new hooks/components (React Testing Library / Vitest).
  - Integration tests for API changes (`tests/server` with mocked Supabase or supertest?).
  - Database tests for migrations & RLS (pgtap).
  - E2E coverage (Playwright) after new flows.
- **Documentation**: Update README or `/docs` to reflect new workflows (CSRF token retrieval, running Playwright seeds, new endpoints).
- **Migration sequencing**: Coordinate database migrations (version/idempotency tables, cursor indexes) with feature deployment; ensure backwards compatibility during deploy (API should support both page & cursor until front-end switch).
- **Monitoring**: Add TODO to create dashboards/alerts once Sentry/OTEL live.

## Open Items for Confirmation

1. Preferred URL for reservation detail page (`/reserve/:id` vs `/reservations/:id`).
2. Analytics event naming conventions for new CTAs (snake_case vs dot notation).
3. Whether “Rebook” should deep-link into wizard with existing reservation context or trigger support workflow.
4. Target infrastructure for OpenTelemetry exporter (collector URL, auth method).
5. Availability of Supabase CLI + credentials in CI for seeding.
