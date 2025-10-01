# Plan — Sprint S3 PlanStep Refactor

## 1. Objectives & Acceptance Criteria Recap

- Reduce `PlanStep.tsx` to <80 LOC and split responsibilities into:
  1. `PlanStepForm` (form state, validation logic, submission wiring).
  2. `TimeSlotGrid` (render + selection + tooltip behaviour).
  3. `OccasionPicker` (booking type toggle + status badges).
- Route analytics through props (`onTrack`), eliminating direct `track` imports in PlanStep and children.
- Simplify effects/hooks so each new child uses at most three hooks and avoids redundant date math.
- Produce Storybook stories with interaction tests for the new UI pieces.
- Maintain visual behaviour and step actions (parity with current implementation).

## 2. Architectural Approach

1. **Restructure files**
   - Create `reserve/features/reservations/wizard/ui/steps/plan-step/` directory housing `PlanStepForm.tsx`, `TimeSlotGrid.tsx`, `OccasionPicker.tsx`, plus `index.ts` for exports.
   - Keep existing `PlanStep.tsx` as entry point but slim it down to delegate into `PlanStepForm`.
2. **Component responsibilities**
   - `PlanStep.tsx`: Accept `onTrack?: (event: string, payload?: Record<string, unknown>) => void`, forward `state`, `actions`, `onActionsChange`, config, and analytics handler to `PlanStepForm`.
   - `PlanStepForm`: Own `useForm`, `useTimeSlots`, synchronise state with wizard store, and expose callbacks for selecting date/time/booking type. Compose `TimeSlotGrid` and `OccasionPicker` via props. Manage step action effect.
   - `TimeSlotGrid`: Receive slots array, selected time, loading/disabled states, and `onSelect` + `onTrack`. Handle tooltip hover state locally (max hooks: `useState`, `useMemo` optional).
   - `OccasionPicker`: Presentational; handle toggle interactions and badges using props; derived state via `serviceAvailability.labels`.
3. **Analytics**
   - Update PlanStep props and calling sites (`ReservationWizardContent`, `components/reserve/booking-flow/index.tsx`) to pass `track` as `onTrack`.
   - Inside `PlanStepForm`, wrap analytics invocation: `onTrack?.('select_time', payload)`.
4. **Storybook setup**
   - Introduce Storybook (React + Vite) under `reserve/.storybook/` with minimal config referencing new components.
   - Add scripts to `package.json` (e.g., `storybook`, `build-storybook`) and dependencies (`@storybook/react-vite`, `@storybook/testing-library`, `@storybook/addon-interactions`).
   - Create stories:
     - `PlanStepForm.stories.tsx` focusing on controlled states via knobs/args.
     - `TimeSlotGrid.stories.tsx` with interaction test (play function selects slot, asserts callback fired).
     - `OccasionPicker.stories.tsx` with interaction (toggle selection).
   - Use mock data derived from config and wizard state (create helper factory for state).
5. **Testing/Verification**
   - Update existing unit tests if necessary (likely minimal as store tests unaffected).
   - Add story interaction tests via Storybook `play` functions. Optionally complement with a Vitest snapshot/regression test if necessary.
   - Run `pnpm lint`, `pnpm test`, and document how to run `pnpm storybook` (smoke test optional if runtime allows).

## 3. Implementation Sequence

1. Scaffold new component directory and move relevant logic from `PlanStep.tsx` into `PlanStepForm`, `TimeSlotGrid`, `OccasionPicker` step by step (copy, refactor, then delete old blocks). Ensure each new component stays under 120 LOC.
2. Slim down `PlanStep.tsx` to orchestrator (<80 LOC).
3. Update type definitions and parent usages to include `onTrack` prop, and adjust analytics call sites.
4. Validate functionality manually (if possible) or via targeted render tests to ensure `onActionsChange` still receives correct data.
5. Introduce Storybook configuration and stories, ensuring interaction tests simulate slot selection and occasion toggling.
6. Final pass: run lint/tests, check file lengths, update task notes/todo.

## 4. Risks & Mitigations

- **Storybook overhead**: Introducing Storybook increases dependencies; plan for potential CI impact and document setup.
- **Form behaviour regression**: Ensure state sync (particularly reset effect and `onActionsChange` logic) remains intact by reusing existing helpers and writing quick render test if time permits.
- **Hook limits**: Audit each new component to confirm compliance (<3 hooks), restructure logic into helpers if needed.
- **Analytics coverage**: Guarantee both entry points pass `onTrack` to avoid undefined analytics during PlanStep usage.

## 5. Deliverables

- Refactored components + new files.
- Updated parent integrations with analytics prop.
- Storybook stories with interaction tests.
- Updated tasks checklist & notes documenting follow-up items.
