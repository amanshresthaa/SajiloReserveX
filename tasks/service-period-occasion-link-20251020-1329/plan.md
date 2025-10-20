# Implementation Plan: Link Service Periods and Occasions

## Objective

We will ensure restaurant-configured service periods directly control customer-facing occasion options so that guests only see and select experiences the venue actually offers for the selected date.

## Success Criteria

- [ ] Schedule API exposes which booking options are available for a date, derived from that day’s service periods.
- [ ] Occasion picker disables options when no matching service period exists, and E2E/unit coverage reflects the new linkage.

## Architecture & Components

- `server/restaurants/schedule.ts`: refine slot availability calculations and append `availableBookingOptions` (sorted `BookingOption[]`) to the schedule payload.
- `reserve/features/reservations/wizard/services/timeSlots.ts`: extend `ReservationSchedule` type, surface `availableBookingOptions`, and expose it through the hook.
- `reserve/features/reservations/wizard/ui/steps/plan-step/OccasionPicker.tsx` / `PlanStepForm.tsx`: derive toggle enabled-state from the new availability data while keeping existing UX structure.
  State: react-query `useTimeSlots` cache carries the richer schedule model | Routing/URL state: unchanged (still in wizard reducer).

## Data Flow & API Contracts

Endpoint: `GET /restaurants/[slug]/schedule`  
Request: `{ date?: string (yyyy-mm-dd) }`  
Response: `{ …, slots: TimeSlot[], availableBookingOptions: BookingOption[] }`  
Errors: `{ error: string, details?: unknown }` (unchanged)

## UI/UX States

- Loading: Spinner/disabled form unchanged.
- Empty: Closed-day messaging still shown when `slots.length === 0`.
- Error: Existing fetch error state reused.
- Success: Occasion toggles reflect true availability (disabled buttons when unavailable).

## Edge Cases

- Restaurants with no service periods (all toggles disabled, no slots).
- All-day service periods (`day_of_week = null`) still respected.
- Mixed days where only drinks or dinner exists; ensure correct toggle state across time-slot selections.
- Schedules returning from cache after config change (stale data must be invalidated via existing queries).

## Testing Strategy

- Unit: add coverage around `buildAvailability`/schedule helpers; update hook/component tests to assert new disabled states.
- Integration: adjust API route tests to validate `availableBookingOptions`.
- E2E: consider adding Playwright follow-up if time permits; otherwise document in `verification.md`.
- Accessibility: confirm disabled toggles maintain focusability semantics (handled by `ToggleGroupItem`).

## Rollout

- Feature flag: none (ship-wide behaviour change).
- Exposure: deploy immediately once verified; no gradual rollout.
- Monitoring: rely on booking funnel metrics and error logs for regressions.
