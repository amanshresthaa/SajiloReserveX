# Plan – reserve-sticky-footer

## 1. Modular foundation
- Carve out a dedicated `components/reserve` module tree:
  - `icons.tsx` exporting the existing `Icon` set.
  - `ui-primitives.tsx` exposing shadcn-style Button/Input/Card/Label/Checkbox/Textarea wrappers that were inlined in `page.tsx`.
  - `helpers.ts` for booking-specific utilities currently under `U` (formatters, slot helpers, phone/email validators, localStorage keys) while reusing `lib/utils.cn` to avoid duplication.
- Ensure all exports remain tree-shakeable and typed; update `tsconfig` paths if needed (should already resolve via `@/`).

## 2. Step components & reducer collocation
- Move the reducer, state, and meta definitions (`stepsMeta`, action types, `getInitialState`) into `components/reserve/booking-flow/state.ts` for reuse.
- Create individual step views under `components/reserve/steps/`:
  - `PlanStep` (current Step1) focusing on availability selection.
  - `DetailsStep` (Step2) for contact details.
  - `ReviewStep` (Step3) for confirmation summary.
  - `ManageStep`/`ConfirmationStep` (Step4) wrapping confirmation + manage logic plus `AlertDialog`.
- Each step receives typed props (`state`, `dispatch`, and relevant callbacks) and consumes shared primitives/helpers; keep analytics and API calls unchanged.

## 3. Sticky progress experience
- Introduce `components/reserve/sticky-progress.tsx` implementing a bottom-fixed tracker:
  - Collapsed pill shown when hero section is off-screen OR when `step > 1`.
  - Expandable panel revealing step statuses, using micro-speed animation (`transition`, `duration-150`, slight `translate-y`/`opacity` changes) and respecting pointer + keyboard access.
  - Render step metadata + current summary (party/time/date), with progress indicator (e.g., mini step bullets + textual status).
- Implement `useStickyProgress` hook leveraging `IntersectionObserver` (pattern from `components/FeaturesListicle.tsx`) to toggle visibility based on a ref passed from the hero container; guard for SSR.
- Hook in subtle haptics via a small helper (e.g., `useSubtleHaptics`) that calls `navigator.vibrate(8)` when the progress card reveals or on step completion, feature-detected for supported devices.

## 4. Page assembly
- Replace the giant inline implementation in `app/reserve/page.tsx` with a thin wrapper that imports `BookingFlowPage` from `components/reserve/booking-flow`. Keep the Suspense fallback at the page level.
- Within `booking-flow/index.tsx` compose:
  - Hero/summary section (without the old bulky progress list) using shared primitives.
  - Step renderer delegating to the new step components.
  - Sticky progress component attached to hero ref + reducer state.
  - Footer padding adjustments so sticky elements don’t overlap CTA footers.
- Ensure typography hierarchy matches design principles (e.g., `text-3xl` heading, `text-sm` secondary copy, adequate spacing).

## 5. Polish & integration
- Wire haptic helper to step transitions (`useEffect` watching `state.step`).
- Confirm localStorage persistence still works (hydrate on load, save when remember toggled).
- Review accessibility: focus traps for alert dialog, aria labels for sticky toggle button, `aria-live` status updates.
- Remove redundant inline declarations from the original page file after imports migrate.

## 6. Verification
- Manual QA: run through create booking, waitlist scenario, manage lookup, ensuring sticky tracker hides/shows appropriately and footers remain usable on mobile viewport sizes.
- Automated: run `pnpm lint` (and `pnpm typecheck` if time) to ensure no regressions.
- Document relevant behavioural notes (trigger conditions, haptics guard) in inline comments where necessary.
