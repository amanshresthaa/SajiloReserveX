# Plan — revamp-booking-wizard

## 0. Approach validation (meta)

- Adopt Option C from research: build wizard-focused shadcn implementation using (and, where needed, refreshing) existing primitives, scaffolding missing ones (Form, Progress, Alert, Skeleton) so the flow feels like a fresh build while minimising disruption elsewhere.
- Mobile-first priority: design each layout assuming ≤375px width, then layer responsive grid/spacing enhancements.
- Continuously challenge assumptions by cross-checking with reducer contracts, analytics hooks, and tailwind tokens.

## 1. Architecture & scaffolding

1.1 Create new shared layout shell `WizardLayout` (wraps page content, handles safe-area padding, renders sticky region placeholder). File: `reserve/features/reservations/wizard/ui/WizardLayout.tsx`.
1.2 Extract sticky UI into `WizardFooter` + `WizardProgress` components (`reserve/features/reservations/wizard/ui/StickyFooter.tsx`, `WizardProgress.tsx`) using shadcn `Button`, `Separator`, `Progress` (new component).
1.3 Introduce a central `wizardIcons.ts` map bridging reducer `StepAction.icon` strings to lucide icons.
1.4 Scaffold missing shadcn primitives if absent: `components/ui/form.tsx`, `alert.tsx`, `progress.tsx`, `skeleton.tsx`, `separator.tsx`, `sonner`? (verify presence before creation).
1.5 Add dependency entries for `react-hook-form` and `@hookform/resolvers` (package.json) + lockfile updates.
1.6 Update Suspense fallback to use `Loader2` spinner.

## 2. Form management & validation

2.1 Define zod schemas per step in new `schemas.ts` under `reserve/features/reservations/wizard/model` to cover plan (date/time/party/bookingType/notes), details (name/email/phone/checkboxes), review (pass-through), and confirmation (no form, but confirmation actions).
2.2 Build react-hook-form instances: evaluate two alternatives — (A) one master form across steps vs (B) per-step forms. Choose (B) (per-step) to align with existing reducer updates and avoid state duplication; use `useForm` initialised from reducer state, sync changes back via `dispatch` on submit/blur.
2.3 Implement controlled `FormField`s in each step, ensuring hydration-safe default values and `aria` attributes. Maintain reducer as source of truth by updating on each valid change.

## 3. Step refactors (mobile-first)

3.1 **PlanStep**

- Rebuild using shadcn `Form`, `FormField`, `Popover`, `Calendar`, `ToggleGroup`, `Textarea`.
- Ensure date button is 44px tall, use flex column on mobile; grid enhancements only `md+`.
- Add helper text for guest count; keep `aria-live` on count.
- Replace tooltip logic with shadcn `Tooltip`; include `aria-disabled` + `data-state` classes.
- Provide inline validation (e.g., require time selection) and char counter for notes (if spec demands).

  3.2 **DetailsStep**

- Convert to `Form` with zod schema for contact details. Each input within `FormItem` and `FormMessage`.
- Checkboxes within `FormField` wrapping `FormControl` + label to guarantee consistent spacing/hit target.
- Terms alert uses shadcn `Alert` with `AlertCircle`. Add `aria-live="assertive"` when error visible.

  3.3 **ReviewStep**

- Use `Card` + `<dl>` restructure; integrate `Alert` for errors; consider `Button`/`Link` inside summary for editing.
- Provide keyboard focus order for “Edit details” etc via sticky footer actions; ensure `aria-live` summary text updated.

  3.4 **ConfirmationStep**

- Replace banners with shadcn `Alert` or status chips; reuse `WizardFooter` actions with `Loader2` when loading.
- Format `<dl>` responsive stack (single column mobile, two columns `sm+`).

## 4. State sync & analytics integrity

4.1 Ensure each form submit dispatches identical analytics via `track(...)`; verify event names remain unchanged.
4.2 Maintain `onActionsChange` contract: new components produce consistent `StepAction` objects.
4.3 Validate localStorage behaviour for remembered contacts still works post form conversion.

## 5. Responsiveness & accessibility validation

5.1 For each step, manually test layout at widths 320px, 768px, 1024px (DevTools or responsive mode plan).
5.2 Implement `aria-live` region in `WizardProgress` announcing `Step X of Y` plus summary.
5.3 Guarantee focus management: step transitions move focus to top heading via `ref` + `focus()`, sticky buttons accessible via keyboard.
5.4 Provide safe-area padding via `pb-[env(safe-area-inset-bottom,0)+theme(space.safe-b)]`.

## 6. Testing & stories

6.1 Unit tests (Vitest + Testing Library) for `WizardProgress`, `PlanStep` (time button disabled logic), `DetailsStep` validation.
6.2 E2E Playwright scenario covering booking creation path, keyboard navigation, and validation errors.
6.3 Storybook stories for each component (WizardLayout, steps) covering loading, error, happy states.

## 7. Risk & mitigation

- **Re-renders between reducer and RHF**: mitigate by using `useEffect` + `form.reset` when reducer state changes and `form.watch` to dispatch debounced updates.
- **Package additions**: ensure Next/Vite bundlers handle `react-hook-form` tree-shaking; test both Next + reserve Vite builds.
- **Icon mapping**: mismatch between `StepAction.icon` strings and lucide names. Provide fallback icon and log warnings in dev.
- **Sticky footer heights**: new layout may change measurement; adjust `WizardLayout` to read height via `ResizeObserver` similarly to existing hook.
- **Timeline creep**: break implementation into small PR-sized patches per step to maintain reviewability.

## File touch list (initial estimate)

- `package.json`, `pnpm-lock.yaml` / `package-lock.json`
- `components/ui/{form.tsx,alert.tsx,progress.tsx,skeleton.tsx,separator.tsx}` (new or updated)
- `reserve/features/reservations/wizard/ui/{WizardLayout.tsx,StickyFooter.tsx,WizardProgress.tsx}` (new)
- `reserve/features/reservations/wizard/ui/ReservationWizard.tsx` (update)
- `reserve/features/reservations/wizard/ui/StickyProgress.tsx` (likely replaced/removed)
- `reserve/features/reservations/wizard/ui/steps/{PlanStep.tsx,DetailsStep.tsx,ReviewStep.tsx,ConfirmationStep.tsx}` (refactor)
- `reserve/features/reservations/wizard/model/{schemas.ts,reducer.ts}` (schema addition + small adjustments for icons?)
- `reserve/features/reservations/wizard/hooks/useReservationWizard.ts` (integrate layout + new components)
- `reserve/features/reservations/wizard/tests/*` (new unit tests)
- `reserve/features/reservations/wizard/ui/__stories__/*` (storybook stories)

## Verification checkpoints

- Lint + format after each major patch.
- Run `pnpm test`, `pnpm test:e2e` (targeted) once refactor complete.
- Capture Lighthouse accessibility snapshot for wizard route (manual note in final report).

## Execution notes (2025-09-26)

- Review and Confirmation steps now expose screen-reader announcements, shadcn `Alert` feedback, and avoid `window.alert` fallbacks.
- Legacy `StickyProgress` removed; both reservation wizard entry points share `WizardLayout`/`WizardFooter`.
- Added vitest schema/unit coverage, a guarded Playwright spec, and Storybook stories for the new building blocks.
