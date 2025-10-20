# Implementation Plan: Reservation Wizard Maximum Update Depth Error

## Objective

We will enable users to complete the booking wizard without triggering a maximum update depth error.

## Success Criteria

- [ ] Booking wizard renders and navigates through Plan → Details steps without hitting `Maximum update depth exceeded`.
- [ ] Sticky footer actions remain responsive (disabled/enabled states toggle correctly) after the fix.
- [ ] Automated tests or manual QA cover the Plan step action wiring and stay green.

## Architecture & Components

- `reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`: stabilise the `Continue` action by memoising the submit handler and action array; ensure `onActionsChange` sees a stable reference unless form state genuinely changes.
- `reserve/features/reservations/wizard/hooks/useDetailsStepForm.ts`: mirror the memoised action pattern so equality checks can safely consider handler identity.
- `reserve/features/reservations/wizard/hooks/useReservationWizard.ts`: optionally augment `handleActionsChange` equality guard (include icon/aria + handler identity when stable) to avoid redundant updates from other steps.
  State: `stickyActions` array stored in hook; updates propagate to `WizardFooter` for URL-independent wizard flow.

## Data Flow & API Contracts

- No API surface changes; data still flows through existing React Hook Form state and wizard reducer actions.
- Ensure any action handler updates continue to dispatch `actions.goToStep` etc without modification.

## UI/UX States

- Loading: continue to show skeletons when `state.loading` toggles; action should remain disabled while submitting.
- Empty/Error: retain plan alert + validation messaging; fix must not suppress existing toasts/alerts.
- Success: pressing Continue still advances to Details step with analytics events intact.

## Edge Cases

- Form invalid on first render (`isValid === false`) → action disabled but no infinite loop.
- No available slots / closed schedule (action remains disabled but footer still stable).
- Offline mode where footer disables all actions via `disableAllActions`.

## Testing Strategy

- Unit: add regression test around `usePlanStepForm` or `handleActionsChange` to confirm stable action signatures and lack of redundant updates.
- Integration: reuse / extend existing Plan step tests to assert `onActionsChange` receives memoised actions.
- E2E: rely on existing wizard E2E coverage; manual smoke via DevTools MCP.
- Accessibility: manual spot-check during QA to ensure focus/keyboard behaviour unchanged.

## Rollout

- Feature flag: not required.
- Exposure: full rollout once merged.
- Monitoring: watch console logs and error reporting (Sentry) for recurrence of `Maximum update depth exceeded`.
