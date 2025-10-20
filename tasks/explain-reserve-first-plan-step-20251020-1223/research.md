# Research: Explain First Plan Step for /reserve

## Existing Patterns & Reuse

- Reservation wizard follows a multi-step flow managed by `useReservationWizard` (`reserve/features/reservations/wizard/hooks/useReservationWizard.ts`).
- The first step is implemented by the `PlanStep` component which wraps `PlanStepForm` (`reserve/features/reservations/wizard/ui/steps/PlanStep.tsx`).
- Form state and side effects live in the `usePlanStepForm` hook (`reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`), which leans on React Hook Form, React Query, and shared scheduling utilities.
- UI widgets (calendar, time grid, party picker, notes) reuse shared Shadcn-based components from `reserve/features/reservations/wizard/ui/steps/plan-step/components`.
- Ops “Restaurant Settings” view is composed of `RestaurantProfileSection`, `OperatingHoursSection`, and `ServicePeriodsSection` (`src/components/features/restaurant-settings`). Profile form delegates to `RestaurantDetailsForm` (`components/ops/restaurants/RestaurantDetailsForm.tsx`) which talks to `useOpsRestaurantDetails`/`useOpsUpdateRestaurantDetails`.
- The ops API PATCH handler (`src/app/api/ops/restaurants/[id]/route.ts`) invokes `updateRestaurant` (`server/restaurants/update.ts`); both currently accept profile/contact fields but omit reservation cadence columns (`reservation_interval_minutes`, `reservation_default_duration_minutes`).

## External Resources

- [react-hook-form](https://react-hook-form.com/) – for form management referenced via `useForm`.
- [@tanstack/react-query](https://tanstack.com/query) – powers schedule prefetching via `useQueryClient`.

## Constraints & Risks

- Plan step depends on `state.details.restaurantSlug`; without it, schedule prefetching skips.
- Availability and slot data come from asynchronous services; failures degrade gracefully but may limit user guidance.
- Form validity gate keeps progression; incorrect assumptions could misdescribe behavior.
- Ops settings must surface DB-backed cadence fields so staff can adjust without manual SQL; API validation has to enforce DB constraints (interval ≤180, duration between 15–300) to avoid constraint errors.

## Open Questions (and answers if resolved)

- Q: What constitutes the "First Plan step"?
  A: The initial step (step index `1`) in the booking wizard, rendered by `PlanStep`, where users choose date/time/party/occasion before moving to details.
- Q: Do current Ops components expose reservation interval/default duration?
  A: No; `RestaurantDetailsForm` lacks controls and the API schema/types omit those fields.

## Recommended Direction (with rationale)

- Document how `PlanStep` orchestrates UI and relies on `usePlanStepForm` for data fetching, validation, and action wiring. Focus explanation on key flows: state initialization, availability handling, schedule prefetch, and submission logic.
- Extend Ops profile schema/route/services to include `reservationIntervalMinutes` and `reservationDefaultDurationMinutes`, then add validated inputs to `RestaurantDetailsForm` so admins can edit cadence safely from the UI.
