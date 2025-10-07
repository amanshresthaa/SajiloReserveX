## Goal

- Resolve the lint failures uncovered by `pnpm run build` so the Booking Wizard tests and related analytics tests compile cleanly.

## Current Signals

- ESLint `import/order` violations in wizard tests: the fixtures from `@/tests/fixtures/wizard` are required to appear before feature imports. Files affected:
  - `reserve/features/reservations/wizard/ui/__tests__/BookingWizard.plan-review.test.tsx`
  - `reserve/features/reservations/wizard/ui/steps/plan-step/__tests__/PlanStepForm.test.tsx`
  - `reserve/features/reservations/wizard/ui/steps/plan-step/components/__tests__/Calendar24Field.test.tsx`
  - `reserve/tests/features/wizard/details-step.analytics.test.tsx`
  - `reserve/tests/features/wizard/plan-step-form.analytics.test.tsx`
  - `reserve/tests/features/wizard/review-step.analytics.test.tsx`
- `Calendar24Field.test.tsx` also trips the “blank line between import groups” rule; other tests keep a clear separation between value imports and type-only imports (see `reserve/tests/features/restaurant-browser.test.tsx`).
- `BookingWizard.plan-review.test.tsx` uses short-circuit expressions (`planForm && …`) that violate `@typescript-eslint/no-unused-expressions`; existing test helpers prefer explicit `if` blocks inside `act`.
- `reserve/tests/unit/my-bookings-api.test.ts` uses a `typeof import()` type annotation inside a Vitest mock, which is disallowed by `@typescript-eslint/consistent-type-imports`. Other files reach for module types via `import type * as ModuleName from '...'` and pass that to `vi.importActual`.

## References & Patterns

- Import order within tests follows: third-party → React/test libs → application aliases (sorted) → blank line → type-only imports (`import type …`) → relative imports last.
- Form submission helpers elsewhere rely on explicit guards. Example pattern in `reserve/features/reservations/wizard/ui/steps/DetailsStep.tsx` uses structured `if` blocks rather than boolean short-circuiting.
- `reserve/tests/features/restaurant-browser.test.tsx` showcases compliant ordering of value imports and type-only imports separated by a blank line.

## Open Questions

- None; fixes are mechanical once we align with lint rules.
