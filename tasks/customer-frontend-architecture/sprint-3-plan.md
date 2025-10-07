# Sprint Plan: Customer Frontend Architecture – Sprint 3

**Sprint Length**: 2 weeks  
**Team**: 1 FE (you), shared UX writer, QA 0.5 FTE  
**Sprint Goal**: Ship the remaining customer-facing surfaces (reservation wizard polish, authentication guardrails, analytics hardening) so diners can book and manage reservations confidently while the experience remains resilient and measurable.

---

## Sprint Backlog

| Priority | Story                                      | Description                                                                                                                                                                                       | Acceptance Source                                            | Estimate | Owner | Dependencies         |
| -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------- | ----- | -------------------- |
| P0       | S6 – Reservation Wizard Completion         | Finish booking wizard UX: responsive layout, offline guardrails, actionable validation copy, optimistic state for submit/cancel, analytics `details_submit_started` / `booking_validation_error`. | Content spec, Edge cases rows 3-8, Analytics spec            | 5 pts    | FE    | Wizard API mocks     |
| P0       | S7 – Authentication Flow & Guards          | Harden Supabase auth hook, Next.js middleware, protected route redirects, `/signin` UX updates, analytics (`route_not_found`, `app_error`).                                                       | State mgmt auth section, Routing spec, Acceptance Scenario 4 | 5 pts    | FE    | Supabase auth config |
| P0       | S9 – Analytics Wiring Completion           | Finalise frontend + shared event unions, consent gate, server forwarders, ensure booking/profile events triggered from all touchpoints.                                                           | Analytics spec                                               | 3 pts    | FE    | S6, S7               |
| P1       | S8 – Restaurant Discovery Polish (stretch) | Home/restaurant browser enhancements: skeletons, filter persistence, structured data tidy-up, hero copy refresh.                                                                                  | IA nodes, SEO plan                                           | 3 pts    | FE    | Content updates      |

_Velocity target_: 24 pts → S6, S7, S9 (11 pts) fit goal; S8 remains stretch.

---

## Key Deliverables & Checks

1. **Reservation Wizard**
   - Plan, Details, Review steps responsive and mobile-first; inline errors map to validation schema.
   - `details_submit_started`, `booking_validation_error`, `booking_created` analytics tracked with sanitized payloads; optimistic UI reconciles on response.

2. **Auth & Guards**
   - Supabase session hook handles refresh/offline; `/signin` covers OAuth + email/password with validation, inline errors, analytics.
   - Middleware reroutes unauthenticated requests; dashboard/profile/reserve protect as needed; `/signin` respects `redirectedFrom`.

3. **Analytics Completion**
   - Union covers booking/profile/auth events; consent gate applied; `/api/events` normalized.
   - Smoke tests verify key events via Plausible debug (booking cancel, profile update, wizard validation errors, auth errors).

4. **QA & Accessibility**
   - Axe-core zero critical issues on `/reserve`, `/signin`, `/dashboard`.
   - Lighthouse mobile ≥90 for `/reserve`.
   - Playwright smoke: booking happy path, auth redirect, dashboard booking cancel.

---

## Timeline (Suggested)

| Day       | Focus                         | Deliverable                               |
| --------- | ----------------------------- | ----------------------------------------- |
| Mon (D1)  | Wizard layout + data          | Responsive plan & review scaffolding      |
| Tue (D2)  | Wizard validation & analytics | Error copy, offline handling, event hooks |
| Wed (D3)  | Auth middleware/signin UX     | Guarded routes, form validation           |
| Thu (D4)  | Auth analytics + tests        | Playwright sign-in smoke                  |
| Fri (D5)  | Analytics hardening           | Event union, consent gate                 |
| Mon (D6)  | QA & fixes                    | Axe/Lighthouse checks                     |
| Tue (D7)  | Buffer / S8 stretch           | Discovery polish if time                  |
| Wed (D8)  | Regression testing            | Playwright / manual passes                |
| Thu (D9)  | Polish & docs                 | README updates, release notes             |
| Fri (D10) | Review & retro                | Demo + backlog grooming                   |

---

## Risks & Mitigations

| Risk                            | Impact                          | Mitigation                                                         |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| Wizard API instability          | Blocks confirmation step        | Use MSW mocks; fail gracefully with inline errors.                 |
| Auth edge cases in Supabase     | Users stuck on protected routes | Add robust session checks + fallback redirect to `/signin`.        |
| Analytics drift (web vs shared) | Inconsistent data               | Centralize event definitions; integration tests for `/api/events`. |
| Consent gate complexity         | Delays analytics                | Default to enabled; implement gate behind feature flag if needed.  |

---

## QA & Definition of Done

- Playwright: booking happy path, sign-in redirect, dashboard cancel.
- Vitest: coverage for auth hooks, wizard analytics handlers, analytics helpers (≥80% for new modules).
- Manual: Offline reconnection test, Plausible debug verification, Supabase session refresh (mobile).
- Documentation: `/docs` updates for reserve/auth flows, README snippet for analytics config.
