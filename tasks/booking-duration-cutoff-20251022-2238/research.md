# Research: Reservation Duration Cutoff

## Existing Patterns & Reuse

- `server/restaurants/schedule.ts` builds slot lists from opening/closing hours but does not account for booking length when marking slots available. Slots are only disabled when the service coverage map returns `disabled`.
- Booking length when creating reservations is derived from `booking_occasions.default_duration_minutes` via `calculateDurationMinutes` (`server/bookings.ts:213-233`), with restaurant-level fallback `reservation_default_duration_minutes`.
- Restaurants already have configurable `reservation_default_duration_minutes` exposed in Ops UI (`components/ops/restaurants/RestaurantDetailsForm.tsx`).
- The guest UI fetches schedules through `GET /api/restaurants/[slug]/schedule` which proxies `getRestaurantSchedule`. Hiding slots requires changes there so both guest and ops views benefit automatically.
- Error reporting to guests runs through `mapErrorToMessage` and wizard reducers; non-specific errors currently surface as “Unable to process booking”.

## External Resources

- Supabase schema migration `20251020140700_add_booking_occasions_catalog.sql` defining per-occasion durations.
- Supabase consolidated schema (`20251019102432_consolidated_schema.sql`) for `restaurants` table (use as reference for new column).

## Constraints & Risks

- Introducing a new restaurant config requires a Supabase migration and updates across server DTOs (`UpdateRestaurantInput`, API routes, generated types).
- Schedule generation and booking validation must stay in sync; otherwise the UI might hide slots the API still accepts (or vice versa).
- Need to respect environment rule: remote Supabase only—migration must be staged carefully.
- Guest wizard already handles generic errors; adding more granular handling must avoid regressions across other failure paths (capacity, rate limit, validation).

## Open Questions (and answers if resolved)

- Q: Should we reuse `reservation_default_duration_minutes` instead of adding a new setting?
  A: Not ideal—dinner duration remains 120 via occasions catalog, so reusing the existing default would still cause API/UI mismatch. A dedicated “last seating buffer” keeps intent explicit and can default to the longest occasion duration.
- Q: How should non-buffer rejections surface in the UI?
  A: Reuse the wizard error surface but differentiate messages (e.g., capacity vs. validation) using existing `mapErrorToMessage` plus additional mapping when validation response includes overrideable issues.

## Recommended Direction (with rationale)

- Add `reservation_last_seating_buffer_minutes` to `restaurants` (default `120`, editable in Ops). This makes the implicit 120-minute rule explicit.
- During schedule computation, exclude slots whose start time is later than `closesAt - buffer`. Use buffer or occasion duration whichever is larger to stay conservative.
- Apply the same buffer inside booking validation by injecting it into `assertBookingWithinOperatingWindow` checks so API and UI share rules.
- Update wizard front end to treat validation failures (e.g., `SERVICE_PERIOD`, `CAPACITY_EXCEEDED`) with user-friendly copy and keep the flow responsive.
