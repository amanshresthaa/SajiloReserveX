# Implementation Plan: Fix confirmation auto-redirect

## Objective

Ensure the confirmation step’s “Redirecting to summary in 5s…” countdown actually navigates after 5s.

## Steps

- Remove `controller` from the `useEffect` dependency array in `ConfirmationStep.tsx` so timers are not reset.
- Typecheck and quick manual verification.

## Success Criteria

- Countdown decrements visibly from 5 to 0.
- Auto-navigates (calls `handleClose` → pushes to thank-you) after ~5 seconds when status is `pending`.
