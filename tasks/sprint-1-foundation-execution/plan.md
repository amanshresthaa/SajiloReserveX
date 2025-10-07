# Implementation Plan — Sprint 1 Foundation & Infrastructure

_Task slug_: `sprint-1-foundation-execution`  
_Date_: 2025-01-13  
_Dependencies_: `tasks/customer-frontend-architecture/*` specs, Supabase staging project, Plausible workspace

## Story Mapping & Scope

- Adopt sprint backlog from `tasks/customer-frontend-architecture/sprint-plan.md`.
  - US-001 ≙ S1 Booking Discovery Flow
  - US-002 ≙ S2 Booking Wizard (steps 1–4)
  - US-003 ≙ S3 Booking Confirmation Page
  - US-004 ≙ S4 Dashboard (Bookings table)
  - US-005 ≙ S5 Profile Management
  - US-006 ≙ S6 Wizard QA & Offline resilience
  - US-007 ≙ S7 Auth flow & guards
  - US-008 ≙ S8 Blog skeleton (stretch)
  - US-009 ≙ S9 Analytics wiring (stretch)
  - US-010 reserved for sprint ops (tracker, CI, demo assets)
- Sprint ops targets: velocity 45–50 pts, ≥80% acceptance criteria pass rate, CI green by Day 8, demo-ready staging by Day 10.

## Cross-Cutting Foundations

1. **Sprint tracker & ceremonies**
   - Create `tasks/sprint-1-foundation-execution/tracker.md` logging daily standups (owners FE1/FE2/BE/DES/QA/TL/PO) and story status swimlane (To Do → In Progress → Review → Done).
   - Maintain daily summaries in tracker and mirror key points into existing log if requested.
2. **Environment verification**
   - Validate Node 20.11+ / pnpm 9+ / Supabase CLI; run `pnpm validate:env`.
   - Document `.env.example` updates if new keys required (Supabase URL/key, Plausible domain, router base path).
3. **Quality gates**
   - Configure Vitest coverage report (target 90%) and Playwright mobile viewport pipeline.
   - Ensure lint/typecheck/test/build scripts hooked into CI (GitHub Actions? check `.github` — add workflow if missing).

## Implementation Streams

### US-001 — Booking Discovery Flow (S1, 8 pts)

- **Goal**: `/` marketing page shows restaurant listing with filters, skeletons, error/empty states, analytics instrumentation.
- **Reuse**:
  - `components/marketing/RestaurantBrowser` + existing tests (`reserve/tests/features/restaurant-browser.test.tsx`).
  - Design tokens & layout patterns from architecture spec (“Home Page” content).
- **Tasks**:
  1. Wire React Query hook `useRestaurants` in `lib/restaurants` (fetch `/api/restaurants`, take initial data from props).
  2. Build Next App Router page: server loader fetches initial data, passes to `RestaurantBrowser`.
  3. Extend component for filters (cuisine, price, availability) referencing spec; ensure mobile-first (stacked cards) and 44px hit areas.
  4. Analytics: call `track('restaurant_list_viewed')` on mount; `RestaurantBrowser` already tracks `restaurant_selected`.
  5. Tests: add Vitest coverage for filters, skeleton, empty/error; Playwright smoke (mobile) verifying filter interactions.
- **Acceptance**: Check against `customer-frontend-architecture/03-content-specification.md` & `08-edge-cases.md` rows 4–5.

### US-002 — Booking Wizard Steps 1–4 (S2, 13 pts)

- **Goal**: `/reserve/r/[slug]` multi-step wizard (Plan → Details → Review → Confirmation trigger) with optimistic state and analytics events.
- **Reuse**:
  - Reserve wizard modules (`reserve/features/reservations/wizard/*`), DI context, analytics tests.
  - Supabase availability API (validate route handlers under `app/api/reservations` or create).
