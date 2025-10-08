# Research Notes — Wizard Plan Step Hydration Mismatch

## Symptom recap

- Runtime error: `Hydration failed because the server rendered HTML didn't match the client` thrown beneath `PlanStep` inside `BookingWizard`.
- React diff (from error log) shows server markup containing an `Alert` (`role="status"`, `aria-live="polite"`, icon span) while client markup renders a `Card` (`rounded-xl border ...`).
- Structure where mismatch occurs sits inside the Plan step container (`BookingWizard -> WizardLayout -> PlanStep`).

## Key code paths reviewed

- `reserve/features/reservations/wizard/ui/steps/PlanStep.tsx`: now renders `Card` + `CardHeader`/`CardTitle` etc from `@shared/ui/card`.
- `reserve/shared/ui/card.tsx`: client component proxy re-exporting `components/ui/card.tsx`, which attaches static Tailwind classes (so `Card` should never emit `className={null}`).
- `reserve/features/reservations/wizard/ui/WizardLayout.tsx`: optionally injects `banner` (offline notice) before children.
- `WizardOfflineBanner.tsx`: uses `Alert` with the exact class string seen in the server diff — indicates the server rendered this banner.
- `BookingWizard.tsx`: chooses a `banner` when `useOnlineStatus()` reports offline; also shows skeletons when `state.loading` is true.
- `hooks/useOnlineStatus.ts`: initializes `isOnline` to `true` when `navigator` is undefined (SSR) and to `navigator.onLine` otherwise.

## Hypotheses considered

1. **Stale HTML**: server could be serving older static HTML from a prior deploy. Unlikely because `app/reserve/r/[slug]/page.tsx` is marked `dynamic = 'force-dynamic'` so SSR runs every request.
2. **Offline banner mismatch**: if `useOnlineStatus()` returned `false` on the server but `true` on the client, SSR would emit the banner while the hydrated client removes it — exactly the diff observed.
   - However `useOnlineStatus()` defaults to `true` on the server, so for the banner to appear server-side `navigator.onLine` must already be `false` (some polyfill providing `navigator`?), or the hook is invoked in a different context where `navigator` exists but reports `false`.
   - Alternatively, the diff might be inverted (client inserted banner). Need to double-check actual DOM when reproducing.
3. **Hydration gating**: we rely on real-time browser APIs (`navigator.onLine`) during the initial render. Even if SSR and client both start `true`, users loading the page while offline cause client-first render to have banner whereas server HTML (generated earlier) does not, yielding a mismatch.
4. **Suspense fallback**: server might render `PlanStepSkeleton` (if `state.loading` true) while client resolves to `PlanStep`. Skeleton markup does not include `Alert`, so mismatch seen doesn’t match skeleton layout.
5. **`@shared/ui/card` resolution**: if the server bundle resolved to a stale/placeholder module, `Card` might have produced `<div className={null}>`. Yet the surrounding markup (icon span, `role="status"`) aligns exactly with `Alert`, reinforcing the “banner mismatch” theory.

## Additional checks to perform

- Confirm whether `useOnlineStatus()` runs during SSR with some mocked `navigator` (maybe Next server polyfill?). Logging needed.
- Identify any other conditions where `WizardOfflineBanner` renders before hydration (e.g., wizard context setting `isOffline` in an initial state).
- Inspect `useReservationWizard` initial state: ensure `state.step`/`loading` stable so markup doesn’t jump drastically pre/post hydration.
- Consider deferring offline banner rendering until after hydration (`useHasMounted` gating) to keep initial HTML stable regardless of true network state.
