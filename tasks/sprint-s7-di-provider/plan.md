# Sprint S7 — Wizard Dependency Injection: Plan

## Goal

Introduce DI interfaces (`AnalyticsTracker`, `HapticsClient`, `Navigator`) with a provider so wizard hooks/components can consume dependencies via context. Preserve current behaviour with default implementations while enabling tests to inject no-ops.

## Detailed steps

1. **Define dependency contracts**
   - Create `wizard/di/types.ts` describing minimal interfaces:
     - `AnalyticsTracker` with `track(event, payload?)`.
     - `HapticsClient` with `trigger(pattern?)`.
     - `Navigator` with `push`, `replace`, `back` (matching what wizard needs today).
   - Provide default instances mirroring existing behaviour (wrap `track`, `triggerSubtleHaptic`, `useNavigate`). Guard defaults for SSR safety.

2. **Create context + provider**
   - Implement `WizardDependenciesContext` + `WizardDependenciesProvider` exporting hook `useWizardDependencies`.
   - Provider accepts partial overrides; merge with defaults.
   - Ensure provider works on client side only (no server references) and is tree-shake friendly.

3. **Update wizard entry points**
   - Modify `useReservationWizard` to consume dependencies from context instead of direct imports.
   - Adjust `handleClose`, `handleConfirm`, and haptic effects to call context-supplied implementations.
   - Update `ReservationWizard` (or highest-level component) to wrap children with provider using default deps.
   - Expose ability for booking flow page/client to pass custom deps later (optional now but include API to override).

4. **Adapt related hooks/components**
   - `useReviewStep`, `ReservationDetailClient`, etc., may still import `track`. Decide whether to consume DI now or document TODO; minimum requirement is wizard entry point per sprint goal.
   - Ensure tests consuming hooks get provider automatically (wrap test utils, or at least update affected tests).

5. **Testing**
   - Add unit test verifying provider merges overrides (e.g., custom tracker increments counter when `handleConfirm` called).
   - Update/extend existing wizard tests to wrap subject with provider using mocked dependencies.

6. **Verification**
   - Run `pnpm test` (or focused suite if lengthy) and `pnpm lint`.
   - `rg 'track(' reserve/features/reservations/wizard/hooks` afterwards to confirm only context or default implementations remain.

## Questions / assumptions

- Assume `ReservationWizard` component is the right place to mount provider; confirm import tree to avoid double wrapping.
- Navigator interface will likely wrap `useNavigate`; consider fallback when hook not available (e.g., default uses `useRouter`? verify usage contexts).
- Analytics events outside wizard entry will be handled in future sprints.
