# Research: Reservation Time Validation

## Initial Requirements

- Prevent guests from selecting reservation times outside of a restaurant's published operating hours.
- Ensure validation occurs on the backend so requests via UI or API enforce the same rule.

## Success Criteria

- Identify existing booking/reservation services responsible for time validation.
- Document relevant data sources for operating hours.
- Outline constraints and edge cases that must be handled when validating requested reservation times.

## Existing Patterns

- `app/api/bookings/route.ts` handles POST `/api/bookings`; payload validation already exists but no schedule guard is applied before writing records.
- `server/restaurants/schedule.ts` resolves weekly and override operating hours, determines the open/close window for a date, and generates aligned slots using reservation intervals.
- Frontend availability uses `/api/restaurants/[slug]/schedule`, which reuses the same helper, ensuring UI slots are always within operating hours.
- Shared time utilities in `reserve/shared/time/time.ts` provide `normalizeTime`, `toMinutes`, and slot generation helpers consumed on both client and server.
- Booking end-time logic lives in `deriveEndTime` within `server/bookings.ts`, deriving the finish time based on inferred booking type.
- `useTimeSlots` hook leverages React Query to fetch the schedule for the active date, returning `slots`, `schedule`, and `serviceAvailability`, but does not expose a derived `hasAvailability` state.
- `Calendar24Field` disables suggestions whose `slot.disabled` flag is `true` but only prevents selecting dates before `minDate`; closed or fully booked days remain selectable.
- `usePlanStepForm` keeps the last chosen `time` even when a newly selected date has zero valid slots, so the wizard "Continue" CTA can remain enabled despite no availability.

## External Resources

- `server/restaurants/schedule.ts` for authoritative operating-hour calculations.
- `reserve/shared/time/time.ts` for normalization helpers.
- Supabase schema tables (`restaurant_operating_hours`, `restaurant_service_periods`) referenced in the schedule helper (see `supabase/create-database.sql`).

## Technical Constraints

- Operating-hour overrides take precedence over weekly defaults; validation has to consult the resolved schedule rather than assuming weekly rules.
- Restaurants configure `reservation_interval_minutes`, so accepted start times should align with generated slots, not arbitrary `HH:MM` values.
- Backend currently infers "lunch"/"dinner" booking types from the submitted time unless explicitly "drinks"; validation must preserve this flow.
- Route handlers should reuse the service Supabase client obtained via `getServiceSupabaseClient` to avoid redundant connections when fetching schedule data.
- Guests can call the API directly, so backend validation must block invalid requests even if the UI remains stricter.
- Calendar UX must keep closed dates inaccessible (e.g., Sundays/Mondays) while still allowing overrides (holidays) to be communicated; `react-day-picker` supports matcher arrays/functions for the `disabled` prop.
- React Hook Form errors determine `formState.isValid`; clearing the time field or setting a manual error will automatically disable the wizard action buttons.

## Open Questions

- Should we also reject bookings whose derived end time extends past `closes_at`, even if the start time is within hours? _(Resolved: reject to avoid overruns.)_
- Do we need to cross-check requested booking type against service periods (e.g., lunch vs dinner windows) or is open/close enforcement sufficient?
- What is the best caching strategy for disabled dates so we avoid repeatedly looking up the same closed day when a guest reopens the calendar?

## Recommendations

- During booking creation, load the restaurant schedule via `getRestaurantSchedule(restaurantId, { date, client: supabase })`.
- Reject requests when the restaurant is closed (`isClosed === true`) with a 400 response explaining the date is unavailable.
- Normalize the requested `time` and ensure it matches a computed slot; treat absence as an out-of-hours/invalid-time error.
- Optionally compare the derived end time to `closesAt` using `toMinutes` if the policy requires bookings to finish before closing.
- Return structured error payloads (e.g., `{ error: 'Outside operating hours' }`) so the frontend can surface actionable feedback.
- Extend plan-step state with a derived `hasAvailableSlots` flag, clear the selected time when false, and surface inline errors to block progression.
- Cache unavailable dates client-side (e.g., in a `Set`) and feed them into the calendar `disabled` matcher so previously rejected days become instantly blocked.
- Show a contextual alert explaining the closure/unavailability and guiding guests to pick a different date or time.

## Additional Findings (2025-10-11)

- Owner settings UI (`/ops/restaurant-settings`) loads operating hours/service periods where Supabase `time` columns resolve to `HH:MM:SS` strings (e.g., `"12:00:00"`).
- PUT `/api/owner/restaurants/[id]/hours` and `/service-periods` schemas only accept `HH:MM`, so saving untouched data fails with Zod regex errors.
- UI components (`OperatingHoursSection`, `ServicePeriodsSection`) echo the received values back to the API, re-submitting `HH:MM:SS` and triggering validation failures.
- Validation helpers in `server/restaurants/operatingHours.ts` and `server/restaurants/servicePeriods.ts` also enforce `HH:MM`, so even direct service calls reject the Supabase-returned format.
- Need a consistent normalization layer that accepts both `HH:MM` and `HH:MM:SS`, canonicalizes to `HH:MM`, and ensures UI payloads use the same representation.
