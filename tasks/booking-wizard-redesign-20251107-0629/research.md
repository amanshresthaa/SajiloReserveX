# Research: Booking Wizard Redesign

## Requirements

- Functional:
  - Deliver a four-step booking wizard (date → time → guest info → confirmation) with persistent navigation and validation gates per step.
  - Persist selections between steps, support back/forward transitions, and surface inline errors before navigation.
  - Provide sticky footer navigation that always exposes progress, summary, and primary/secondary actions with consistent layout across steps (confirmation uses same shell with different CTAs).
  - Expose callbacks for completion (`onComplete`) and exit/cancel flows for embedding contexts (customer vs ops) and maintain analytics hooks already wired through `useReservationWizard`.
- Non-functional:
  - Mobile-first (320–428px baseline) with touch-friendly hit areas (≥44px), predictable spacing scale, and thumb-reachable primary actions in sticky footer.
  - WCAG 2.1 AA accessibility: semantic structure (`<main>`, `<nav>`), focus management between steps, aria-live progress updates, visible focus rings, and color contrast ≥4.5:1.
  - Performance: lazy render only the active step, smooth sticky footer animations, minimize layout shifts by reusing `WizardLayout` padding logic, and keep bundle budget (<50KB gzipped incremental).
  - Follow repository mandates: task artifacts, SHADCN components, remote Supabase only, Chrome DevTools QA for UI.

## Existing Patterns & Reuse

- State management already centralized in `reserve/features/reservations/wizard/hooks/useReservationWizard.ts` and `.../model/reducer.ts`; this hook exposes `state`, `actions`, `heroRef`, sticky footer controls, analytics, and offline handling. Reusing it avoids rewriting validation/business logic.
- Layout + sticky spacing handled by `WizardLayout` (`reserve/.../ui/WizardLayout.tsx`) which already pads the scroll area when sticky navigation is visible. We can wrap/extend this rather than reimplementing scroll/padding logic.
- Current sticky components (`WizardFooter.tsx` for steps 1–3, `WizardStickyConfirmation.tsx` for step 4, `WizardProgress.tsx` for both) already include ResizeObserver plumbing, safe-area padding, and progress computation. However they rely on icon-only CTAs and split confirmation into a different layout—precisely what the new spec wants to unify.
- Step content components (`PlanStep`, `DetailsStep`, `ReviewStep`, `ConfirmationStep`) and children (e.g., `PlanStepForm`) already emit `StepAction[]` via `onActionsChange`. That contract can be preserved so steps remain agnostic of the navigation shell even if we rebuild the shell.
- Selection summary builder (`reserve/.../model/selectors.ts:createSelectionSummary`) already formats `primary`/`details` text; it can feed the new `StepSummary` presentation layer without recalculating strings globally.
- Shared UI primitives from `@shared/ui` (Button, Card, Input, Progress, Separator, Alert, etc.) already encapsulate tokens/variants and align with Tailwind config; continuing to rely on them keeps consistency/dark-mode support.

## External Resources

- [WAI-ARIA Authoring Practices – 5.4 Wizard/Step Indicators](https://www.w3.org/WAI/ARIA/apg/patterns/stepper/) — reference for announcing step changes and structuring step lists.
- [Apple HIG – Touch Targets](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/#touch-targets) — reinforces ≥44pt tap areas and thumb zone considerations outlined in the prompt.

## Constraints & Risks

- The spec introduces `WizardContainer`, `WizardStep`, `WizardNavigation`, `WizardProgress`, and `StepSummary`. We must reconcile these with the existing `WizardLayout`, `WizardFooter`, and progress components to avoid duplicate logic. A phased replacement (create new foundational components, update `BookingWizard` to adopt them, deprecate the old ones) is safer than ripping everything out at once.
- Current step order (Plan → Details → Review → Confirmation) differs from the prompt’s Date → Time → Guests → Confirmation. Splitting Plan into two steps would touch the reducer, validators, analytics, and tests. Unless product explicitly requires that split now, we should map “Plan” to the new visual spec (date/time pickers stacked sequentially) and leave data shape intact, documenting the assumption.
- E2E/component tests under `tests/e2e/**/wizard` expect specific selectors (icon-only buttons, `wizardSelectors.continueButton`). Updating the DOM structure will break these tests; we need a migration plan for selectors (data-testid attributes, helper updates) to keep automated coverage viable.
- Sticky footer height currently feeds `WizardLayout` for padding. Any new navigation component must continue to emit height changes, otherwise content will hide under the footer on small screens.
- Confirmation-specific sticky actions (`WizardStickyConfirmation`) today expose multiple icon buttons (close/calendar/wallet/new). The new spec wants the same navigation shell everywhere, so we must ensure those specialized actions can still appear (maybe as secondary buttons row) without regressing functionality.
- Performance budget (<50KB gzipped) implies we should avoid heavy date/time libraries; reuse existing schedule services (`reserve/.../services/schedule.ts` & `.../timeSlots.ts`) and only hydrate the current step.

## Open Questions (owner: AI agent, due: start of implementation)

1. **Should we actually split the Plan step into separate “Date” and “Time” routes?** – Proposed approach is to keep the single reducer-driven step but reorganize the UI to visually separate date/time selections, matching the spec copy while avoiding a state machine rewrite. Need stakeholder confirmation later; document assumption in plan.
2. **Do ops mode flows need different navigation labels?** – Ops currently overrides behaviors via `BookingWizardMode`. Need to confirm whether new `WizardNavigation` should expose mode-specific CTAs or just rely on provided `StepAction[]`.
3. **Storybook coverage scope?** – Prompt requests Storybook stories for each component/state. Need clarity if we cover only the new primitives or every wizard step in all states. Plan assumes primitives + at least one composed `WizardNavigation` story per breakpoint.

## Recommended Direction (with rationale)

- **Foundation layer**: Introduce a new `WizardContainer` component that wraps `WizardLayout` and orchestrates sticky padding/ResizeObserver, progress context, and `WizardNavigation` rendering. It should accept `steps`, `initialStep`, `onComplete`, `onExit`, and render props for step content. Internally reuse `useReservationWizard` so data/validation logic remains intact.
- **Presentation primitives**: Replace `WizardFooter`/`WizardStickyConfirmation` with a single `WizardNavigation` that renders a `WizardProgress`, `StepSummary`, and consistent button layout (text labels always visible on mobile, icons optional). The component will expose slots for primary/secondary actions (derived from `StepAction[]`) and maintain touch-friendly button sizes per breakpoint. `WizardProgress` should be refactored to align with the prompt’s linear bar + optional pills, aria-live announcements, and hide pills under 768px.
- **Content scaffolding**: Implement `WizardStep` as a semantic section with heading/description/focus trap helpers plus validation hooks. Step components (Plan/Details/Review/Confirmation) will wrap their forms inside `WizardStep` to standardize typography and spacing.
- **State summary**: Build a standalone `StepSummary` that consumes the existing `SelectionSummary` object and handles truncation, icon chips, and responsive layout. This feeds into `WizardNavigation` and can also be reused inside confirmation cards.
- **Testing & docs**: Update `tests/helpers/wizardSelectors` to target the new DOM (data-testid attributes on nav buttons and progress). Add Storybook stories for `WizardNavigation`, `WizardProgress`, `StepSummary`, and `WizardContainer` skeleton states across breakpoints. Capture manual QA steps (Chrome DevTools, mobile emulation) in `verification.md` later.
- **Migration**: Deprecate the old sticky components but keep exports temporarily (backwards-compatible wrappers that render the new components) to avoid breaking other imports until references are updated. This reduces churn while meeting the spec.
