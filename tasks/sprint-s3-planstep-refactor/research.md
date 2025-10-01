# Research — Sprint S3 PlanStep Refactor

## 1. Current Component Structure & Pain Points

- `PlanStep.tsx` still weighs in at **420 LOC** (`wc -l`), handling form state, UI rendering, slot computation, analytics, tooltip copy, and store wiring in one file. Key sections:
  - Form initialisation via `useForm` with zod resolver (lines ~64-100).
  - `useTimeSlots` hook providing slot descriptors (`PlanStep.tsx:60-63`).
  - Multiple callbacks (`handleSelectTime`, `handlePartyChange`, etc.) and effect to reset form on state changes.
  - Time slot grid markup nested directly within PlanStep (`PlanStep.tsx:294-339`).
  - Occasion toggle group (`PlanStep.tsx:343-374`) and notes textarea.
  - Step actions effect at bottom to expose `Continue` button (`PlanStep.tsx:181-195`).
- Analytics currently called inline with `track('select_time', {...})` (line 148). Requirement mandates routing analytics via props (no direct import), so PlanStep should accept an `onTrack` callback.
- Tooltip copy already sourced from shared config (S2) (`PlanStep.tsx:42`), but grid child components should consume via props to avoid cross-imports.

## 2. Dependencies & Consumers

- `PlanStep` consumed by `ReservationWizardContent` (`reserve/features/reservations/wizard/ui/ReservationWizard.tsx:42-63`) and `components/reserve/booking-flow/index.tsx:294`. Both currently pass `{ state, actions, onActionsChange }`; they will need to pass the analytics callback once PlanStep signature changes.
- `useTimeSlots` already returns slot descriptors and service availability; new `TimeSlotGrid` component can rely on that structure to remain pure.
- Store actions used inside PlanStep: `actions.updateDetails`, `actions.goToStep`. Need to ensure child components receive typed update functions without depending on full actions object (to maintain separation).

## 3. Target Component Breakdown (per requirements)

- **PlanStep.tsx (root, <80 LOC)**: Should orchestrate data wiring, compose child components, manage step actions effect (possibly delegate). Needs to expose `onTrack` prop and pass it to children.
- **PlanStepForm**: Responsible for `useForm`, validation, resetting on state change, and sending updates back to wizard store. Should likely wrap `Form` provider and render child slots via render props or composition.
- **TimeSlotGrid**: Presentational; receives slots array, current value, hover handlers, analytics callback, etc. Must avoid stateful hooks beyond minimal (per requirement max 3 hooks). Should not compute availability; rely on descriptor data.
- **OccasionPicker**: Handle booking type toggle, badges showing happy hour / drinks / kitchen closed states.

## 4. Testing & Storybook Considerations

- No existing Storybook setup detected (`find` for `*.stories.tsx` returns empty). Need to confirm expected framework—likely Storybook with Vite/React. Setting up baseline config may be necessary before adding stories for new components.
- Interaction tests requirement suggests using `@storybook/testing-library` or Storybook play functions. Need to plan introduction carefully (potentially add minimal Storybook dependencies/scripts).
- Existing Vitest suites do not cover PlanStep UI; consider adding targeted tests but sprint AC emphasises Storybook interactions.

## 5. Analytics & DI Strategy

- PlanStep currently imports `track` directly. Proposed approach: extend `PlanStepProps` with `onTrack?: (event: string, payload?: Record<string, unknown>) => void`. Parent contexts will pass `track` (or a wrapper) to satisfy requirement without altering existing analytics module usage.
- Downstream children (e.g., TimeSlotGrid) will receive a typed `onSelectSlot` that triggers analytics via the passed callback, keeping UI decoupled.

## 6. Additional Observations / Risks

- Step action effect currently defined inside PlanStep. After refactor, ensure the effect remains in whichever component owns form submission (likely PlanStepForm) but still updates parent `onActionsChange` when validity/submitting state change.
- `PlanStep` uses `useMemo` to compute `minSelectableDate` (today). Decide whether to leave in root or move into form component.
- Need to guarantee new components respect max 3 hooks to meet requirement (PlanStepForm will likely use `useForm`, `useEffect`, `useMemo` maybe; need to plan carefully).
- Accessibility: ensure extracted components maintain ARIA attributes, focus management (e.g., tooltip behaviour). Tooltip component currently uses `hoveredSlot` state; likely owned by new `TimeSlotGrid`.
- Storybook & interaction tests will introduce new dependencies (risk: build time). Document in plan and ensure scripts/CI unaffected.

## 7. Next Steps

- Draft architectural plan detailing prop contracts between PlanStep root and new child components, analytics routing, and Storybook setup steps.
- Outline refactor sequence to maintain functionality (create new components alongside old logic, then migrate and delete legacy code).
- Identify testing approach (Storybook, potential vitest updates) and environment configuration needs.
