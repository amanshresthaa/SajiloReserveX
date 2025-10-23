```markdown
Analyze the `/reserve/r/[slug]` booking creation flow implemented by `components/reserve/booking-flow` (Next.js App Router) and the wizard modules in `reserve/features/reservations/wizard`. Base every finding on this repository’s code, services, and Supabase schema. Use the outline below and cite the key files, functions, or tables that support each point.

1. Architecture Overview
   - Map the front-end hierarchy: `src/app/reserve/r/[slug]/page.tsx` → `BookingFlowPage` → `BookingWizard` (Plan, Details, Review, Confirmation). Call out providers (React Query, wizard DI, analytics, Supabase session hooks).
   - Describe backend layers for creation: `POST /api/bookings` (`src/app/api/bookings/route.ts`) orchestrating validation, capacity RPC (`server/capacity`), loyalty, audit logging, and background jobs (`server/jobs/booking-side-effects`).
   - List supporting modules: schedule service (`server/restaurants/schedule.ts`), rate limiting (`server/security/rate-limit.ts`), observability, and feature flags in `env.featureFlags`.
   - Summarize technology stack (Next.js App Router, React Query, Shadcn UI, Supabase, Upstash Redis, Resend/Nodemailer) and any external integrations invoked in this path.
   - Detail the Supabase entities involved: `public.bookings`, `public.customers`, capacity/assignment tables, audit tables. Include relationships, triggers, indexes, and RLS constraints pulled from `supabase/migrations/20251019102432_consolidated_schema.sql`.

2. Booking Flow Logic
   - Walk through the `bookingSchema` validation, idempotency handling, rate limiting, schedule lookup (`getRestaurantSchedule`), past-time and operating-window checks, capacity transaction (`createBookingWithCapacityCheck` / validation service), duplicate detection, loyalty awarding, audit logging, and job enqueueing.
   - Explain how the wizard builds the payload (`buildReservationDraft`) and uses `useCreateReservation` (React Query mutation) with adapters (`@entities/reservation/adapter`).
   - Document business rules: booking windows, interval normalization, service inference, seating preferences, marketing opt-in defaults, feature-flagged behaviours.
   - Cover error handling paths: Zod errors, `BookingValidationError`, `PastBookingError`, rate limit responses, capacity fallbacks (including missing RPC branch).
   - Describe state transitions in the reducer (`reserve/features/reservations/wizard/model/reducer.ts`) across steps 1–4.

3. UX/UI Flow & Rules
   - Provide a screen-by-screen journey for Plan (`PlanStepForm`), Details (`DetailsStep`), Review, and Confirmation, noting layout components, responsive classes, sticky progress/footer, and offline banners.
   - Enumerate form fields, input types, validation feedback (inline, toast/alert), disable/enable logic (e.g., locked contact fields when authenticated).
   - Highlight user interactions: date picker (`Calendar24Field`), time slot grid, occasion picker, notes accordion, marketing opt-in, agreements, summary actions, confirmation sticky sheet actions (calendar, wallet, new booking).
   - Document loading and skeleton states, plan alerts, error banners, duplicate booking messaging, success copy with confirmation token.
   - Cover accessibility features: semantic headings, `aria-live` regions, focus management, keyboard navigation, offline announcement focus trap.
   - Describe responsive behaviour and layout breakpoints present in Tailwind classes.
   - Explain visual hierarchy: card wrappers, typography scales, step progress indicators, sticky confirmation component.

4. UX/UI Rules & Expectations
   - Specify when fields enable/disable (e.g., time selection blocked when schedule unavailable, contact locks for signed-in users).
   - Spell out conditional visibility (notes accordion, alerts, sticky actions).
   - Detail real-time updates: React Query refetch on date change, slot availability refresh, offline detection toggling actions.
   - Clarify draft persistence (`useRememberedContacts`) vs. manual submission, navigation/back behaviour, session timeouts (if absent, note gaps).
   - Document confirmation dialogs/warnings (e.g., destructive alerts) and any missing safeguards.

5. Data Flow
   - Diagram request/response payloads for:
     - `GET /api/restaurants/[slug]/schedule` returning `ReservationSchedule`.
     - `POST /api/bookings` body/response (include confirmation token, loyalty points, related bookings).
   - Show transformations: wizard state → draft → API payload → adapters → store updates.
   - Note validation layers (client schema, server Zod, capacity RPC, database constraints).
   - Describe caching and invalidation (React Query keys, hydration from server) and any local storage usage (`useRememberedContacts`).
   - Explain real-time or near-real-time updates (schedule prefetch, sticky actions updates).

6. Key Operations
   - Break down availability checking (`useTimeSlots`, schedule builder, occasion availability flags).
   - Describe reservation locking/holding via capacity transaction, table assignments, and retry strategy.
   - Outline payment handling (if absent, state that no payment integration exists in this flow).
   - Document confirmation + notification workflow: confirmation token generation (`generateConfirmationToken`), email jobs, loyalty application.
   - Explain calendar/schedule sync options (ICS download, Wallet share) powered by `@/lib/reservations/share`.

7. Edge Cases & Error Handling
   - Detail concurrent booking handling (idempotency keys, capacity retries).
   - Explain behaviour on network failures (React Query errors, offline banner, retry guidance).
   - Cover partial completion: returning to earlier steps, stored contacts, duplicate detection messages.
   - Discuss timeout handling (client/server) and missing pieces if not implemented.
   - Enumerate validation failures across layers and resulting UX (alerts, sticky actions disabled).
   - Describe recovery mechanisms (retries, fallback messaging, logs).

8. Visual Deliverables
   - Produce:
     - Architecture diagram showing front-end wizard ↔ API ↔ Supabase/capacity services.
     - Sequence diagram for booking creation (Plan submission through confirmation).
     - State machine diagram for wizard steps and transitions.
     - Wireframes/UI flow for each step with annotations on inputs/alerts.
     - ERD/data model focusing on `public.bookings` and related tables.
   - Ground diagrams in actual modules/tables noted above; include code references or payload snippets where they clarify interactions.

Include code snippets for critical logic (e.g., validation blocks, mutation hooks, schedule builder) and annotated UI captures tied to the components listed.
```
