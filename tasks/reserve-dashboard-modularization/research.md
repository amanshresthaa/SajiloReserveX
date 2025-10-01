# Research Findings — Reserve & Dashboard Modularization

## Methodology & Cross-Verification

- Traversed `reserve` and Next.js `/app/(authed)/dashboard` trees via `find ... -maxdepth` to catalogue structure.
- Quantified component sizes with `find ... | xargs wc -l | sort` to flag >200 line components. (Example: `reserve/features/reservations/wizard/ui/steps/DetailsStep.tsx` 378 lines; `components/dashboard/BookingsTable.tsx` 205 lines; `app/reserve/[reservationId]/ReservationDetailClient.tsx` 284 lines.)
- Used `rg` to locate toast usage, duplicated helpers, and hook patterns (e.g., `rg 'toast' -g '*.{ts,tsx}'`).
- Confirmed duplication through `diff -u` between shared UI primitives (`reserve/shared/ui/button.tsx` vs `components/ui/button.tsx`) and booking helpers (`reserve/shared/utils/booking.ts` vs `components/reserve/helpers.ts`).
- Snapshot WAI-ARIA APG availability via `curl -I https://www.w3.org/WAI/ARIA/apg/patterns/` to validate accessibility references remain current.
- Cross-checked logic using two independent implementations when possible (e.g., `useReservationWizard` store vs `components/reserve/booking-flow/index.tsx`).

## Component Analysis

### Reserve Wizard (React Router app under `reserve/`)

- **`ReservationWizard.tsx`** orchestrates step switching and sticky footer coordination. Relies on `useReservationWizard` for state, leading to tight coupling between layout and state logic (difficult to reuse just UI shell).
- **`PlanStep.tsx` + `PlanStepForm.tsx` (~319 lines)** blend presentation, form wiring, analytics, and action registration. Form logic (`usePlanStepFormLogic`) handles store syncing, local form, analytics, and action dispatch making SRP violations. Several sub-components exist but time slot logic and effect-driven `onActionsChange` remain inline.
- **`DetailsStep.tsx` (378 lines)**: Houses validation, analytics, store syncing, and full JSX for contact, preference, and agreement sections. Repeats patterns for controlled inputs and checkboxes. Resets store via `useEffect`, which could live in a custom hook.
- **`ReviewStep.tsx` (154 lines)** and **`ConfirmationStep.tsx` (339 lines)**: heavy on conditional copy, analytics, and generated actions. `ConfirmationStep` handles ICS generation, navigator APIs, and feedback state—all in one file.
- **Shared Layout (`WizardLayout.tsx`, `WizardFooter.tsx`, `WizardProgress.tsx`)**: Purpose-built for wizard but entangled with specific action shape and step summary structure.

### Dashboard (Next.js app)

- **`app/(authed)/dashboard/page.tsx`**: Local state for filters & dialog control; passes to `BookingsTable`. Could be split into view-model hook.
- **`BookingsTable.tsx` (205 lines)**: Contains formatting helpers, status filter UI, skeleton rendering, empty state, actionable rows, and pagination. Opportunity to extract header/filter bar, row renderer, or skeleton components.
- **Dialogs**: `EditBookingDialog.tsx` (196 lines) mixes schema, analytics, mutation handling, and render. `CancelBookingDialog.tsx` (82 lines) more focused; shares error messaging style with edit dialog but implemented separately.
- **`ReservationDetailClient.tsx` (284 lines)**: Multi-concern component (data formatting, warnings, analytics, dialogs). Reimplements summary formatting already present in reserve helpers.

### Cross-App Duplication

- Next.js `components/reserve/booking-flow/index.tsx` re-implements wizard orchestration using same reducer exported from `@features/reservations`. Contains duplicated effects for sticky footer, haptic triggers, remembered contacts, and submission pipeline (with raw `fetch`). Maintains separate helpers (`components/reserve/helpers.ts`) duplicating booking utilities.
- Shared UI primitives duplicated verbatim between `reserve/shared/ui` and root `components/ui` modules (buttons, forms, inputs, etc.), differing only in import paths/quotes.

## State Management Observations

- **Reserve Wizard**: Centralized `useWizardStore` (React `useReducer`). Steps pull store actions directly; colocation mostly good but effects in components (`DetailsStep`, `PlanStepForm`) mutate store on every change, causing potential re-renders. `useReservationWizard` composes store with React Query mutation; handles sticky footer state, nav, analytics.
- **Remembered Contacts**: `useRememberedContacts` handles localStorage hydration/persistence but runs for every render (no guard for SSR). Duplicate logic exists in Next `booking-flow`.
- **React Query Usage**: `useCreateReservation`, `useReservation`, `useBookings`, `useCancelBooking`, `useUpdateBooking` rely on consistent key structures but scatter `queryKeys` across `@shared` vs `@/lib/query`. Opportunities for shared query layer.
- **Dashboard Page State**: Filters and pagination state local (`useState`). Derived `queryFilters` memoized; but resetting `page` when filters change done via effectful callbacks. Could move into a reducer or dedicated hook for testability.
- **Redundant State**: `ReservationDetailClient` reconstructs `BookingDTO` despite existing normalization logic; duplicates formatting utilities.

