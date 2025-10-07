# Sprint Plan: Customer Frontend Architecture – Sprint 2

**Sprint Length**: 2 weeks  
**Team**: 1 FE (you), 1 UX writer (shared), QA shared (0.5 FTE)  
**Sprint Goal**: Complete authenticated customer surfaces (dashboard, profile, confirmation) and harden conversion-critical marketing flows, with resilient analytics coverage and auth guardrails.

---

## Sprint Backlog

| Priority | Story                                | Description                                                                                                                                                                              | Acceptance Source                                            | Estimate | Owner | Dependencies                        |
| -------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------- | ----- | ----------------------------------- |
| P0       | S3 – Booking Confirmation Polish     | Finalise `/reserve/[reservationId]` page: schema.org `Reservation`, add-to-calendar/share actions, offline messaging, confirmation analytics (`booking_created`).                        | Content spec, SEO plan, Edge cases table                     | 5 pts    | FE    | Story S2 foundation                 |
| P0       | S4 – Dashboard (Bookings Table)      | Authenticated `/dashboard` with tabs (upcoming/past/cancelled), cancel/edit actions, optimistic updates, empty/error skeletons, analytics (`booking_cancelled`, `booking_cancel_error`). | Acceptance plan Scenario 2, Edge cases rows 9-10             | 8 pts    | FE    | React Query hooks, Supabase session |
| P0       | S5 – Profile Management              | `/profile/manage` with RHF + Zod validation, avatar upload (graceful failures), remember-details toggle, inline errors, `profile_updated` analytics.                                     | Acceptance plan (profile), Edge cases row 11                 | 5 pts    | FE    | Storage bucket, toast context       |
| P1       | S6 – Reservation Wizard QA & Offline | Harden wizard validation, offline copy, optimistic submission, aria-live feedback, and failure recovery flows.                                                                           | Edge cases rows 3-8, Accessibility plan, Analytics spec      | 5 pts    | FE    | Wizard API mocks                    |
| P1       | S7 – Authentication Flow & Guards    | Supabase session hook hardening, Next.js middleware, `/signin` UI per spec, forgot-password placeholder, route guards for protected areas, analytics (`route_not_found`, `app_error`).   | State mgmt auth section, Routing spec, Acceptance Scenario 4 | 5 pts    | FE    | Supabase auth config                |
| P2       | S9 – Analytics Wiring Completion     | Expand `AnalyticsEvent` unions (shared + frontend), ensure event helpers used across components, add consent gate (`NEXT_PUBLIC_ANALYTICS_CONSENT`).                                     | Analytics spec                                               | 3 pts    | FE    | Stories S3-S7                       |
| Stretch  | S8 – Blog Skeleton                   | Marketing `/blog` index + article layout with structured data, breadcrumbs, placeholders.                                                                                                | IA nodes, SEO plan                                           | 3 pts    | FE    | Markdown pipeline                   |

_Velocity target_: 26 pts → S3–S7 align with goal; S9 and S8 are stretch buffers.

---

## Key Deliverables & Checks

1. **Auth & Routing**
   - Middleware redirects unauthenticated users from `/dashboard`, `/profile`.
   - `/signin` supports OAuth + email/password, validation, analytics.
   - Supabase session hook resilient to refresh and offline.

2. **Dashboard Experience**
   - Tabs for upcoming/past/cancelled with React Query caching.
   - Optimistic cancel/edit with rollback and inline toasts.
   - Empty/offline/error states per `08-edge-cases.md`.

3. **Profile Management**
   - RHF + Zod schema ensures WCAG-compliant inputs.
   - Avatar uploader handles size/type limits and error copy.
   - Remember-me toggles local storage; integrates with booking flow.

4. **Reservation Wizard Resilience**
   - Validation messaging matches Zod schema and inline `FormMessage`.
   - Offline/timeout handling surfaces actionable alerts with retry.
   - Analytics events for submit, validation errors, and success.

5. **Confirmation Page**
   - Calendar/Wallet actions, shareable summary, schema.org JSON-LD.
   - Offline banner and telemetry for failures.

6. **Analytics & QA**
   - Events enumerated in spec implemented across flows (dashboard, profile, wizard).
   - Axe-core and Playwright coverage expanded (dashboard/profile smoke).
   - Lighthouse check (mobile) for `/dashboard`, `/profile/manage`, `/reserve`.

---

## Timeline (Suggested)

| Day       | Focus                             | Deliverable                               |
| --------- | --------------------------------- | ----------------------------------------- |
| Mon (D1)  | Confirmation polish (S3)          | Schema, calendar/share, analytics tests   |
| Tue (D2)  | Dashboard scaffolding             | Tabs, data fetching, empty/error states   |
| Wed (D3)  | Dashboard mutations & analytics   | Cancel/edit optimistic flows + tests      |
| Thu (D4)  | Profile form (fields, validation) | RHF + Zod + remembered contacts           |
| Fri (D5)  | Avatar upload + toasts            | Manual QA + Playwright dashboard/profile  |
| Mon (D6)  | Wizard resilience pass            | Offline copy, optimistic flows, analytics |
| Tue (D7)  | Auth guards + middleware          | Playwright sign-in/out flow               |
| Wed (D8)  | Analytics wiring (S9)             | Ensure events + consent gate              |
| Thu (D9)  | Stretch: Blog skeleton            | Optional marketing deliverable            |
| Fri (D10) | QA sweep, Lighthouse, retro       | Release notes/demo prep                   |

---

## QA & Definition of Done

- Acceptance scenarios for booking management, profile update, auth recovery automated (Playwright) or documented.
- Vitest coverage updated for dashboard/profile hooks and analytics.
- Playwright smoke suite includes booking flow (new spec), dashboard, profile, wizard completion.
- Accessibility: axe-core zero critical violations; keyboard tab order validated; focus management for modals/dialogs.
- Performance: Lighthouse ≥90 mobile for `/dashboard`, `/profile/manage`, `/reserve`.
- Analytics events verified in staging (Plausible debug) with sanitized payloads.

---

## Risks & Mitigations

| Risk                                           | Impact                              | Mitigation                                                                          |
| ---------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| Supabase auth edge cases (token expiry)        | Users stuck on protected routes     | Add middleware fallback + explicit session refresh handling.                        |
| Offline-first edge cases in wizard             | Booking flow confidence drops       | Document MSW scenarios, reuse `ReservationDetailClient` offline telemetry patterns. |
| Avatar upload storage quotas                   | QA fails due to bucket restrictions | Provide test bucket credentials; add size/type validation client-side.              |
| Analytics drift between web + reserve packages | Data inconsistency                  | Centralise events in shared module (`lib/analytics`) and gate via consent flag.     |

---

## Coordination

- **Standup**: Async Slack #frontend by 10:00, blockers escalated.
- **Design sync**: Mid-sprint review of dashboard/profile states with UX writer.
- **QA touchpoint**: Daily check-in once S4 lands to align test data + scripts.
- **Retro focus**: Auth ergonomics, analytics observability, mobile QA load.
