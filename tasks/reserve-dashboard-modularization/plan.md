# Implementation Plan — Reserve & Dashboard Modularization

## 1. Objectives & Guardrails

- Consolidate `reserve` wizard and Next.js dashboard into a modular architecture using atomic design (atoms → templates).
- Eliminate duplicated primitives/utilities (buttons, forms, booking helpers, wizard orchestration) by creating shared packages.
- Refactor oversized components (>200 lines) into smaller, single-responsibility units while preserving UX/accessibility requirements.
- Ensure state management remains predictable (React Query + wizard reducer) and avoid unnecessary re-renders.
- Maintain DaisyUI/custom token compatibility until design direction clarified; introduce adapters vs hard switches.

## 2. Target Architecture Overview

```
src/
├── components/
│   ├── atoms/
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── form/
│   │   └── … (badge, input, skeleton, toast)
│   ├── molecules/
│   │   ├── wizard/
│   │   │   ├── WizardProgress.tsx
│   │   │   └── StepActions.tsx
│   │   ├── dashboard/
│   │   │   ├── StatusFilterGroup.tsx
│   │   │   └── BookingRow.tsx
│   │   └── feedback/
│   ├── organisms/
│   │   ├── wizard/
│   │   │   ├── PlanStepView.tsx
│   │   │   ├── DetailsStepView.tsx
│   │   │   ├── ReviewStepView.tsx
│   │   │   └── ConfirmationStepView.tsx
│   │   └── dashboard/
│   │       ├── BookingsTable.tsx
│   │       └── ReservationDetail.tsx
│   ├── templates/
│   │   ├── WizardLayout.tsx
│   │   └── DashboardLayout.tsx
│   └── pages/
│       ├── ReserveWizardPage.tsx
│       └── DashboardBookingsPage.tsx
├── hooks/
│   ├── wizard/
│   │   ├── useWizardStore.ts
│   │   ├── useWizardStepActions.ts
│   │   └── useWizardFormSync.ts
│   └── dashboard/
│       ├── useBookingsTableState.ts
│       └── useReservationDetail.ts
├── utils/
│   ├── booking/
│   │   ├── bookingHelpers.ts
│   │   └── index.ts
│   ├── datetime.ts
│   └── analytics.ts
├── providers/
│   └── AppProviders.tsx
└── styles/
    └── tokens.css (future design token consolidation)
```

- Introduce `@/components/ui` barrel that re-exports atoms for both reserve and dashboard usage.
- Move duplicated helpers (`components/reserve/helpers.ts`, `reserve/shared/utils/booking.ts`) into unified `utils/booking` with browser-safe exports.
- Expose wizard layout/footers via `templates/wizard` to serve both Next and SPA context.

## 3. Refactor Roadmap

1. **Create shared primitives package**
   - Move `reserve/shared/ui/*` and `components/ui/*` into `src/components/atoms`.
   - Ensure imports updated; add barrel exports for backward compatibility via temporary re-export modules.
   - Verify Tree-shaking and theming compatibility.
2. **Unify booking utilities**
   - Merge helpers into `utils/booking/bookingHelpers.ts`; provide named exports for formatting, service windows, storage keys.
   - Update wizard and dashboard imports; delete duplicated files.
3. **Wizard state & hooks extraction**
   - Extract shared logic from `PlanStepForm`, `DetailsStep`, `ReviewStep`, `ConfirmationStep` into dedicated hooks:
     - `useWizardFormSync` handles `updateDetails`, `form.reset`, and error focusing.
     - `useWizardActions` manages `onActionsChange` registration and cleanup.
   - Move ICS/calendar + wallet actions into separate helpers to reduce JSX complexity.
4. **Component decomposition**
   - Split each large wizard step into view component (pure JSX) + hook/controller.
   - Factor repeated card sections (`SectionCard` molecule) for consistent styling.
   - For dashboard: break `BookingsTable` into `BookingsHeader`, `BookingsBody`, `BookingsPagination` molecules; convert inline formatters to shared utility.
   - Refactor `EditBookingDialog` to isolate schema & mutation logic in `useEditBooking` hook.
5. **Orchestration alignment**
   - Replace Next.js `components/reserve/booking-flow` with shared wizard page using unified hooks (avoid duplicate reducer wiring).
   - Ensure `ReserveApp` SPA consumes same components via alias to maintain backwards compatibility.
6. **State management cleanup**
   - Introduce `useBookingsTableState` to centralize filter/page state, used by dashboard page.
   - Evaluate `useStickyProgress` to respect intersection observer visibility; update to return `shouldShow` derived from state.
7. **Styling tokens & variants**
   - Codify common containers (rounded card w/ border) as `Panel` atom or `cardVariants` using cVA.
   - Document DaisyUI vs SRX token strategy; create theme adapter so cross-app components can map tokens correctly.
8. **Testing & verification**
   - Update existing Vitest tests (`reserve/tests`) to reference new module paths.
   - Add unit tests for new hooks (`useWizardFormSync`, `useWizardActions`), plus formatting utilities.
   - Smoke test Next pages (Playwright/React Testing Library) for regression coverage of wizard/dashboard flows.
9. **Migration strategy**
   - Provide codemod or documented import map for consumers migrating from old paths to new atomic structure.
   - Stage rollout: primitives → utilities → wizard refactor → dashboard refactor to reduce breakage.

## 4. Key Deliverables

- Unified atomic design folder tree with barrels.
- Modular wizard and dashboard components, each under 200 lines.
- Shared hooks/utilities for booking logic and action orchestration.
- Updated styling system using reusable class compositions.
- Comprehensive migration guide + best practices doc (to be produced after implementation).

## 5. Risks & Mitigations

- **Breaking imports**: Provide temporary re-export files and codemod instructions; update tsconfig paths.
- **Behavior regressions**: Maintain existing hook signatures; add tests + manual QA scripts (wizard happy path, calendar share, edit/cancel booking).
- **Styling inconsistencies**: Introduce design tokens gradually; snapshot visual differences using Storybook/Chromatic if available.
- **Performance hits**: Ensure hooks memoize computations; use React.memo for row components.
- **Shared state drift**: Document ownership of store/actions in new hooks; avoid cross-app implicit dependencies.

## 6. Open Questions / Follow-ups

- Confirm long-term plan for DaisyUI vs SRX custom tokens (impacts theming adapter scope).
- Decide fate of legacy SPA under `reserve/` once unified components ship (deprecation timeline?).
- Determine testing expectations (CI gating for Next pages?).
- Clarify analytics API consolidation (currently `track` vs `emit`).