## Hook Analysis

- **Custom Hook Opportunities**:
  - Form-store synchronisation in `PlanStepForm` and `DetailsStep` nearly identical (set store, update actions, focus first error). Candidate for `useWizardStepForm` abstraction.
  - Action registration (`onActionsChange([...])`) repeated across steps; could be `useWizardActions` hook returning stable callbacks and automatically cleaning up.
  - Date/time formatting logic repeated (`BookingsTable`, `ReservationDetailClient`, `bookingHelpers`); hook like `useLocalizedDateTime` or reuse helper.
- **Rules of Hooks**: No violations spotted; hooks only called conditionally in allowed contexts.
- **Effect Cleanup**: Some effects (e.g., `usePlanStepFormLogic` action registration) rely on setting actions but never cleaning when component unmounts; but parent resets on step change. Consider returning cleanup to avoid stale actions when wizard reused elsewhere.
- **`useStickyProgress`**: Always returns `shouldShow: true`; ignores computed intersection state (`anchorVisible`). Next `booking-flow` relies on same hook, so sticky visibility logic effectively disabled; needs review.

## Styling & Tailwind Patterns

- Shared button/form components replicate exact Tailwind class combos in two locations. Introduce single source + tokens.
- Repeated layout classes across steps (`rounded-xl border border-srx-border-subtle bg-white/95 p-5 shadow-sm`). Candidate for `Panel` component or Tailwind preset via `cva`.
- Dashboard uses DaisyUI classes (`bg-base-100`, `text-base-content`) while reserve uses custom tokens (`text-srx-ink-strong`). Need consistent design tokens or theme adapters.
- Inline `className` strings encode responsive logic (e.g., `WizardLayout` main container). Should codify via design tokens or layout primitives.
- Loading skeleton classes repeated; consider `SkeletonSection` component.

## Code Structure & Coupling

- Dual app paths (`reserve/` SPA and Next `components/reserve`) share code via module alias (`@features/...`) but still duplicate wrappers, utilities, and config references. Need single source-of-truth for wizard domain.
- Lack of barrel exports in some shared dirs (e.g., `reserve/shared/ui` has direct file imports; root `components/ui` similar). Could use aggregated exports for atoms/molecules.
- Feature-sliced approach inside `reserve` (entities/features/shared) vs monolithic `components/` in Next creates conceptual drift.
- Context/Provider separation: Next `app/providers.tsx` vs `reserve/app/providers.tsx` not aligned—should evaluate for shared provider shell.
- Potential circular dependency risk minimal but watch for `@features/...` referencing `@shared/ui` that import back into features (none observed yet).

## Identified Pain Points & Opportunities

1. **Monolithic Step Components**: Need splitting by responsibility (UI vs state vs side effects). Introduce hooks for form wiring, components for card layouts.
2. **Duplicated UI Libraries**: Unify `components/ui` and `reserve/shared/ui` via atomic structure; create shared package/distribution.
3. **Booking Helpers Duplication**: Consolidate `bookingHelpers` and ensure Next-only pieces reference shared util.
4. **Action Bar Pattern**: Extract sticky footer action registration into context/hook to avoid manual `onActionsChange` arrays.
5. **Date/Time Formatting**: Provide shared formatter utilities (maybe in `@/utils/datetime`) consumed by both dashboard and reserve.
6. **Analytics & Tracking**: Scattered `track`/`emit` usage inline; consider event emitter hook or service to centralize.
7. **Accessibility**: Need to ensure key components follow APG patterns (tabs, tables); `BookingsTable` uses `<table>` with `role="grid"` but lacks `<caption>`. Wizard buttons require `aria-live` maybe more consistent.
8. **State Sync Performance**: Frequent store updates on every keystroke may trigger re-renders; consider debounced or local state aggregator, or context selectors.
9. **Error Handling Consistency**: `EditBookingDialog` and `CancelBookingDialog` build error copy separately; unify via error utility.
10. **Config & Tokens**: DaisyUI vs custom tokens highlight need for theming plan.

## Existing Assets Worth Reusing

- `useWizardStore`, `buildReservationDraft`, `reservationAdapter` provide solid domain boundaries.
- `WizardLayout`/`WizardFooter` already align with atomic layering (template/organism). With decoupled action control they can become reusable.
- React Query query key factories exist in both `@shared/api/queryKeys` and `@/lib/query/keys`; pick one canonical location.
- `components/dashboard` dialogs already use `@/components/ui` primitives; after modularization they can move into `organisms` or `molecules`.

## Uncertainties / Further Data Needed

- Current adoption status of `NEXT_PUBLIC_RESERVE_V2`. Need product input to decide deprecating legacy `BookingFlowPage` or merging with `ReserveApp`.
- DaisyUI vs custom token direction—confirm design system choice before refactoring classes.
- Extent of other routes in `/dashboard` and `/reserve` not yet reviewed (e.g., other profile pages) to ensure architecture scales.
- Test coverage expectations: existing Vitest tests under `reserve/tests` target old components; need to know if Next pages require Playwright coverage.
