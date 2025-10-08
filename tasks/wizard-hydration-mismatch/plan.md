# Implementation Plan — Wizard Hydration Fix

## Goal

Eliminate the Plan Step hydration mismatch by ensuring the server-rendered HTML for `BookingWizard` (specifically the offline banner region) matches the initial client render, even when the user's network status differs at hydration time.

## Strategy Overview

1. **Stabilise the offline banner rendering** so the first render on both server and client either includes or omits it consistently. Defer the actual `navigator.onLine` check until after hydration.
2. **Guard online status hook** to avoid reading `navigator.onLine` during the initial render, which currently diverges between environments (server vs. client or varying browser state).
3. **Add regression test coverage** (React Testing Library) to assert the Plan step renders deterministically during hydration.

## Detailed Steps

### 1. Update `useOnlineStatus`

- Change the hook to initialise `isOnline` as `null` and only set a boolean inside `useEffect` (after mount), deriving the final exposed value as `true` when the state is still `null`.
- Keep existing event listeners for `online`/`offline`, but ensure they only run after mount.
- Document that the hook intentionally delays the real value to prevent hydration mismatches.

### 2. Adjust `BookingWizard` offline banner logic

- Compute `const hydrated = useHasMounted()` (new small hook returning false on first render, true after `useEffect`).
- Only show `<WizardOfflineBanner />` when both `hydrated` and `isOnline === false`.
- Ensure focus-management effect that targets the banner accounts for the delayed hydration (only runs when the banner actually exists).

### 3. Add tests

- Create a Vitest test (likely in `reserve/features/reservations/wizard/ui/__tests__/BookingWizard.plan-review.test.tsx` or a new file) mocking the online status hook into both `true` and `false` states to validate the banner gating behaviour without triggering React hydration warnings.
- Confirm that when `useOnlineStatus` returns `false` initially, the rendered tree before hydration lacks the banner, but after a simulated effect runs, the banner appears (or at least that the gating respects `hydrated`).

### 4. Verification

- Run targeted Vitest suites touching the wizard UI.
- If practical, exercise the page manually or via Playwright in offline mode after restarting dev server to ensure no hydration error surfaces.
- Update task docs (`tasks/wizard-hydration-mismatch/todo.md`) and summarize findings.

## Risks / Considerations

- Delaying the offline banner might mean momentarily omitting the warning for truly offline users until hydration completes (~few ms). This is acceptable because it prevents fatal hydration errors and the banner still shows almost immediately after mount.
- Focus management must handle the case where the banner appears post-hydration; ensure we still move focus when it first renders offline.
