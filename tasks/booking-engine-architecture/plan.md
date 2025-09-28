# Plan — Recreate Booking Flow System

This plan synthesizes the existing architecture and details a production-ready path to rebuild the booking engine. It assumes a modern web stack (Next.js 14 app router + React 18, TypeScript, Supabase Postgres, Resend email, React Query, Playwright/Vitest). If your target stack differs, call out variances and adjust module boundaries accordingly.

## Goals

- Feature-parity booking wizard (Plan → Details → Review → Confirmation)
- Robust server booking engine (allocation, waitlist, update, cancel)
- Strong data modeling with audit, analytics, and loyalty hooks
- Accessibility-first UI, testable and resilient

## System boundaries

- Frontend: Separate feature-sliced UI under `reserve/` (routable, testable), mounted within Next.js shell.
- API: Next.js Route Handlers (`/api/bookings`) backed by Supabase clients.
- DB: Postgres schema closely matching `database/database.sql` (with RLS policies where applicable).
- Email: Resend for confirmations/updates/cancellations.
- Analytics: Application-level table `analytics_events` + client analytics (`track`).

## Implementation steps

1. Database & schema

- Create tables and enums from `database/database.sql`:
  - Core: `restaurants`, `restaurant_tables`, `customers`, `customer_profiles`, `bookings`, `waiting_list`, `availability_rules`.
  - Observability: `audit_logs`, `analytics_events`, `observability_events`.
  - Loyalty: `loyalty_programs`, `loyalty_points`, `loyalty_point_events`.
  - Functions: `public.app_uuid()`, `tenant_permitted()`, `generate_booking_reference()`.
  - Indexes: booking lookup, overlap checks, idempotency placeholders.
- Verify RLS policies for authenticated/service_role.
- Seed `restaurants` and a few `restaurant_tables` and `availability_rules` for testing.

2. Server modules (Supabase + domain)

- Supabase clients: service client + route-handler client. Env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Customers: normalize and upsert; profile bookkeeping for bookings/cancellations.
- Bookings domain:
  - Time helpers: minutes conversion, derive end-time from booking type, overlap detection.
  - Availability selection: filter by capacity and seating; ensure no time-range overlaps with blocking statuses.
  - Insert/update with enum coercion and audit snapshot generator.
  - Waitlist insertion with dedupe and position calculation.
  - Audit event writer.
- Loyalty: load active program, compute and apply points with event log.
- Analytics: typed emitters (booking.created/cancelled/allocated/waitlisted) with schema versioning.
- Emails: Resend integration for created/updated/cancelled templates (HTML/text).

3. API routes

- `POST /api/bookings`: validate input (Zod); upsert customer; infer booking type; derive end time; find table or set `pending_allocation`; insert booking (retry unique reference); optionally award loyalty; emit analytics; send confirmation email if allocated; return normalized payload.
- `GET /api/bookings?email&phone&restaurantId?`: fetch bookings for contact via customer lookup and blocking statuses.
- `GET /api/bookings/:id`: fetch by id.
- `PUT /api/bookings/:id`: authz by email+phone; preserve current table if possible; otherwise reallocate; emit analytics; send update email; return normalized payload.
- `DELETE /api/bookings/:id`: authz by email+phone; soft cancel; analytics; email.
- Add structured logging + observability event on failure.
- Optional: add idempotency via `Idempotency-Key` header + DB unique constraint `(restaurant_id, idempotency_key)`.

4. Frontend booking app (Reserve)

- App shell: `ReserveApp` with providers for React Query; mounted via `app/reserve/page.tsx` behind feature flag `NEXT_PUBLIC_RESERVE_V2`.
- Routing: React Router under `/reserve` with `WizardPage` and details page placeholder.
- Entities & adapters: Zod schemas and normalizers for reservations.
- Shared utils: time/slot generation, booking label formatting, email/phone validation, localStorage keys.
- Wizard feature:
  - Reducer state machine with steps 1–4; explicit actions; last action + allocation flags.
  - Forms (RHF + Zod) for Plan and Details; accessible components; sticky progress footer with actions.
  - API hooks (React Query) for create/update and load-by-id; handle `ApiError` consistently.
  - Confirmation actions: ICS generation, share/copy fallback; new booking resets with remembered contact details if opted-in.
- Accessibility/perf: follow provided MUST/SHOULD rules (focus, hit targets, aria-live, reduced motion, URL reflects state, prevent CLS, etc.).

5. Configuration & env

- Next.js: `NEXT_PUBLIC_RESERVE_V2`, `NEXT_PUBLIC_DEFAULT_RESTAURANT_ID`, `NEXT_PUBLIC_RESERVE_API_BASE_URL` (`/api`), `NEXT_PUBLIC_RESERVE_API_TIMEOUT_MS`.
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Email: `RESEND_API_KEY`, `RESEND_FROM`.
- Branding: `DEFAULT_VENUE` details under `lib/venue.ts`.

6. Testing

- Unit tests for adapters and reducers; contract tests for API (request/response schemas).
- Integration tests with MSW for API hooks.
- E2E Playwright: wizard happy path, validation blocking, confirmation statuses (confirmed, waitlisted, allocation pending).

7. Security & performance hardening

- Input validation on both client and server (Zod everywhere); sanitize output.
- Rate limiting (e.g., middleware or upstream edge) on create/update/cancel endpoints.
- Idempotency for POST create.
- Concurrency: consider transaction + table-level locking or an allocation queue to avoid race conditions.
- Caching: cache availability rules; keep React Query staleTime sensible; avoid refetchOnFocus.
- Monitoring: structured logs + observability events on failure paths.

## API contracts (reference)

- Create request:
  - `POST /api/bookings`
  - Body: `{ restaurantId?, date: 'YYYY-MM-DD', time: 'HH:MM', party: number>=1, bookingType: 'lunch'|'dinner'|'drinks', seating: 'any'|'indoor'|'outdoor', notes?, name, email, phone, marketingOptIn }`
  - Response: `{ booking, bookings, waitlisted, allocationPending, loyaltyPointsAwarded }`
- Update request:
  - `PUT /api/bookings/:id`
  - Body: same as create
  - Response: `{ booking, bookings }`
- Cancel request:
  - `DELETE /api/bookings/:id?email&phone&restaurantId?`
  - Response: `{ success, bookings }`
- Load booking:
  - `GET /api/bookings/:id`
  - Response: `{ booking }`
- List bookings by contact:
  - `GET /api/bookings?email&phone&restaurantId?`
  - Response: `{ bookings }`

## Open questions / tailoring

- Target stack variants (e.g., Remix, NestJS, Django, Rails) — confirm desired stack.
- Payment integration (not implemented) — required for deposits?
- Multi-venue tenancy and auth boundaries — confirm constraints.
- Idempotency expectations — header naming and TTL policy.
- Rate limiting strategy — edge vs. app-level.

## Deliverables

- Schema migrations & seed scripts
- Server modules & API handlers with tests
- Reserve app (feature-sliced) with wizard flow and accessibility polish
- Email templates and Resend wiring
- Analytics/observability emitted on key events
- CI scripts for typecheck, lint, tests, and e2e
