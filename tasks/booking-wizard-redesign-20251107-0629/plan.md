# Implementation Plan: Booking Wizard Redesign

## Objective

Deliver a mobile-first, consistent booking wizard shell that aligns with the new UX requirements (WizardContainer + WizardStep + unified WizardNavigation/Progress/Summary), while preserving the current reservation state machine and analytics hooks.

## Success Criteria

- [ ] New foundational components (`WizardContainer`, `WizardStep`, `WizardNavigation`, `WizardProgress`, `StepSummary`) exist under `reserve/features/reservations/wizard/ui` with Storybook coverage for key states.
- [ ] `BookingWizard` uses the new container + navigation, yielding a single sticky footer pattern across all steps (confirmation included) with text labels visible on mobile.
- [ ] Responsive/mobile QA confirms 320–428px experience: no horizontal scroll, buttons ≥44px height, thumb-friendly layout, aria-live progress updates.
- [ ] Automated coverage updated: unit tests for progress/navigation + updated component/e2e tests referencing new selectors.
- [ ] Documentation artifacts (`todo.md`, `verification.md`) capture what changed and how to validate.

## Architecture & Components

- **WizardContainer** (`ui/WizardContainer.tsx`)
  - Wraps existing `WizardLayout` to keep padding/heroRef logic.
  - Accepts `steps`, `initialStep`, `onComplete`, `onExit`, and renders children via render prop receiving wizard state/actions (bridging to `useReservationWizard`).
  - Manages sticky footer visibility/height by subscribing to `useReservationWizard`’s `stickyVisible`, `handleStickyHeightChange`, etc., and passes measurement callbacks down to `WizardNavigation`.
  - Provides React context exposing `currentStep`, `totalSteps`, `summary`, `registerActions`, and `scrollToTop` for `WizardStep` components.
  - Handles scroll restoration between steps (scrolls to heroRef when step changes) and data persistence (delegates to `useReservationWizard`).
- **WizardStep** (`ui/WizardStep.tsx`)
  - Semantic wrapper (`<section>`) that enforces heading hierarchy, optional description, and handles `isActive` state (aria-hidden + `inert` polyfill for inactive steps when they remain mounted).
  - Accepts `onValidate` and `onNext` callbacks; surfaces validation errors using context-provided `registerActions` so steps can inject their CTA states.
  - Auto-focuses heading when activated, ensuring keyboard/screen reader context resets per step.
- **WizardNavigation** (`ui/WizardNavigation.tsx`)
  - Sticky footer used for all steps. Layout: progress block + summary + action cluster. On mobile it stacks, on ≥640px it forms grid per prompt diagrams.
  - Accepts `steps`, `currentStep`, `summary`, `actions` (`StepAction[]`) plus optional `confirmationActions`/`mode` to tweak labels. Renders all buttons with visible text labels; icons become additive.
  - Button layout: `Back` (secondary) left-aligned, `Continue/Confirm` (primary) full-width on mobile, split on tablet+, tertiary actions (calendar/wallet/new) wrap under summary per spec.
  - Uses `ResizeObserver` to inform parent via `onHeightChange`; includes safe-area padding/shadow/backdrop.
- **WizardProgress** (refactor existing file)
  - Keep linear bar + `Step X of Y` text always visible; hide pill row below 768px as spec requires.
  - Add `aria-live="polite"` for step announcements and optional step icons.
- **StepSummary** (`ui/StepSummary.tsx`)
  - Receives `primary`, `details`, optional `meta` chips (icon + label). Handles truncation/ellipsis for long text and ensures the layout adapts between mobile (stacked) and desktop (inline).
  - Live-updates from `selectionSummary` provided by `useReservationWizard`.
- **Action plumbing**
  - Expand `StepAction` type to include `description`, `placement` (`primary` | `secondary` | `tertiary`), and `fullWidth` hints; default mapping ensures backwards compatibility for existing steps that only set label/icon.
  - Provide helper `mapStepActionsToNavConfig` used inside `WizardNavigation` so existing steps need minimal updates (only if they need new metadata, e.g., confirmation CTAs ordering).

