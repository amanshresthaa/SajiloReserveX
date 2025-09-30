# Research Notes

## Context

- Build failure arises in `components/reserve/booking-flow/index.tsx` where `<PlanStep>` is invoked with props `{ state, dispatch, onActionsChange }`. TypeScript reports that `dispatch` is not part of `PlanStepProps`.
- The booking flow steps re-export components from `reserve/features/reservations/wizard/ui/steps` to share UI/logic.

## Relevant Implementations

- `reserve/features/reservations/wizard/ui/steps/PlanStep.tsx`
  - Expects props `{ state: State; actions: Pick<WizardActions, 'updateDetails' | 'goToStep'>; onActionsChange }`.
  - Relies on `actions.updateDetails` and `actions.goToStep`.
- `reserve/features/reservations/wizard/ui/steps/DetailsStep.tsx`
  - Props include `actions: Pick<WizardActions, 'updateDetails' | 'goToStep'>`.
- `reserve/features/reservations/wizard/ui/steps/ReviewStep.tsx`
  - Props expect `actions: Pick<WizardActions, 'goToStep'>`.
- `reserve/features/reservations/wizard/ui/steps/ConfirmationStep.tsx`
  - Props require `onNewBooking`, `onClose`, and `onActionsChange`.

## Existing Patterns

- `reserve/features/reservations/wizard/model/store.ts` defines `useWizardStore`, returning both `state` and a memoized `actions` object derived from reducer `dispatch`.
- `reserve/features/reservations/wizard/ui/ReservationWizard.tsx` demonstrates canonical composition:
  - obtains `{ state, actions, ... }` from `useReservationWizard` hook.
  - passes `actions` to `PlanStep`, `DetailsStep`, and `ReviewStep`.
  - passes both `onNewBooking` and `onClose` to `ConfirmationStep`.

## Key Insight

- `components/reserve/booking-flow/index.tsx` duplicates much of the hook logic but omits the `actions` abstraction, passing raw `dispatch` and missing `onClose`.
- Aligning the component with the `WizardStore` pattern (creating local `actions` object mirroring `createActions`) should resolve type mismatch and ensure shared business rules stay consistent.
