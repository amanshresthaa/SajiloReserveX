# Implementation Plan: Fix ESLint warnings in plan step form hook

## Objective

We will satisfy eslint's `react-hooks/exhaustive-deps` rule by ensuring cleanup effects capture stable ref values so the wizard plan step hook keeps abort semantics without warnings.

## Success Criteria

- [ ] eslint --fix --max-warnings=0 completes successfully locally.
- [ ] No behavioral changes to prefetch/abort flow (existing unit/integration behavior untouched).

## Architecture & Components

- `reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`: adjust the unmount-only `useEffect` to copy the ref contents into local variables before returning the cleanup callback. No other modules touched.

## Data Flow & API Contracts

- No network contracts change. Aborting in-flight fetches still calls `AbortController.abort()` on each cached controller and clears tracking maps.

## UI/UX States

- No UI deltas; the hook still populates `loadingDates`, `unavailableDates`, etc.

## Edge Cases

- Ensure cleanup still runs once on unmount and clears outstanding controllers even if no fetches were initiated.
- Keep mutation order intact (abort -> clear -> pending clear).

## Testing Strategy

- Lint: `eslint --fix --max-warnings=0` (pre-commit hook).
- Spot-check via existing automated tests if needed (not expected for this change).

## Rollout

- No flag. Merge via existing process once lint passes.
