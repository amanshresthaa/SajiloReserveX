# Implementation Plan: Reservation Wizard Refactor

## Objective

We will harden the reservation wizard so that async work is cancellable, UI remains accessible/responsive under load, inputs are sanitized, and each step gracefully handles errors—eliminating race conditions, leaks, and prop-drilling complexity.

## Success Criteria

- [ ] Cancelling/unmounting Plan step aborts all inflight schedule fetches; duplicate date requests are deduped and `loadingDates` drives skeleton UI.
- [ ] Confirmation step never updates state post-unmount, share actions are abortable, and auto-redirect is user-controllable with persisted preference + announcements.
- [ ] Error boundaries wrap all steps and report via provided callbacks; context refactor removes direct state/action prop drilling.
- [ ] TimeSlotGrid virtualization/keyboard nav + Details form semantics pass axe checks; sanitization prevents invalid/disposable inputs.
- [ ] Lint, typecheck, and relevant unit tests pass locally.

## Architecture & Components

- `usePlanStepForm`: add refs/maps for abort controllers (`abortControllersRef`, `pendingFetchesRef`), `loadingDates` state, memoized `normalizedMinDate`, debounced `prefetchVisibleMonth`, and cleanup effects. Return `loadingDates` to consumers.
- `Calendar24Field`: accept/loading states per date + custom day renderer + skeleton fallback component (new `ui/components/LoadingSkeleton`).
- `TimeSlotGrid`: optional virtualization via `@tanstack/react-virtual`, extracted slot buttons, keyboard management, live announcements.
- `useConfirmationStep`: introduce `isMountedRef`, safe setters, abort controller for wallet sharing, memoized venue, defensive `buildReservationWindow`, and expose `feedback`, `loading` etc while avoiding updates after unmount.
- `ConfirmationStep`: integrate redirect controls + sessionStorage, accessible progressbar, cancel button, announcements.
- Error boundaries (`ErrorBoundary`, `StepErrorBoundary`) and new `WizardContext` provider to expose `state`, `actions`, and nav helpers; wrap steps to use context.
- Input sanitization utilities (new `utils/sanitization.ts`) referenced in Zod schemas; also add `utils/debounce.ts` for reuse.

## Data Flow & API Contracts

- Schedule prefetch uses existing `fetchReservationSchedule` (Rest) via React Query; no API change, but we now pass combined abort signals.
- Share flow uses `shareReservationDetails(sharePayload, { signal? })`; optional abort signal prevents ghost updates.
- Wizard context simply re-exposes `state`/`actions`; no API calls added.

## UI/UX States

- Loading: Calendar/time grid show skeletons/pulses for `loadingDates`; TimeSlotGrid virtualized list indicates counts; Confirmation auto-redirect displays progressbar + SR announcement.
- Empty: When no slots, virtualization gracefully renders empty copy; calendar/unavailable message clarifies next steps.
- Error: StepErrorBoundary surfaces destructive alert with retry/back; form fields show inline + sr-only errors; share/download show feedback banners.
- Success: Normal flows (Plan → Confirmation) unchanged but now more responsive.

## Edge Cases

- Rapidly switching restaurants/dates should abort outstanding fetches and clear caches to avoid stale data.
- Browsers without `sessionStorage` (SSR) default to auto-redirect but guard access via `typeof window` checks.
- Virtualization disabled for small slot counts to avoid overhead; ensure keyboard nav still functions.
- Sanitization must not mangle valid international names/emails beyond spec; log suspicious pattern detection results for debugging only when needed.

## Testing Strategy

- Unit: extend PlanStep + Confirmation step tests (if present) to cover `loadingDates`, virtualization toggling, redirect controls, sanitization transforms.
- Integration: run `npm run test` (vitest) focusing on PlanStepForm + details schema; add new tests if coverage lacking.
- E2E: rely on existing Playwright flows; sanity-check by running targeted spec if time.
- Accessibility: manual audit via Storybook/DevTools + `npm run test:component`/axe where feasible after UI updates.

## Rollout

- Feature flag: none requested; changes ship broadly but scoped to wizard.
- Exposure: monitor booking funnel metrics + error logs post-release; confirm no spike in share failures.
- Monitoring: leverage existing analytics events + errorReporter; add console warnings (dev only) for fallback paths.
- Kill-switch: revert via git if critical; additional guard by allowing auto-redirect preference to default on if storage fails.
