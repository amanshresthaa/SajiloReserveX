# Sprint Plan: Customer Frontend Architecture – Sprint 1

**Sprint Length**: 2 weeks  
**Team**: 1 FE (you), 1 UX writer (shared), QA shared (0.5 FTE)  
**Sprint Goal**: Ship the foundational customer-facing experience that lets diners discover restaurants, complete a booking, and manage upcoming reservations while meeting WCAG 2.2 AA and performance budgets.

---

## Sprint Backlog

| Priority | Story                                | Description                                                                                                                                                                                    | Acceptance Source                                                     | Estimate | Owner | Dependencies                          |
| -------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------- | ----- | ------------------------------------- |
| P0       | S1 – Booking Discovery Flow          | Implement Home (`/`) listing with React Query, filters, and empty/error/skeleton states. Mobile-first layout using Shadcn cards. Track `restaurant_list_viewed`, `restaurant_selected`.        | Edge cases table (rows 4-5), Analytics spec, Content spec             | 8 pts    | FE    | API `/api/restaurants`, design tokens |
| P0       | S2 – Booking Flow Steps 1-4          | Build `/reserve/r/[slug]` multi-step wizard: availability, details, review, confirmation. Include optimistic UI, validation, TDD from acceptance plan “Complete booking in under two minutes”. | Acceptance test plan (Scenario 1), State mgmt guide, Performance plan | 13 pts   | FE    | Story S1, Supabase session hook       |
| P0       | S3 – Booking Confirmation Page       | Implement `/reserve/[reservationId]` confirmation w/ schema.org `Reservation`, share CTA, add to calendar link, offline messaging.                                                             | Content spec (confirmation), SEO plan                                 | 5 pts    | FE    | S2                                    |
| P0       | S4 – Dashboard (Bookings Table)      | Protected `/dashboard` with booking table, tabs (upcoming/past/cancelled), cancel mutation w/ optimistic rollback, `booking_cancelled` analytics.                                              | Acceptance Scenario 2, Edge cases (rows 9-10)                         | 8 pts    | FE    | Auth middleware, query hooks          |
| P1       | S5 – Profile Management              | `/profile/manage` form with RHF + Zod, avatar upload error handling, inline validation.                                                                                                        | Acceptance plan (profile row in matrix), Edge cases (row 11)          | 5 pts    | FE    | Storage bucket, toast context         |
| P1       | S6 – Reservation Wizard QA & Offline | Tighten wizard validation, offline resilience, optimistic submit/cancel flows, aria-live feedback, mobile-first spacing.                                                                       | Edge cases table (rows 3-8), Accessibility plan, Analytics spec       | 5 pts    | FE    | Wizard API mocks                      |
| P1       | S7 – Authentication Flow & Guards    | Implement Supabase session hook, Next.js middleware, `/signin` UI per content spec, forgot-password placeholder. Ensure redirects and `requireAuth`.                                           | State mgmt auth section, Routing spec, Acceptance Scenario 4          | 5 pts    | FE    | Supabase env, Shadcn forms            |
| P2       | S8 – Blog Skeleton                   | `/blog` index + article layout (static placeholder content), structured data, navigation breadcrumbs.                                                                                          | IA nodes, SEO plan                                                    | 3 pts    | FE    | Markdown pipeline                     |
| P2       | S9 – Analytics Wiring                | Extend `AnalyticsEvent` union, instrument backlog events, add consent gate `NEXT_PUBLIC_ANALYTICS_CONSENT`.                                                                                    | Analytics spec                                                        | 3 pts    | FE    | Stories S1-S7                         |

_Estimation scale_: Fibonacci (1,2,3,5,8,13). Velocity target ~26 pts → S1-S7 fit sprint goal; S8-S9 are stretch.

---

## Implementation Checklist (TDD + Mobile First)

1. **Scaffold routes & providers**
   - Set up `(marketing)`, `(booking)`, `(protected)` route groups.
   - Ensure `AppProviders` wires React Query, Toast, Supabase session.
2. **TDD loop per story**
   - Write failing unit/component tests (Vitest + Testing Library) before coding.
   - Add Playwright specs for booking flow (mobile viewport first, then desktop).
   - Run `pnpm test -- --runInBand` and `pnpm test:e2e --project=mobile` in CI.
3. **Mobile-first styling**
   - Build base layout at 375px (iPhone 13) then enhance ≥768px.
   - Verify touch targets ≥44px, inputs font-size ≥16px.
4. **Accessibility hooks**
   - Use semantic tags, `aria-live` for toasts, focus management on dialogs.
   - axe-core checks baked into Playwright runs.
5. **Performance budget checks**
   - Lighthouse CI smoke after S2 & S4 (Fast 4G, Moto G4 profile).
   - Confirm skeletons mirror final layout; avoid layout thrash.

---

## Sprint Timeline

| Day       | Focus                                              | Deliverable                     |
| --------- | -------------------------------------------------- | ------------------------------- |
| Mon (D1)  | Kickoff, env verification, Story S1 setup          | Home skeleton + tests           |
| Tue (D2)  | S1 completion, start S2 (Step 1 & 2)               | Passing component tests         |
| Wed (D3)  | S2 steps 3-4, analytics hooks                      | Booking flow E2E (mobile)       |
| Thu (D4)  | Confirmation page (S3), start S4 table scaffolding | Dashboard table unit tests      |
| Fri (D5)  | Finish S4 (cancel mutation, analytics)             | PR ready, QA handoff            |
| Mon (D6)  | Address QA feedback, start S5 profile              | Updated tests                   |
| Tue (D7)  | Finish S5, start S6 wizard QA                      | Offline + validation polish     |
| Wed (D8)  | Middleware/auth (S7)                               | Sign-in flow E2E                |
| Thu (D9)  | Buffer, stretch goals S8/S9                        | Blog skeleton, analytics wiring |
| Fri (D10) | Sprint review, retro, release prep                 | Release notes, demo             |

---

## QA & Definition of Done

- All acceptance scenarios in `11-acceptance-test-plan.md` automated (Playwright) or manually scripted if tooling blocked.
- Unit/component coverage ≥80% for new modules (`pnpm coverage`).
- Lighthouse performance score ≥90 mobile on Home, Booking, Dashboard.
- axe-core zero critical violations; manual screen-reader pass for booking flow.
- Analytics events verified in Plausible debug console (staging) without PII leaks.
- Documentation updated (`README`, storybook notes) with usage and a11y constraints.

---

## Risks & Mitigations

| Risk                                             | Impact                  | Mitigation                                                                                         |
| ------------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------- |
| Supabase rate limits during local testing        | Blocks booking flow dev | Use staging project, throttle queries, add mock adapters for tests.                                |
| Offline/optimistic flows complexity              | Impacts S6 deliverable  | Pair with product on requirements; reuse `ReservationDetailClient` patterns and add MSW scenarios. |
| Timebox overrun on S2 multi-step flow            | Jeopardizes sprint goal | Pair on state machine design early; slice deliverable per step with daily demos.                   |
| Accessibility regressions from rapid CSS changes | Fail WCAG targets       | Run axe in watch mode, schedule mid-sprint a11y audit.                                             |

---

## Communication & Ceremonies

- **Daily standup**: Async in Slack #frontend by 10:00; blockers flagged immediately.
- **Mid-sprint demo**: End of D5 to stakeholders (booking flow walkthrough).
- **Code review SLA**: <24h response; pair on complex PRs (S2, S4).
- **Retro themes**: TDD adherence, mobile-first ergonomics, analytics confidence.
