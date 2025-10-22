# Research: Booking Time Interval Bug

## Existing Patterns & Reuse

- `TimestampPicker` (`src/components/features/booking-state-machine/TimestampPicker.tsx`) renders a native `input type="time"` with `step={60}`. This enables any minute value, so the Edit Booking dialog accepts :40, :22, etc.
- Server route `src/app/api/bookings/[id]/route.ts` → `processDashboardUpdate` skips `assertBookingWithinOperatingWindow` unless the feature flag `FEATURE_BOOKING_VALIDATION_UNIFIED` is on. With the flag off (default), updates flow straight to `updateBookingRecord`, so the API persists off-interval times.
- `getRestaurantSchedule` already returns `intervalMinutes` and slot listings based on Reserve data; other create/update flows (full PUT, POST) rely on these slots plus `assertBookingWithinOperatingWindow` to enforce increments.

## External Resources

- Reserve config defaults (`reserve/shared/config/reservations.ts`) show the canonical interval (`opening.intervalMinutes`, default 15).
- Server validation helper (`server/bookings/timeValidation.ts`) exposes `assertBookingWithinOperatingWindow`, which enforces slot alignment and is already battle-tested in other flows.

## Constraints & Risks

- Dashboard edit path must keep working for restaurants whose interval is not 15 (schema allows 1–180). Hard-coding :15 increments would break venues with custom cadence.
- Server currently allows out-of-band times; fixing only the client would not protect other callers (API, future integrations). Need back-end guard to avoid dirty data.
- Feature flag `FEATURE_BOOKING_VALIDATION_UNIFIED` is presently false locally; we cannot rely on flag flip without coordination/documented rollout.

## Open Questions (and answers if resolved)

- Q: Can we read the active interval per restaurant during edit?  
  A: Yes. `processDashboardUpdate` already fetches `getRestaurantSchedule`, which includes `intervalMinutes` and the list of valid slots.
- Q: Does Reserve expose utilities to snap to the nearest slot?  
  A: Not directly, but `assertBookingWithinOperatingWindow` fails fast if the provided time is not one of the available slots, so we can reuse it.

## Recommended Direction (with rationale)

- Enforce slot alignment server-side in `processDashboardUpdate` whenever the start time changes by reusing `assertBookingWithinOperatingWindow` (or the validation service when the flag is off). This keeps logic consistent with `/reserve` flows.
- Update `TimestampPicker` usage in the Edit Booking dialog to respect the restaurant’s configured interval (set `step` to `intervalMinutes * 60` and surface validation feedback) so the UI prevents invalid entries before submission.
