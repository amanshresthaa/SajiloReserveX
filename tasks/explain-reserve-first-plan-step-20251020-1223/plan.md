# Implementation Plan: Explain First Plan Step for /reserve

## Objective

We will explain the logic behind the first plan step within the `/reserve` flow so that stakeholders understand its behavior.

## Success Criteria

- [x] Identify the code path implementing the first plan step
- [x] Provide a clear explanation referencing relevant files and logic
- [x] Surface reservation interval & default duration in Ops settings UI
- [x] Persist cadence edits via ops API without manual DB changes

## Architecture & Components

- `BookingWizard` (reserve/features/reservations/wizard/ui/BookingWizard.tsx) orchestrates step rendering and passes wizard state/actions.
- `PlanStep` (reserve/features/reservations/wizard/ui/steps/PlanStep.tsx) handles layout, alerts, and injects `PlanStepForm`.
- `PlanStepForm` (reserve/features/reservations/wizard/ui/steps/plan-step/PlanStepForm.tsx) renders calendar, party selector, occasion, notes UI.
- `usePlanStepForm` currently centralizes form state, schedule fetching, availability, and action registration; we will split this into composable hooks (state management vs availability) to improve maintainability.
- Ops settings leverage `RestaurantProfileSection` → `RestaurantDetailsForm` and the ops restaurant API (`src/app/api/ops/restaurants/[id]/route.ts`) alongside `server/restaurants/update.ts`; these pieces need cadence field support end-to-end.

## Data Flow & API Contracts

Endpoint: `fetchReservationSchedule` (reserve/features/reservations/wizard/services/schedule.ts) queried via React Query.
Request: `{ slug: string; date: string }` (implicit via function signature).
Response: `{ date, isClosed, slots[], window, defaultDurationMinutes }`.
Errors: network/service failures trigger console warnings (non-prod) and keep form usable without availability insights.

## UI/UX States

- Loading: Skeleton steps shown while wizard state loads; `PlanStepSkeleton` specifically for step 1.
- Error: `PlanStep` surfaces `planAlert` or `state.error` via destructive `Alert`.
- Unavailable Date: Warning alert plus inline message in calendar when closed or fully booked.
- Success: Valid selections enable `Continue` sticky action to advance to details.

## Edge Cases

- Missing fallback time triggers clearing of time field.
- Closed or full dates revert to last valid date and focus errors.
- Offline mode handled higher up (`WizardOfflineBanner`), but plan step respects disabled actions when offline alert present.
- Need to ensure timezone-aware minimum dates; will replace client-local midnight with first valid date derived from schedule/timezone to align with DB data.
- Ops cadence inputs must validate numeric ranges (interval 1–180, duration 15–300) and prevent null submissions to satisfy DB constraints.

## Testing Strategy

- Not applicable (explanation only)

## Rollout

- Not applicable
