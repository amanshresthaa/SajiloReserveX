# Research: Calendar Parity for My Bookings Edit Dialog

## Existing Patterns & Reuse

- `PlanStepForm` (reserve/features/reservations/wizard/ui/steps/plan-step/PlanStepForm.tsx:64-147) injects an `isDateUnavailable` callback plus `unavailableMessage` into `Calendar24Field`, drawn from the `usePlanStepForm` hook.
- `usePlanStepForm` (reserve/features/reservations/wizard/hooks/usePlanStepForm.ts:103-199) prefetches monthly schedules through `fetchReservationSchedule`, caching availability per date and returning a `unavailableDates` map and `currentUnavailabilityReason` value.
- `ScheduleAwareTimestampPicker` (src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx:7-360) reuses the same `Calendar24Field` plus time-slot grid for the edit flow, but only when the dialog receives a restaurant slug.
- `EditBookingDialog` (components/dashboard/EditBookingDialog.tsx:214-266) conditionally renders `ScheduleAwareTimestampPicker` when `restaurantSlug` is available; otherwise it falls back to the legacy `TimestampPicker` without availability awareness.

## External Resources

- Supabase bookings endpoint (`src/app/api/bookings/route.ts:758-824`) currently selects only restaurant name & interval; it omits slug/timezone, which prevents My Bookings edits from always providing the schedule-aware picker.
- Shared availability helpers (`@reserve/shared/schedule/availability`) already power both plan-step and schedule-aware picker paths—no new external APIs needed.

## Constraints & Risks

- Removing the fallback requires that every booking served to dashboards includes a `restaurantSlug` (and preferably timezone). Without that, edits would lose the ability to fetch schedules.
- Updating the API response changes the `BookingDTO` shape consumed across customer & ops dashboards; we must ensure every consumer tolerates the new fields.
- Supabase row-level security or joins might need adjustment to surface slug/timezone; must confirm fields exist and are allowed in the select.

## Open Questions (and answers if resolved)

- Q: Does the Supabase `restaurants` relation expose `slug` and `timezone` fields we can select?  
  A: Yes—other routes (e.g., ops listings) already read these columns, so we can extend the select here.
- Q: Do any dialogs rely on the legacy `TimestampPicker` beyond this fallback?  
  A: No—the component only renders in this branch; deleting it keeps ops/customer edit parity while still allowing the plain picker to exist for other features if needed.

## Recommended Direction (with rationale)

- Extend `/api/bookings?me=1` to return `restaurantId`, `restaurantSlug`, and `restaurantTimezone` for each booking so the dashboard has the data needed for availability-aware edits.
- Update `EditBookingDialog` to always render `ScheduleAwareTimestampPicker`, sourcing slug/timezone from the booking data (falling back to explicitly passed props for ops flows). Remove the legacy `TimestampPicker` branch.
- Add runtime guardrails (analytics/logging or disabled state) if slug is unexpectedly absent, ensuring we catch regressions rather than silently degrading.
