# Notes — S3 PlanStep Refactor

- `PlanStep` now delegates to `PlanStepForm` (<80 LOC) with analytics injected via `onTrack`; booking form logic consolidated in `PlanStepForm` while UI fragments live under `plan-step/components/`.
- Extracted components meet hook/LOC limits: `DateField`, `PartySizeField`, `NotesField`, `TimeSlotGrid`, and `OccasionPicker` each use ≤2 hooks and are well under 120 LOC.
- Storybook configured under `reserve/.storybook` with Vite builder. Interaction stories added for `PlanStepForm`, `TimeSlotGrid`, and `OccasionPicker` using play functions (leveraging `@storybook/test`).
- Storybook install currently emits peer warnings because the repo runs Vite 7.1.x while Storybook 8.6 expects ≤6; stories compile locally but we should monitor upstream support or pin an older Vite for Storybook if issues arise.
- `PlanStepForm` still centralises complex handlers; consider extracting a dedicated hook (e.g., `usePlanStepFormLogic`) into its own file if further reuse/testing is required.
