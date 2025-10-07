# Plan — Booking Wizard Steps 1–4

## Goal

Verify and, if needed, finish US-002 by confirming the React-based wizard is wired correctly, each step’s UX/analytics/optimistic flows match spec, and regression coverage (unit + e2e) is in place. Mark TODO items as complete only after evidence is gathered.

## Approach & Tasks

1. **SPA Wiring Audit**
   - Inspect Next → React Router bridge (`app/reserve/page.tsx`, `reserve/app/routes.tsx`, `reserve/pages/WizardPage.tsx`) and environment flags (`NEXT_PUBLIC_RESERVE_V2`, `reserve/shared/config/env.ts`).
   - Cross-check hydration paths (initial props, suspense fallback) and confirm wizard mounts client-side without SSR gaps.
   - Validate by tracing navigation in code and searching for legacy wizard usage to ensure flag gating behaves.
2. **Plan Step UX Pass**
   - Review `PlanStep` + `PlanStepForm` UI/handlers for calendar, party selector, and time suggestions.
   - Double-check state sync (`usePlanStepForm`, reducer) and analytics events in tests.
   - Challenge assumptions by comparing to stories/tests; ensure time suggestions (datalist) fulfil “time grid” spec or note gap.
3. **Details Step Validation & Accessibility**
   - Examine `DetailsStep` + `useDetailsStepForm` for placeholders, focus management, inline errors, `rememberDetails` storage.
   - Verify form schema for trimming/validation, confirm analytics event.
   - Ensure accordion auto-expands on validation failure; confirm test coverage or plan to add.
4. **Review Step Summary + Analytics**
   - Validate summary string building (`useReviewStep`, selectors) and analytics event `confirm_open`.
   - Confirm sticky actions (edit/confirm) update based on `state.submitting`.
   - Disprove by checking for missing error display or inconsistent summary formatting between locales.
5. **Confirmation Step Optimistic Flow**
   - Trace `useReservationWizard.handleConfirm` through mutation and reducer to confirm optimistic behaviour + analytics.
   - Inspect `useConfirmationStep` feedback flows, share actions, DI error handling.
   - Look for race conditions (idempotency key reuse, share error handling) and propose mitigation if found.
6. **Test Coverage & Automation**
   - Run Vitest suites touching wizard (analytics/tests in `reserve/tests/features/wizard`, component tests).
   - Evaluate Playwright specs (`tests/e2e/reservations/booking-flow.spec.ts`, `tests/e2e/wizard/plan-step.spec.ts`) against TODO requirement (mobile + desktop). Extend or add scenarios if coverage insufficient (e.g., mobile viewport).
   - Use TDD mindset: add tests before fixing any discovered gaps (e.g., missing optimistic case).
7. **Documentation & TODO Sync**
   - Summarise findings, explicitly list confirmations vs gaps.
   - Update `tasks/sprint-1-foundation-execution/todo.md` checkboxes only when evidence gathered.
   - Capture open risks/questions for user review.

## Validation Strategy

- Use static analysis (code review), unit tests (Vitest), and e2e tests (Playwright) as cross-verification tools.
- For contentious behaviours (time grid vs datalist, optimistic UI edge cases), design small reproduction or add targeted test assertions.
- Re-run impacted tests after any code change; keep logs of commands and outcomes.

## Open Questions to Resolve During Execution

- Does product require a visual time “grid” beyond datalist suggestions? If yes, scope addition.
- Should we add explicit mobile Playwright scenario (current tests likely desktop)? Determine viewport requirements.
- Are additional analytics events expected beyond those already implemented?
