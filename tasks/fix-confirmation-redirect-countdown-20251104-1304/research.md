# Research: Confirmation countdown redirect not firing

## Observation

- UI shows “Redirecting to summary in 5s…” but does not navigate. Appears stuck as a placeholder.
- Likely rendered by Confirmation step (pending state) in wizard, but URL may still show `?step=plan` due to URL sync timing. Root cause should be within ConfirmationStep.

## Code Analysis

- File: `reserve/features/reservations/wizard/ui/steps/ConfirmationStep.tsx`
  - `useEffect` sets a 1s interval to decrement `redirectIn` and a 5s timeout to call `controller.handleClose()`.
  - Dependency array includes `controller.status`, `controller.handleClose`, and `controller`.
- Problem: Including the `controller` object (created on each render) causes the effect to re-run every render, clearing and re-creating timers. Countdown resets to 5s and timeout never completes.

## Fix

- Remove `controller` from the effect dependency list. Keep only `controller.status` and `controller.handleClose` (which is memoized).

## Risks

- Minimal. Ensures timers remain stable during pending state.
- `handleClose` remains captured via stable callback from `useConfirmationStep`.

## References

- `reserve/features/reservations/wizard/ui/steps/ConfirmationStep.tsx`
- `reserve/features/reservations/wizard/hooks/useConfirmationStep.ts` (stable `handleClose`)
