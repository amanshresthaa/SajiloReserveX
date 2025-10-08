# Execution Checklist

- [x] Update `useOnlineStatus` to hydrate-safe initial state (null -> effect-driven boolean).
- [x] Introduce/use a hydration guard hook in `BookingWizard` and gate the offline banner on it.
- [x] Ensure focus logic only runs once the banner actually renders post-hydration.
- [x] Expand or add Vitest coverage verifying banner gating (no initial render mismatch).
- [x] Run relevant Vitest suites (`reserve/features/reservations/wizard/ui/__tests__/...`).
- [ ] (Optional) Document offline hydration behaviour in wizard tasks/notes.