- **Tasks**:
  1. Audit existing wizard UI/logic; ensure routes in Next app embed SPA (`components/reserve/...`?). Wire Next page to mount Vite SPA or SSR components.
  2. Implement Plan step enhancements per spec: availability calendar (use `@shared/ui/calendar`), party selector, accessible time grid.
  3. Details step validation: rely on `useDetailsStepForm` (already handles React Hook Form + Zod). Ensure placeholders, autocomplete attributes, focus on submission error.
  4. Review step: confirm summary card, loading state, instrumentation `track('confirm_open')`.
  5. Confirmation step (client only) triggers API mutation (`useCreateReservation`) with optimistic UI + error rollback.
  6. Tests: expand existing Vitest suites for new behaviours (analytics, validation). Add Playwright scenario for completing booking <2 mins (mobile + desktop).
  7. Accessibility: ensure focus management on step transitions, aria-live for errors.
- **Acceptance**: `11-acceptance-test-plan.md` Scenario 1; analytics spec events `select_date`, `select_time`, `details_submit`, `booking_created`.

### US-003 — Booking Confirmation Page (S3, 5 pts)

- **Goal**: `/reserve/[reservationId]` displays confirmation/reservation detail with share/download, schema.org metadata.
- **Reuse**:
  - `app/reserve/[reservationId]/ReservationDetailClient.tsx` already robust; ensure SSR wrapper fetch + JSON-LD injection.
  - `lib/reservations/share.ts` for ICS + share text.
- **Tasks**:
  1. Audit server component (route). Implement loader hitting `/api/bookings/:id` (or Supabase). Provide hydration-friendly props.
  2. Ensure JSON-LD script injection (maybe via `<script type="application/ld+json">`).
  3. Validate analytics `emit('reservation_detail_viewed')`, `track('network_offline')` as per spec.
  4. Add tests (Vitest + Playwright) verifying share CTA feedback, offline message.
- **Acceptance**: Content spec (confirmation copy), SEO plan (schema.org).

### US-004 — Dashboard Bookings Table (S4, 8 pts)

- **Goal**: `/dashboard` protected route listing upcoming/past/cancelled bookings with cancel + optimistic rollback.
- **Reuse**:
  - Table components under `components/dashboard` (inspect `StatusChip`, `CancelBookingDialog`, etc.).
  - Query hooks `useBookings`, `useCancelBooking` if exist; otherwise implement using Supabase API.
- **Tasks**:
  1. Implement Next route group `(authed)` with guard (middleware uses Supabase session).
  2. Create dashboard page: server fetch initial bookings (prefetch query cache). Provide mobile-first (stack cards) + desktop table.
  3. Cancel flow: integrate `CancelBookingDialog`, call mutation with optimistic update and `track('booking_cancelled')`.
  4. Tests: Vitest for state transitions, Playwright for cancel scenario (ensuring confirm prompt).
- **Acceptance**: `08-edge-cases.md` rows 9–10; acceptance scenario 2.

### US-005 — Profile Management (S5, 5 pts)

- **Goal**: `/profile/manage` form with React Hook Form + Zod, avatar upload error handling, inline validation.
- **Reuse**:
  - `components/profile` (check existing). Use `@shared/ui/form`/`input`.
  - Supabase storage wrapper (search `lib/profile`, `lib/storage`).
- **Tasks**:
  1. Build server route retrieving profile data (Supabase). Prefill form via `useProfileQuery`.
  2. Implement update mutation with idempotency + `track('profile_updated')`.
  3. Handle avatar upload errors gracefully (toast + `aria-live`).
  4. Tests: Vitest for validation schema; Playwright scenario for update with keyboard navigation.
- **Acceptance**: Acceptance plan profile scenario; edge case row 11.

### US-006 — Wizard QA & Offline Hardening (S6, 5 pts)

- **Goal**: Harden wizard for offline/latency, ensure aria-live, skeleton parity, test coverage.
- **Reuse**:
  - `useOnlineStatus` hook, offline analytics patterns from reservation detail page.
  - `MSW` mocks (check `reserve/tests/mocks` for API stubs).
