# Research: Improve Reserve Booking Flow Prompt

## Existing Patterns & Reuse

- `/reserve/r/[slug]` renders `components/reserve/booking-flow` → `reserve/features/reservations/wizard` (Plan → Details → Review → Confirmation). UI already built on shared Shadcn-based primitives (`@shared/ui/*`), React Hook Form, and React Query providers.
- Data adapters & mutations live under `reserve/features/reservations/wizard/api` and reuse `@entities/reservation` adapters to map Supabase payloads.
- Server-side booking creation handled by `src/app/api/bookings/route.ts`, delegating to shared services (`server/capacity`, `server/bookings`, `server/security/rate-limit`, loyalty, observability). Schedule data comes from `server/restaurants/schedule`.
- Availability & occasions fetched via `/api/restaurants/[slug]/schedule`, shared schedule builder in `server/restaurants/schedule.ts` and client hooks (`useTimeSlots`, `usePlanStepForm`).
- Supabase schema defines `public.bookings` table with constraints, triggers, indexes, RLS, and relationships to `customers`, `restaurants`, `booking_table_assignments`, etc. Capacity engine RPC fallback exists.

## External Resources

- Internal docs: `VISUAL_ARCHITECTURE.md`, `ROUTE_QUICK_REFERENCE.md`, Supabase migration `20251019102432_consolidated_schema.sql` for database ground truth.
- No external APIs besides Supabase PostgREST + Upstash Redis (rate limiting) and Resend/Nodemailer (notifications) referenced in flow side-effects.

## Constraints & Risks

- Manual QA via Chrome DevTools MCP mandated for UI changes; prompt must call this out if requesting verification.
- Supabase is remote-only; booking creation depends on RPCs and triggers. Prompt should not imply local DB mutations.
- Booking create endpoint enforces rate limits (60/min/IP), operating window validation, past-time blocking (feature flag), loyalty awarding, and background jobs—prompt must reflect these safeguards.
- Capacity RPC may be missing; fallback path still inserts booking but tags details—documented behaviour to include.
- Front-end wizard supports customer & ops modes; prompt should clarify default (customer) but note ops path if relevant.

## Open Questions (and answers if resolved)

- Q: What tables participate in booking creation?
  A: `public.bookings` (core), `public.customers` (lookup/upsert), `booking_table_assignments` (through capacity engine), loyalty tables, analytics events, plus schedule data from `restaurants`, `service_periods`, `operating_hours`.
- Q: How is concurrency handled?
  A: Capacity engine runs in transaction via `createBookingWithCapacityCheck` with retry/backoff on serialization failures; idempotency enforced via `Idempotency-Key` header and unique indexes.
- Q: Which client state management?
  A: React Query for async data, local reducer/store for wizard state via `useWizardStore`.

## Recommended Direction (with rationale)

- Build prompt around actual architecture: Next.js App Router front-end (`BookingWizard`), Supabase-backed APIs, capacity engine. Enumerate each requested section with repo-specific facts (e.g., Plan Step inputs, schedule API path, booking schema fields).
- Reference concrete modules (paths) and database columns to ground reviewer analysis.
- Include explicit expectations for diagrams/code snippets (e.g., mention `server/app/api/bookings/route.ts` for logic snippets, Supabase ERD for schema).