## Data Flow & API Contracts

- Data still flows through `useReservationWizard` (state + reducer). `WizardContainer` passes `state`, `actions`, and callbacks to steps. Steps continue to call `onActionsChange` with `StepAction[]`; container feeds that array into `WizardNavigation`.
- `WizardNavigation` consumes `selectionSummary` (existing `WizardSummary`) plus the `stepsMeta` that `useReservationWizard` already exposes (`Plan`, `Details`, `Review`, `Confirmation`). No new API endpoints needed; schedule/time-slot fetching stays the same.
- `onComplete` in `WizardContainer` maps to `handleConfirm`/`handleClose` depending on the final action triggered; `onExit` maps to `handleClose` for cancellations.

## UI/UX States

- **Loading**: keep existing skeleton components for each step, but ensure `WizardContainer` still renders `WizardNavigation` with disabled buttons + spinner when `state.loading` is true.
- **Empty / initial**: Date/time selectors show calendars/time grids; footer displays “Select your date” summary until user picks values.
- **Validation errors**: Inline errors remain in form controls; navigation disables `Continue` until `formState.isValid`. `WizardStep` exposes `aria-live` region for summary of errors when user attempts to proceed.
- **Offline**: `WizardOfflineBanner` still shown via `BookingWizard`; `WizardNavigation` buttons become disabled when `stickyActions` are disabled (already handled via `useReservationWizard`).
- **Confirmation**: Use same nav component but with tertiary button row for Calendar/Wallet/New, plus StepSummary text “✓ Confirmed …”.

## Edge Cases

- User changes step while offline: ensure actions stay disabled but sticky nav stays visible so summary/progress remain accessible.
- Long summary text (e.g., venue names with emoji): StepSummary must truncate gracefully without wrapping the layout.
- Screen rotations: sticky nav height changes must recompute padding promptly; ensure `ResizeObserver` throttling is in place to avoid `useLayoutEffect` loops.
- Accessibility: when steps change, focus should move to the new step heading; aria-live region must not spam when user scrubs back and forth quickly (debounce announcements or rely on `aria-live="polite"`).
- Confirmation actions with asynchronous handlers (calendar/wallet) should show loading states within the same button while others remain usable.

## Testing Strategy

- **Unit tests (Vitest)**:
  - `WizardProgress` rendering: step counts, aria attributes, responsive class toggling.
  - `WizardNavigation` action layout: ensures text labels visible on mobile, button ordering for primary/secondary/tertiary.
  - `StepSummary` truncation + chip rendering.
- **Integration/component tests (Playwright component or Vitest + React Testing Library)**:
  - `BookingWizard` snapshot for Plan→Details transitions verifying sticky nav updates and disabled states.
  - Update `tests/component/wizard/PlanStep.spec.tsx` to assert new DOM/testids.
- **E2E (Playwright)**:
  - Update `tests/e2e/reservations/booking-flow.spec.ts` selectors to match new footer buttons (e.g., `data-testid="wizard-primary-action"`).
  - Add new scenario covering confirmation footer actions (calendar/wallet/new) visibility.
- **Accessibility**: run `pnpm test:component -- --grep wizard` if available + manual axe via DevTools; document in `verification.md`.
- **Manual QA**: Chrome DevTools mobile emulation (iPhone SE/12 Pro) verifying sticky nav, focus order, offline banner overlay.

## Rollout

- Implement behind existing `NEXT_PUBLIC_RESERVE_V2` flag (wizard already gated). No extra feature flag needed; update release notes referencing task folder.
- Coordinate with QA to run smoke suite `pnpm test:e2e:smoke` once selectors updated.
- Document in `tasks/.../verification.md` once manual + automated checks pass; include DevTools screenshots if required.
- Remove deprecated `WizardFooter`/`WizardStickyConfirmation` exports after confirming no other importers (future follow-up task if necessary).