- **Tasks**:
  1. Introduce offline banner for wizard (similar to reservation detail).
  2. Add loading skeletons that mirror final layout.
  3. Implement optimistic states + rollback for create/cancel flows with React Query mutation lifecycle.
  4. Expand analytics for failure states (`booking_cancel_error`).
  5. Tests: Vitest for offline hooks, Playwright offline simulation (set network offline).

### US-007 — Auth Flow & Guards (S7, 5 pts)

- **Goal**: Supabase auth integration (session hooks, middleware, sign-in page).
- **Reuse**:
  - `middleware.ts` stub; `components/signin` or `app/signin` route.
  - Supabase SSR helpers (add server client).
- **Tasks**:
  1. Implement Supabase server client factory (if missing) to read session in middleware.
  2. Guard protected routes (`/dashboard`, `/profile`, wizard post-confirmation) redirect to `/signin`.
  3. Build `/signin` form per content spec, using `@/components/ui/form` and `Button`.
  4. Support magic link + password login; ensure `AppProviders` handles session refresh.
  5. Tests: Integration (Playwright) covering sign-in/out, guard redirect; Vitest for middleware utilities.

### US-008 — Blog Skeleton (S8, 3 pts — Stretch)

- Build `/blog` index + article template using MDX (`@mdx-js/loader`). Use cards + breadcrumbs per IA.
- Add static metadata + structured data. Minimal tests (snapshot + routing).

### US-009 — Analytics Wiring (S9, 3 pts — Stretch)

- Extend `AnalyticsEvent` union + ensure DNT compliance.
- Add consent gate `NEXT_PUBLIC_ANALYTICS_CONSENT`; fallback no-op when disabled.
- Add tests verifying events suppressed when consent missing.

### US-010 — Sprint Demo & Docs (Ops)

- Ensure Storybook entries for core components (Button, Input, Card, Form) align with new tokens.
- Update `README.md` with setup/run instructions (Supabase, pnpm scripts).
- Prepare demo script + retrospective notes (capture in tracker).

## Testing & Validation Strategy

- **Per story**: write failing Vitest spec first (TDD). For UI flows, use Testing Library (`render`, `userEvent`).
- **Playwright**: mobile-first viewport (390×844). Key journeys:
  - Home filter & CTA (US-001)
  - Complete booking flow (US-002/006)
  - Reservation confirmation share (US-003)
  - Dashboard cancel (US-004)
  - Profile update (US-005)
  - Auth guard + sign-in (US-007)
- **Accessibility**: run axe in Playwright; manual tab order check; ensure focus-visible styling matches tokens.
- **Performance**: schedule Lighthouse run D4 (Home/Wizard/Dashboard). Address scores <85.

## Delivery Timeline Alignment

- D1: Env verification, tracker setup, kick off US-001.
- D2: Finish US-001 tests/UI; start wizard steps 1–2.
- D3: Wizard steps 3–4 + Playwright scenario; analytics instrumentation.
- D4: Confirmation page + start Dashboard scaffolding.
- D5: Finish Dashboard; mid-sprint review + retro notes; QA handoff.
- D6: QA fixes + Profile form.
- D7: Wizard hardening, offline/analytics.
- D8: Auth guard + sign-in; ensure CI + coverage hitting targets.
- D9: Stretch goals (Blog, Analytics gating) if buffer remains.
- D10: Demo rehearsal, retrospective doc, finalize README/Storybook/CI proof.

## Dependencies & Follow-Ups

- Confirm Supabase project credentials & seeding strategy.
- Align with backend on `/api/restaurants`, `/api/bookings` readiness; mock via MSW if delayed.
- Coordinate with design for Storybook sign-off; QA scheduled from Day 5 onward.
- Create feature branch `feature/sprint-1-foundation` and ensure PR templates reference US IDs.
