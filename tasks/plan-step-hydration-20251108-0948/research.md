# Research: Plan step hydration mismatch

## Requirements

- Functional: eliminate SSR/client hydration mismatch in the reservation plan step so the calendar/time input renders consistently without React errors.
- Non-functional: preserve accessibility hints and suggestion list behavior; keep UI responsive.

## Existing Patterns & Reuse

- `reserve/features/reservations/wizard/ui/steps/plan-step/components/Calendar24Field.tsx` is the shared time/date picker for the wizard.
- Hooks already track `hasHydrated` patterns elsewhere (e.g., `BookingWizardContent` uses a `hasHydrated` flag before focusing offline banners).

## External Resources

- React hydration guidance: https://react.dev/reference/react-dom/client/hydrateRoot

## Constraints & Risks

- SSR must produce stable markup; we cannot wrap the whole wizard in `suppressHydrationWarning` because it hides real regressions.
- Need to avoid layout shift/flash when suggestions appear post-hydration.

## Open Questions

- None at this time.

## Recommended Direction

- Introduce a local `hasHydrated` flag inside `Calendar24Field` that forces deterministic output (fallback step=60, no datalist) until the component mounts in the browser.
- Once `hasHydrated` is true, re-enable suggestion datalists and interval-specific step size so client behavior remains unchanged.
