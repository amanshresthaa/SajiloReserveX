# Research — Sprint S1 Time-Slot Service

## 1. Task Outline & Subtask Decomposition

- **Primary objective**: Deliver S1 backlog item — extract a time-slot domain service under the wizard feature with pure helpers plus a memoized `useTimeSlots` hook, and reroute PlanStep to rely on it.
- **Initial subtasks (first pass)**:
  - Map existing time/slot logic across the codebase.
  - Identify configuration sources (open/close hours, intervals, labels) and check for competing definitions.
  - Investigate current consumers (PlanStep form, schema validation, helper utilities) to understand dependencies and side effects.
  - Confirm testing/Storybook infrastructure expectations for new modules/hooks.
- **Challenged revised subtasks** (after probing assumptions):
  1. _Extractable logic inventory_ — maybe logic already lives in `bookingHelpers`; verify if reusing vs duplicating is better than brand-new service.
  2. _Boundary behaviour catalogue_ — enumerate DST, weekend vs weekday, happy hour windows, default service inference; ensure service API supports these without UI context.
  3. _Integration constraints_ — assess PlanStep form sync, analytics triggers, wizard store coupling; ensure `useTimeSlots` change doesn’t break controlled form behaviour.
  4. _Test strategy viability_ — evaluate existing test harnesses (Vitest, React Testing Library) and gaps; confirm we can unit test pure helpers + hook without heavy mocking.

## 2. Existing Patterns & Code Survey

- **PlanStep monolith** (`reserve/features/reservations/wizard/ui/steps/PlanStep.tsx`):
  - Defines `RESERVATION_CONFIG`, `timeStringToMinutes`, `generateTimeSlots`, `getServiceAvailability`, `resolveDefaultService`, etc. UI memoizes `generateTimeSlots(date)` → used to render toggle grid. Client-only, duplicates booking utility logic.
  - Uses `bookingHelpers` for formatters (`formatTime`, `formatForDateInput`, `serviceWindows`). Hardcoded open/close/interval and slot labels.
- **Shared booking utils** (`reserve/shared/utils/booking.ts`):
  - Already exposes `normalizeTime`, `timeToMinutes`, `slotsForRange`, `serviceWindows`, `slotsByService`, `bookingTypeFromTime`. Similar logic to PlanStep but not exact (e.g., timezone pinned to Europe/London, returns string arrays vs richer slot metadata).
  - Additional responsibilities (formatting, validation) confirm “god util” smell — S4 will address split. For S1 we can leverage existing time primitives to avoid duplication, but they still reside in `bookingHelpers`; transitional strategy needed.
- **Legacy duplicates** (`components/reserve/helpers.ts`):
  - Mirror of shared booking helpers under legacy `components` tree. Confirms duplication problem extends beyond PlanStep; migration path should guard against reintroducing these helpers when reorganising modules.
- **Schema coupling** (`reserve/features/reservations/wizard/model/schemas.ts`):
  - Validation schema references `bookingHelpers` for phone/email; time validation uses regex only. No direct dependency on new service but PlanStep field updates must remain compatible.
- **Testing infrastructure**:
  - Vitest config (`reserve/vitest.config.ts`) and existing tests (e.g., `reserve/features/reservations/wizard/model/__tests__/store.test.ts`). There are no current tests for time-slot logic, meaning we’ll introduce new suites.
  - Storybook usage inferred from Sprint AC; need to confirm storybook setup exists (prior tasks indicate storybook snapshots standard). Further exploration pending in planning.

## 3. Verification Methods & Cross-Checks

- **Command-line cross-checks**:
  - `sed` slices of PlanStep and booking helpers to inspect actual implementations.
  - `rg` queries (`generateTimeSlots`, `slotsForRange`, `serviceWindows`, `intervalMinutes`) to confirm duplication points and absence of existing `useTimeSlots` implementations.
  - `find` for `services` directories verifying there is no current feature-level service precedent, implying we will be introducing the first under `wizard/services`.
- **Assumption stress tests**:
  - Considered whether `bookingHelpers.slotsForRange` alone could power UI; lacks metadata (labels, disabled states) needed for PlanStep grid, so we must design richer return type or layered transformation.
  - Checked for timezone inconsistencies — all slot math currently assumes London; new service should centralise this to avoid drift when S4 splits utilities.
  - Reviewed duplicates under `components/reserve/helpers.ts` to ensure migration plan handles both modern and legacy paths.

## 4. Dependencies, Integrations, and Constraints

- **Configuration coupling**:
  - `RESERVATION_CONFIG` only defined inside PlanStep. S2 will externalise config; S1 design should accept injected config to minimise rewrite. Note: `bookingHelpers.serviceWindows` already embeds similar timings; we must reconcile duplication or expose config to both helpers and new service.
- **State management**:
  - PlanStep form syncs with wizard store via `actions.updateDetails`. Slot selection triggers analytics via `track`. `useTimeSlots` must expose stable references (`useMemo` or custom hook memoization) to avoid unnecessary re-renders and maintain equality semantics for `useEffect` dependencies.
- **Accessibility & UI behaviour**:
  - The current grid uses tooltip states (`hoveredSlot`) and ensures `aria-live` updates; new service must keep derived data accessible (labels, state). Need to inspect grid rendering section during planning to understand shape requirements for new hook output.
- **Testing expectations**:
  - Need deterministic time computations for unit tests; must handle DST transitions (PlanStep currently doesn’t guard but AC demands boundary coverage). Might introduce helper to freeze timezone (e.g., `Temporal` polyfill or manual date creation) for tests.

## 5. Risks, Unknowns, and Alternative Perspectives

- **Risk: config divergence** — Without S2, service could still rely on hardcoded config. Mitigation: allow optional config parameter with sensible defaults; document handshake with upcoming config module.
- **Risk: weekend vs weekday logic** — Current `getSlotLabel` uses weekend heuristics; ensure service replicates or improves it. Need to confirm business logic accuracy by comparing with `bookingHelpers.serviceWindows`. Potential conflict if definitions diverge (PlanStep uses weekend lunch until 17:00, serviceWindows uses same). Double-check during implementation.
- **Risk: DST edge cases** — JS `Date` with local timezone may misbehave for transitions. Option to base computations on `Date.UTC` or `Temporal`; at minimum, tests should cover last Sunday in March/October to detect regressions.
- **Alternative approach consideration** — Instead of new `wizard/services` module, could enhance `bookingHelpers` now. But backlog splits responsibilities: S4 will decompose booking util; introducing service now avoids blocking S3 while still enabling future consolidation. Document this trade-off.
- **Unknowns** — Need to confirm Storybook environment path (likely `reserve/.storybook`); also confirm if there are existing analytics DI patterns (S7 will address). For S1, ensure `useTimeSlots` API leaves room for DI-friendly analytics (ex: no direct dependencies beyond config).

## 6. Next Steps Toward Planning

- Inspect PlanStep slot rendering code to understand required props (labels, disabled states, tooltips). Capture sample data shape to shape service return type.
- Examine whether any other components consume slot data (e.g., ReviewStep referencing `bookingHelpers`). Ensure new service doesn’t break them.
- Draft initial API sketches for `shared/time` helpers vs `wizard/services/timeSlots`. Determine how to expose London timezone constant.
- Enumerate unit test scenarios (weekday lunch, weekend dinner, happy hour disabling lunch/dinner, closed hours, DST boundary) to feed into planning.
