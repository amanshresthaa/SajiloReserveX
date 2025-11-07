# Research: Fix ESLint warnings in plan step form hook

## Requirements

- Functional: unblock pre-commit by eliminating `react-hooks/exhaustive-deps` warnings in `usePlanStepForm.ts` without changing runtime behavior.
- Non-functional (a11y, perf, security, privacy, i18n): maintain current form loading/cancellation semantics; no regressions to abort handling or data prefetching.

## Existing Patterns & Reuse

- The hook already stores long-lived `Map`/`Set` objects inside refs and mutates them in place. We should keep mutating the same instances rather than reassigning new objects.
- Nearby effects (e.g., the restaurantSlug reset effect) already copy the refs into local variables before acting on them.

## External Resources

- n/a

## Constraints & Risks

- Cleanup must still abort outstanding fetches to avoid leaks or duplicate requests.
- Effect scope must remain stable so eslint stays happy without introducing stale references.

## Open Questions (owner, due)

- None

## Recommended Direction (with rationale)

- Capture `abortControllersRef.current` and `pendingFetchesRef.current` in variables at the start of the unmount-only effect, then use those captured instances inside the cleanup. This follows the lint rule and is safe because the refs always point to the same mutable objects.
