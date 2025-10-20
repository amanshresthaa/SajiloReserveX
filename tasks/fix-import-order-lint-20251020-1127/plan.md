# Implementation Plan: Fix Import Order Lint Error

## Objective

We will enable builds to succeed by aligning import statements with the linting rules so that the Next.js build completes without ESLint errors.

## Success Criteria

- [x] Next.js `next build` passes without import-order lint errors.
- [x] ESLint rules remain consistent with project conventions (no rule changes).

## Architecture & Components

- `reserve/features/reservations/wizard/services/useTimeSlots.ts`: adjust import order to satisfy lint rule.
  State: no state changes | Routing/URL state: n/a

## Data Flow & API Contracts

N/A — lint-only change.

## UI/UX States

N/A — no user-facing UI modifications.

## Edge Cases

- Ensure no unintended side effects from reordering imports (e.g., preserving type/value initialization order if applicable).

## Testing Strategy

- Unit: n/a
- Integration: n/a
- E2E: n/a
- Accessibility: n/a
- Verification via running `next build` to confirm lint passes.

## Rollout

- No feature flag needed.
- Merge via standard process once build succeeds.
- Monitor CI for regressions.
