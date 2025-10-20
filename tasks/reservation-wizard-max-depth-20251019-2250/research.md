# Research: Reservation Wizard Maximum Update Depth Error

## Existing Patterns & Reuse

- `useReservationWizard` already exposes `handleActionsChange`, `stickyActions`, and resets actions on step transitions; other steps (`useDetailsStepForm`, `useReviewStep`, `useConfirmationStep`) use the same callback without issue (`reserve/features/reservations/wizard/hooks/useDetailsStepForm.ts:131`, `useReviewStep.ts:65`, `useConfirmationStep.ts:166`).
- Equality gating for sticky actions lives inside `handleActionsChange` (`reserve/features/reservations/wizard/hooks/useReservationWizard.ts:72-105`); it only compares id/label/variant/disabled/loading.

## External Resources

- React Hook Form docs on `formState.isValid`/`isSubmitting` behaviour in `mode: 'onChange'` (to understand dependency churn).
- React 19/Next 15 release notes regarding stricter infinite update detection (possible behavioural change that surfaced the loop).

## Constraints & Risks

- Must avoid regressing other wizard steps that rely on the shared sticky action plumbing.
- Actions carry closures (`onClick`) that may need to refresh when dependencies change; deduplication cannot freeze stale handlers.
- Need to keep solution compatible with existing unit tests (`reserve/features/reservations/wizard/ui/steps/plan-step/__tests__/PlanStepForm.test.tsx`) and ideally add coverage for the regression.
- Booking wizard is customer-facing; fixes must preserve analytics tracking and validation paths.

## Open Questions (and answers if resolved)

- Q: Is `handleActionsChange` firing infinitely because Plan step re-creates the `submit` callback on every render?
  A: Likely—Plan step defines `submit` inline inside `useEffect` (`usePlanStepForm.ts:346-357`), so each render emits a fresh function. Unlike other steps, the action payload has a single primary button whose disabled/loading state is linked to reactive form signals, making it more susceptible to mismatched signature checks against `handleActionsChange`’s limited equality guard.
- Q: Do we need to adjust the equality comparison or stabilise the Plan step action objects?
  A: Stabilising the action definitions (memoised submit handler + memoised action array with explicit dependency list) should prevent redundant updates without weakening the guard for other steps.

## Recommended Direction (with rationale)

- Introduce a dedicated `useCallback` for the Plan step submit handler and wrap the resulting action array in `useMemo`, ensuring referential stability unless relevant dependencies genuinely change.
- Optionally enhance `handleActionsChange` with a helper that also considers optional fields (icon/ariaLabel) and compares handler references when they are stable, reducing accidental updates across all steps.
- Add regression coverage (hook test) asserting no runaway `onActionsChange` calls when the wizard consumes the hook, and document the fix in the task artefacts.
