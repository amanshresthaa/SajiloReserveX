# Implementation Checklist

## Setup

- [x] Confirm no nested AGENTS.md overrides inside `reserve/` and keep work under existing guidance.
- [x] Update `wizardSelectors` + helper data-test IDs to match new footer structure before touching e2e specs.

## Foundation Components

- [x] Implement `WizardContext` + `WizardContainer` (wrap `WizardLayout`, expose state/actions, manage padding/scroll restore).
- [x] Build `WizardStep` wrapper with heading/description semantics and focus handling.
- [x] Create `StepSummary` component with responsive truncation and chips.
- [x] Refactor `WizardProgress` to new API + styling (linear bar + pills ≥768px, aria-live updates).
- [x] Implement unified `WizardNavigation` sticky footer (mobile-first layout, ResizeObserver reporting, accepts `StepAction[]`).

## Booking Wizard Integration

- [x] Update `StepAction` type + helpers to support placements/aria text needed by new nav.
- [x] Modify step controllers (`PlanStep`, `DetailsStep`, `ReviewStep`, `ConfirmationStep`) if necessary to pass placement metadata or text labels.
- [x] Replace `WizardFooter` and `WizardStickyConfirmation` usage inside `BookingWizard` with the new `WizardNavigation` via `WizardContainer`.
- [x] Remove/deprecate old sticky components or convert them to wrappers pointing to the new implementation (to avoid breaking imports).

## UI/UX Polish

- [x] Ensure sticky footer buttons stay ≥44px, include text labels on all breakpoints, and keep primary action within bottom thumb zone.
- [ ] Add animation classes for step transitions + nav changes per spec.
- [ ] Update storybook stories for new components (mobile + tablet + desktop states, loading/disabled variations).

## Tests & QA

- [ ] Update/extend unit tests for progress/navigation/summary.
- [ ] Refresh component/e2e tests (`tests/component/wizard/*.spec.tsx`, `tests/e2e/reservations/booking-flow.spec.ts`, selectors helper).
- [ ] Run lint + typecheck + the relevant vitest/playwright suites locally.
- [ ] Execute manual Chrome DevTools QA (mobile emulation, accessibility checks) and record outcomes in `verification.md`.

## Notes

- Assumptions:
  - Step order remains Plan → Details → Review → Confirmation; spec-mandated copy handled via UI rather than reducer changes.
- Deviations:
  - TBD during implementation.

## Batched Questions (if any)

- None at this time.
