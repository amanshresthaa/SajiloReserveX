# Verification — Booking Wizard Steps 1–4

## Evidence Collected

- **SPA Wiring**: `/reserve/r/[slug]` still mounts the React app through `components/reserve/booking-flow/index.tsx:1-63`, wrapping `BookingWizard` with Query Client and Next navigation/analytics adapters.
- **Plan Step**: Introduced grouped time-slot grid in `TimeSlotGrid.tsx` and surfaced it inside the “Time, occasion & notes” accordion in `PlanStepForm.tsx:66-158`, keeping the picker open by default while preserving analytics and handlers.
- **Time Input Guardrails**: Manual entry now snaps to the nearest half-hour on commit while allowing in-progress typing, enforced via `usePlanStepForm.ts` normalization and the `step="1800"` time input in `Calendar24Field.tsx`.
- **Details Step**: Existing implementation continues to meet UX requirements (placeholders, inline messaging, focus-first-error) via `DetailsStep.tsx` and `useDetailsStepForm.ts`; no code changes required.
- **Review Step**: `useReviewStep.ts` still emits summary + analytics, sticky actions reflect submission state—no updates needed.
- **Confirmation**: Optimistic submission path unchanged (`useReservationWizard.ts`, `useConfirmationStep.ts`); verified structure remains compatible with new Plan step.

## Test Runs

- `pnpm test reserve/features/reservations/wizard/ui/steps/plan-step/components/__tests__/TimeSlotGrid.test.tsx reserve/features/reservations/wizard/ui/steps/plan-step/__tests__/PlanStepForm.test.tsx reserve/tests/features/wizard` ✅ (covers new grid + existing analytics suites).
- Playwright specs updated (`tests/e2e/reservations/booking-flow.spec.ts`, `tests/e2e/wizard/plan-step.spec.ts`) to use `[data-slot-value]` selectors and add a mobile flow. Not executed locally (requires running app with seeded Supabase) — pending when environment is available.

## Risks / Gaps

- Need to run updated Playwright scenarios once backend fixtures are present; ensure DOM keeps `data-slot-value`.
- Mobile Playwright flow assumes at least one restaurant; guard via `test.skip` but still blocks automation if Supabase empty.
- Vitest aliases still require invoking via repo script (`pnpm test …`); direct `vitest run` without config continues to fail.
