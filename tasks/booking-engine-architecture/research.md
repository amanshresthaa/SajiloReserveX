# Research — Booking Engine Architecture (Reserve)

Scope: Analyze the `/reserve` module and related server/database code to fully map the booking engine architecture, data models, flows, and integrations.

## High-level shape

- Frontend: Feature-sliced React app under `reserve/` (Vite + React Router + TanStack Query + Vitest + Playwright), mounted inside Next.js via feature flag.
  - Entry + router: `reserve/app/index.tsx`, `reserve/app/router.tsx`, `reserve/app/routes.tsx`, providers `reserve/app/providers.tsx`.
  - Pages: `reserve/pages/*` render route-level components and error boundaries.
  - Features: `reserve/features/reservations/wizard/*` implements a 4-step booking wizard with hooks-first orchestration.
  - Entities: `reserve/entities/reservation/*` defines Zod schemas and adapters to normalize API payloads.
  - Shared: `reserve/shared/*` includes API client, env config, utilities, UI primitives and hooks.
  - Tests: `reserve/tests/*` unit + e2e scaffolding.
- Next.js shell: `app/reserve/page.tsx` toggles legacy flow vs. new `ReserveApp` via `NEXT_PUBLIC_RESERVE_V2`.
- API: Next.js route handlers under `app/api/bookings` implement booking CRUD, allocation/waitlist, analytics, emails, and loyalty points.
- Server lib: `server/*` hosts booking logic (allocation, overlaps, audit logs), Supabase clients, customers, analytics, emails, loyalty.
- Database: `database/database.sql` lays out core tables (restaurants, tables, customers, bookings, waiting_list, loyalty, analytics_events, audit_logs), helper functions, policies, indexes.

## Reserve app architecture

- Router tree: `reserve/app/routes.tsx`
  - `/reserve` (root layout `ReserveRootLayout`) → index `WizardPage` → wizard content
  - `/reserve/new` → same wizard (lazy component)
  - `/reserve/:reservationId` → placeholder details page (lazy)
  - `*` 404 → `NotFoundPage`
- Providers: `reserve/app/providers.tsx` wraps with TanStack Query client + devtools.
- Wizard feature:
  - Reducer + state: `reserve/features/reservations/wizard/model/reducer.ts`
    - Steps: 1 Plan → 2 Details → 3 Review → 4 Confirmation
    - State: `step`, `submitting`, `loading`, `error`, `editingId`, `lastAction` (create/update/waitlist), `waitlisted`, `allocationPending`, `bookings`, `details`, `lastConfirmed`.
    - Actions: `SET_STEP`, `SET_FIELD`, `SET_SUBMITTING`, `SET_LOADING`, `SET_ERROR`, `SET_BOOKINGS`, `SET_CONFIRMATION`, `START_EDIT`, `RESET_FORM`, `HYDRATE_CONTACTS`.
    - Derived helpers: time normalization, option coercion, initial state.
  - Schemas: `reserve/features/reservations/wizard/model/schemas.ts`
    - `planFormSchema`: date/time/party/bookingType/notes rules; uses `bookingHelpers.isEmail/isUKPhone` for patterns.
    - `detailsFormSchema`: name/email/phone, consent booleans, marketing opt-in.
  - Hooks: `useReservationWizard` orchestrates sticky footer actions, localStorage of contacts, builds draft, submits via `useCreateReservation`, transitions to confirmation with server result, analytics tracking.
  - API hooks:
    - `useCreateReservation` POST/PUT to `/api/bookings` and `/api/bookings/:id`, normalizes responses with entity adapters, invalidates caches.
    - `useReservation` loads a specific reservation via `/api/bookings/:id`.
  - UI:
    - `PlanStep.tsx`: calendar, time slots, party size, booking type selection with availability cues (happy hour, kitchen closed), notes. Validates via Zod/RHF, derives default service per time/date.
    - `DetailsStep.tsx`: contact info, remember details, marketing opt-in, agree to terms; validation with error surfacing and inline alerts.
    - `ReviewStep.tsx`: summary, error display, actions to edit or confirm (disabled + spinner during submit).
    - `ConfirmationStep.tsx`: shows confirmed/allocated/waitlist status, ICS download and “wallet/share” copy/share flow, action bar.
    - Layout/footer/progress: sticky progress footer with current step, selection summary, and contextual actions.
  - Shared utils: `reserve/shared/utils/booking.ts` re-exports helpers from `components/reserve/helpers.ts` (slot gen, time formatting, bookingType inference, storage keys).
  - API client: `reserve/shared/api/client.ts` wraps fetch with base URL, timeout, JSON parsing, and normalized ApiError.
  - Env: `reserve/shared/config/env.ts` validates `NEXT_PUBLIC_RESERVE_API_BASE_URL`, `NEXT_PUBLIC_RESERVE_API_TIMEOUT_MS`, `NEXT_PUBLIC_RESERVE_V2`.

## Server-side booking engine

- Core functions: `server/bookings.ts`
  - Time utils: `minutesFromTime`, `minutesToTime`, `inferMealTypeFromTime`, `calculateDurationMinutes`, `deriveEndTime`, `rangesOverlap`.
  - Customer resolution: `findCustomerByContact`, `upsertCustomer` (in `server/customers.ts`).
  - Availability: `fetchTablesForPreference` (capacity + seating match) and `findAvailableTable` (scan tables; reject overlaps against `BOOKING_BLOCKING_STATUSES`).
  - Bookings:
    - `insertBookingRecord`: strong typing + enum validation + marketing opt-in + profile update.
    - `updateBookingRecord`: validated updates, optional enum coercion.
    - `softCancelBooking`: set status to `cancelled`, update profile.
  - Audit logging: `buildBookingAuditSnapshot` and `logAuditEvent` → `audit_logs` table with before/after snapshots (subset of fields).
  - Waitlist: `addToWaitingList` handles dedupe/update and returns position via `resolveWaitlistPosition`.
