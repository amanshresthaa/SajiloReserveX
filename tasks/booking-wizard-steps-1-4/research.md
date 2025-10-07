# Research — Booking Wizard Steps 1–4

## Scope + Sources

- Focused on reservation wizard flow under `reserve/features/reservations/wizard`.
- Cross-referenced routing/bootstrap (`reserve/pages/WizardPage.tsx`, `reserve/app/routes.tsx`, `app/reserve/page.tsx`) to confirm SPA wiring.
- Mapped hooks, reducer, DI, and API usage by reading associated files plus fixtures/tests in `reserve/tests/features/wizard` and `tests/fixtures/wizard.ts`.
- Verified UI patterns inside `reserve/features/reservations/wizard/ui` (steps, layout, sticky footer) and shared components in `@shared/ui`.
- Checked analytics + side-effects via DI (`reserve/features/reservations/wizard/di`) and analytics tests.

## Wizard Shell + Routing

- Next.js route `/reserve` immediately redirects to `/` (or `/?query`) ensuring the wizard runs inside the React Router SPA defined under `reserve/app/routes.tsx`.
- `WizardPage` lazily loads `ReservationWizard` which wraps `BookingWizard` with a dependency provider that supplies router navigation (React Router `useNavigate` adapter).
- `BookingWizard` chooses step components 1–4 and renders sticky footer/confirmation variants driven by `useReservationWizard`.

## State Management & Flow Control

- `useWizardStore` wraps a reducer (`reducer.ts`) with initial state seeded via `getInitialDetails`. Keys include `step`, `details`, `bookings`, `lastConfirmed`, `editingId`, error/submitting flags.
- `useReservationWizard` composes store actions with:
  - Sticky progress controller (`useStickyProgress`, `WizardFooter`, `WizardStickyConfirmation`).
  - Selection summary builder (`createSelectionSummary`) for progress UI + SR labels.
  - Mutation pipeline `useCreateReservation` (TanStack Query) with idempotency key and optimistic cache invalidation.
  - Analytics/haptics/errorReporter/navigator pulled from DI context.
- Step transitions rely on `actions.goToStep`, `actions.updateDetails`, and `actions.applyConfirmation` which sets step 4 + populates `lastConfirmed`.

## Step Implementations

- **Plan (Step 1)** `PlanStep` → `PlanStepForm`.
  - `usePlanStepForm` (react-hook-form + zod) manages fields: date, time, party, bookingType, notes. Provides `handlers` for date/time, party increments, occasion selection, notes updates.
  - Integrates `useTimeSlots` to supply suggestion datalist and service availability for occasion picker.
  - Sticky actions: single `plan-continue` button disabled until form valid; autop focus first error.
  - Analytics hooks (`select_date`, `select_time`, `select_party`).
  - UI pieces reuse shadcn-like components (`Calendar`, `ToggleGroup`, `Button`, `Accordion`) from `@shared/ui`.
- **Details (Step 2)** `DetailsStep` with `useDetailsStepForm`.
  - Validates via zod, normalizes bool defaults, trims inputs on submit, auto-focuses first invalid field.
  - Reuses plan-state updates via `actions.updateDetails`.
  - Tracks analytics event `details_submit` with dependency-provided tracker.
  - Accordion auto-opens preferences section when `agree` error surfaces; inline Alert for errors.
- **Review (Step 3)** `ReviewStep` using `useReviewStep`.
  - Builds summary/party text/time formatting using shared formatting utils.
  - On mount, tracks `confirm_open`.
  - Sticky actions: `review-edit` (back to step 1) and `review-confirm` calling injected `onConfirm`; label switches to “Processing…” when submitting.
- **Confirmation (Step 4)** `ConfirmationStep` with `useConfirmationStep`.
  - Derives final booking/venue info and status text (“confirmed” vs “updated”).
  - Handles calendar download (`downloadCalendarEvent`) + wallet sharing (`shareReservationDetails`) with loading states, DI error reporting, and feedback Alerts (`showFeedback`, `dismissFeedback`).
  - Sticky confirmation bar offers close/calendar/wallet/new actions, all wired through `onActionsChange`.

## Analytics, Haptics, DI

- DI context (`WizardDependenciesProvider`) merges default analytics, haptics, navigator, error reporter with overrides.
- Steps request trackers via props or DI; tests inject fakes through provider.
- Haptics triggered on step changes and sticky bar entry (`useReservationWizard` effect).
- Navigator default uses `window.location`, replaced in SSR by router adapter.

## Validation & Schemas

- Schemas in `model/schemas.ts` (zod) enforce date/time/party/email/phone/notes limits. Plan step ensures date/time future-sensible; details enforce phone/email format. (Need to revisit for locale-specific validation if scope expands.)

## API & Optimistic Behaviour

- `useCreateReservation` uses TanStack `useMutation` with idempotency key ref to avoid double submissions, invalidates reservation queries, seeds cache with new booking detail.
- Reducer `SET_CONFIRMATION` updates step, details, `lastConfirmed`, and resets submitting flags—gives optimistic UI because state flips to step 4 immediately on success; errors captured + surfaced via `actions.setError`.
- `buildReservationDraft`/`reservationToApiBooking` handle transformation; errors mapped via `mapErrorToMessage`.

## Persistence & Side Effects

- `useRememberedContacts` hydrates/saves contact info in localStorage respecting `rememberDetails` toggle and catching JSON/storage errors via errorReporter.
- Confirmation share helpers rely on `DEFAULT_VENUE` fallback when restaurant metadata missing.

## Testing Patterns

- Vitest unit coverage lives in `reserve/tests/features/wizard` and component-level tests under `.../ui/steps/.../__tests__`.
  - `plan-step-form.analytics.test.tsx`, `details-step.analytics.test.tsx`, `review-step.analytics.test.tsx` assert analytics integration.
  - `PlanStepForm.test.tsx` covers UI handlers, sticky actions, submission path.
- Fixtures in `tests/fixtures/wizard.ts` provide `wizardStateFixture`, `wizardDetailsFixture`, `apiBookingFixture`, enabling predictable defaults.
- No Playwright flow present yet (checkbox still open in TODO).

## Accessibility & UX Hooks

- Mobile-first classes (`clamp` fonts, responsive grids) and safe-area handling in layout/sticky bars.
- Components use aria attributes (`aria-live`, `aria-invalid`, `aria-current`, datalist, sr-only announcements).
- Buttons keep original label when loading per requirements; sticky actions disable only when necessary.
- Form placeholders and descriptions align with spec (examples, ellipsis).
- Focus management: forms call `setFocus` on first error; details accordion reveals preference errors automatically.

## Open Items / Uncertainties

- Analytics catalog exists but external definitions not yet documented here (user confirmed “Yes” but location unspecified); likely under `@shared/lib/analytics`.
- Preferred data-layer spec (question 3) unresolved—currently built on TanStack Query, assume continue unless told otherwise.
- External availability/payment integrations (question 4) still unknown; current implementation relies on local slot builder (`timeSlots.ts`). Need confirmation if/when to swap with live API.
- Design system breakpoints/grid tokens (question 5) unclear; present implementation uses tailwind classes and `@shared/ui` patterns. Verify alignment with product design if changes requested.

## Potential Risks / Follow-ups

- Need to ensure SSR compatibility for localStorage access (guards present). Verify `window` existence across all code paths before Next SSR.
- Mutation error handling currently sets `state.error` but no UI snippet referenced in research; confirm error surfacing location (likely within `WizardFooter` or step components).
- Calendar/wallet share functions depend on browser APIs; confirm polyfills for unsupported browsers or add fallbacks.
