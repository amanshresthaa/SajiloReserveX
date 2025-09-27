# Research — revamp-booking-wizard

## Task framing

- Goal: rebuild reservation wizard UI atop shadcn/ui patterns, add react-hook-form + zod validation, introduce shared layout/progress components, and ensure mobile-first responsiveness.
- Constraint: preserve existing reducer/actions/analytics; business logic cannot break.
- User clarified "do such that we're doing from scratch" ⇒ interpret as planning as if shadcn scaffolding and form primitives need deliberate setup, even though the repo already includes partial shadcn components. Need to reconcile: either refresh existing primitives to align with the new design tokens, or replace them entirely to ensure consistency.

## Current UI implementation (validated via `sed` + `rg` on wizard files)

- Wizard shell [`ReservationWizard.tsx`](../../reserve/features/reservations/wizard/ui/ReservationWizard.tsx) orchestrates steps and sticky footer.
- Steps (`PlanStep`, `DetailsStep`, `ReviewStep`, `ConfirmationStep`) already import shadcn-like components from `@/components/ui`. These resemble shadcn but may be legacy customised variants (confirmed by inspecting `components/ui/button.tsx`).
- Sticky footer is a bespoke `StickyProgress` component mixing navigation buttons with summary text.
- No `react-hook-form` logic; state is managed exclusively via reducer dispatches.
- Form fields rely on shared `Field` wrapper rather than shadcn `Form` primitives.

## Shared UI library status (triple-checked via `ls components/ui`, direct file reads, and package manifest review)

- `components/ui` directory already includes button, card, checkbox, popover, tooltip, etc. They follow shadcn patterns but with custom tokens (`var(--color-primary)`, `var(--radius-md)`).
- `package.json` lacks `react-hook-form` & `@hookform/resolvers`; we must add.
- `lucide-react` already installed — can provide Loader2, CheckCircle, etc.
- Tailwind config defines Sajilo-specific tokens; extending new components must keep these.

## State & data flow (inspection of reducer, hook)

- Reducer owns all wizard state (`State`, `StepAction`). `useReservationWizard` composes sticky summary and persists contacts to localStorage.
- Actions expect UI steps to dispatch `SET_FIELD`, `SET_STEP`, etc. Refactor must keep these semantics or provide adapters.
- Sticky actions pipeline currently expects each step to call `onActionsChange` which writes into sticky footer store (observed via hook).

## Responsiveness audit (viewport reasoning + class inspection)

- Current layout uses `min-h-screen`, `max-w-*` breakpoints; sticky footer calculates padding bottom with safe-area env var; mobile-first spacing appears but needs verification after re-theming.
- Steps use CSS grid `md:grid-cols-2` etc; still acceptable but we must revalidate with new components.

## Accessibility baseline (heuristics)

- Buttons include aria-labels for icon-only actions; tooltips delay for repeated hovers; time slots have tooltips.
- Lacks `aria-invalid` because not using forms; error messaging is manual.
- Step change announcements rely on sticky summary? Need to add explicit `aria-live` region per requirements.

## Gaps vs desired target

1. Form management: no react-hook-form or schema validation.
2. Layout architecture: we need `WizardLayout`, `StickyFooter` abstraction, plus `WizardProgress` using shadcn `Progress`.
3. Loading states: no skeleton components; Suspense fallback uses custom `Icon.Spinner` instead of `Loader2`.
4. Testing/story coverage: none dedicated to wizard components.
5. Need to ensure full mobile-first pass and safe-area compliance after refactor.
6. Must reconcile existing tokens with shadcn defaults: either adapt new components to existing tokens or update tokens to align.

## Potential approaches (considered & challenged)

- **Option A**: Reuse existing shadcn-like primitives, extend them. _Risk_: may miss thorough overhaul user expects from "from scratch" directive.
- **Option B**: Regenerate shadcn components using CLI, replacing current `components/ui`. _Risk_: could disrupt other app areas relying on custom styling; requires migration plan.
- **Option C**: Create wizard-specific wrappers that consume existing primitives but enforce new API contract (forms, layout). _Likely best_: allows incremental adoption while honoring directive by treating wizard as fresh build using canonical shadcn usage.

## External references / verification

- Cross-referenced shadcn docs (local knowledge) to confirm required primitives (Form, Progress, Alert, Skeleton) exist; will need to scaffold missing files (`form.tsx`, `alert.tsx`, `progress.tsx`, `skeleton.tsx`, etc.).
- Verified tailwind tokens align with AGENTS.md spec; ensures compatibility when adjusting component classes.

## Uncertainties

- Whether repo wants to retain `@reserve/shared/ui/icons` or shift fully to lucide icons. We'll assume we keep existing icon exports but may add lucide mapping for new components.
- Potential side-effects in other features using `components/ui` primitives if we regenerate them. Need change management plan.
- How far to extend react-hook-form (per step or unified form). We'll evaluate during planning stage.

## Next steps for planning

1. Define new component architecture (WizardLayout, StickyFooter, WizardProgress, step forms) with responsibility boundaries.
2. Identify dependencies to add (react-hook-form, @hookform/resolvers) and scaffolding tasks (new shadcn files, storybook scaffolding).
3. Break down per-step refactor tasks (Plan, Details, Review, Confirmation) including form integration and sticky action mapping.
4. Outline testing/story coverage and accessibility verification strategy.

## Current status (2025-09-26)

- React-hook-form + zod integrated across plan/details steps with shared schemas.
- New `WizardLayout`/`WizardFooter`/`WizardProgress` replace the legacy sticky footer throughout the app (including Next.js booking flow).
- Review and confirmation screens now use shadcn `Alert` components for inline feedback and expose aria-live announcements.
- Added shadcn primitives (`form`, `alert`, `progress`, `separator`, `skeleton`) aligned with Sajilo tokens.
- Coverage added via vitest unit checks, a guarded Playwright spec, and Storybook stories for progress/footer components.