- API routes:
  - `app/api/bookings/route.ts`
    - GET: list active bookings for a contact (email+phone) with optional `restaurantId`.
    - POST: create reservation
      - parse input (Zod), infer meal type (unless drinks), derive `end_time`, upsert customer, find table or mark allocation pending, create booking with unique reference (retries), optional loyalty award (if program active), analytics emit (created, waitlisted/allocated), send email unless allocation pending, return `{ booking, bookings, waitlisted, allocationPending, loyaltyPointsAwarded }`.
  - `app/api/bookings/[id]/route.ts`
    - GET: fetch a booking by id.
    - PUT: update booking
      - AuthZ: verifies email/phone match booker; re-use current table if possible; else find a new table; set status accordingly; analytics emit (allocated, reallocated), send update email; return `{ booking, bookings }`.
    - DELETE: cancel booking
      - AuthZ: verifies email/phone match; soft cancel; analytics emit (cancelled); send cancellation email; return `{ success, bookings }`.
- Supabase clients: `server/supabase.ts`
  - `getServiceSupabaseClient()` service role client for server routes; `getRouteHandlerSupabaseClient()` for tenant-aware queries.
  - Default restaurant id from env with fallback.
- Emails: `server/emails/bookings.ts` via `libs/resend.ts` (Resend). Branded HTML/text bodies with venue info; links back to `/reserve?view=manage&email=...&phone=...`.
- Analytics: `server/analytics.ts` emits typed events to `analytics_events` table.
- Loyalty: `server/loyalty.ts` active program retrieval, rule parsing, points awarding and eventing.

## Data model highlights (database)

- `bookings`: core booking entity with `restaurant_id`, `customer_id`, `table_id`, `booking_date`, `start_time`, `end_time`, `party_size`, `booking_type`, `seating_preference`, `status`, contact fields, `reference`, `marketing_opt_in`, `source`, `loyalty_points_awarded`.
  - Indexes: `(table_id, booking_date, start_time) INCLUDE (end_time,status,party_size,seating_preference,id)`; customer lookup; idempotency-related indexes (`idempotency_key`, `(restaurant_id,idempotency_key)` unique nullable), `client_request_id`, `pending_ref` unique.
- `restaurant_tables`: `capacity`, `seating_type`, features.
- `waiting_list`: dedupe keys; indexed by restaurant/date/time.
- `customers`, `customer_profiles`: normalized customers + aggregated stats.
- `loyalty_programs`, `loyalty_points`, `loyalty_point_events`: per-restaurant loyalty with tiering.
- `analytics_events`, `audit_logs`, `observability_events`: tracking and monitoring.
- RLS policies: service_role unrestricted; authenticated has tenant-aware read/modify; public functions (`tenant_permitted`, `app_uuid`, `generate_booking_reference`).

## Front ↔ API contracts

- Create/Update requests: `{ restaurantId?, date: YYYY-MM-DD, time: HH:MM, party: number>=1, bookingType: 'lunch'|'dinner'|'drinks', seating: 'any'|'indoor'|'outdoor', notes?, name, email, phone, marketingOptIn }`.
- Response (create): `{ booking, bookings, waitlisted, allocationPending, loyaltyPointsAwarded }`.
- Response (update): `{ booking, bookings }`.
- Error shape (client): `ApiError { code, message, details?, status? }` from `reserve/shared/api/client.ts`.

## Tests

- Unit: `reserve/tests/unit/reservation.adapter.test.ts` validates adapter normalization.
- E2E (Playwright): `reserve/tests/e2e/wizard.plan.spec.ts` validates wizard blocking on required fields; `reserve/tests/e2e/reserve.smoke.spec.ts` scaffold.
- Setup: `reserve/vitest.config.ts`, `reserve/tests/setup-tests.ts` for Testing Library DOM assertions.

## Notable gaps / risks

- No explicit rate limiting on API endpoints; susceptible to abuse.
- Idempotency fields exist in DB but not wired in API handlers.
- Payment processing not implemented; no PCI concerns in code.
- AuthN: Booking endpoints operate without user auth; rely on email/phone proof for update/cancel.
- Availability assumes per-day, per-table blocking windows only; no global capacity or service limits modeled (though `availability_rules` table exists).
- Concurrency: table allocation done with sequential checks; potential race conditions on concurrent creates; mitigated partially by post-insert analytics and audit logs, but no transaction/locking on allocation; could be enhanced.
- Emails require `RESEND_API_KEY`/`RESEND_FROM` env; failures are logged, not fatal to booking.

---

## File index (key files)

- reserve/app/index.tsx, router.tsx, routes.tsx, providers.tsx
- reserve/pages/\* (RootLayout, WizardPage, RouteError, NotFoundPage, ReservationDetailsPage)
- reserve/features/reservations/wizard/model/{reducer.ts, schemas.ts}
- reserve/features/reservations/wizard/hooks/useReservationWizard.ts
- reserve/features/reservations/wizard/api/{useCreateReservation.ts, useReservation.ts, types.ts}
- reserve/features/reservations/wizard/ui/\* (steps, layout, footer, progress)
- reserve/entities/reservation/{reservation.schema.ts, adapter.ts}
- reserve/shared/{api/client.ts, utils/booking.ts, config/env.ts}
- app/api/bookings/{route.ts, [id]/route.ts}
- server/{bookings.ts, supabase.ts, emails/bookings.ts, analytics.ts, loyalty.ts, customers.ts}
- database/database.sql
