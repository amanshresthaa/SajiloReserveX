# Research: Instant Closed-Days Marking in Picker

## Existing Patterns & Reuse

- Booking date picker (`src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`) builds disabled-day map using pre-fetched per-date schedules via `getDisabledDays` from `reserve/shared/schedule/availability.ts`.
- Schedules are fetched one day at a time (`/api/restaurants/[slug]/schedule?date=YYYY-MM-DD`). Month prefetch currently only loads the first day of the month.
- Server has schedule computation in `server/restaurants/schedule.ts`, and operating-hours snapshot in `server/restaurants/operatingHours.ts` (weekly hours and dated overrides).

## External Resources

- Supabase tables: `restaurants`, `restaurant_operating_hours`, `restaurant_service_periods`.
- Luxon for timezone-aware day-of-week resolution and date operations.

## Constraints & Risks

- Public booking UI should not depend on ops/owner routes; add a read-only public API.
- We only need “closed” days instantly. Computing “no-slots” requires full schedule/slots and capacity checks; out of scope for instant response.
- Must respect restaurant timezone when deriving day-of-week and default month.

## Open Questions (and answers if resolved)

- Q: Do we need service periods to know if a day is closed?
  A: No. Closed is determined from operating hours (weekly row or dated override).

- Q: What range to fetch for the calendar?
  A: Use month start→end; good enough for instant closed-day marking. Could expand to the rendered grid if needed.

## Recommended Direction (with rationale)

- Add API: `GET /api/restaurants/[slug]/closed-days?start=YYYY-MM-DD&end=YYYY-MM-DD` that returns `{ timezone, closed: string[] }`.
  - Fast: 2 lightweight queries (weekly hours + overrides in range), O(range) iteration in memory.
- Update picker to prefetch closed days for the visible month and merge into the existing disabled-day map so closed days appear instantly.
