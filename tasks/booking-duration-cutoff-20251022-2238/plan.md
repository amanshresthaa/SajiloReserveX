# Implementation Plan: Reservation Duration Cutoff

## Objective

We will enable restaurants to configure the cut-off for reservation slots so that guests can only pick start times that keep the booking within operating hours.

## Success Criteria

- [ ] Booking slot availability respects a configurable final-start offset per restaurant.
- [ ] UI hides times that would exceed the configured booking duration.
- [ ] API no longer returns 400 for slots filtered out in the UI under normal conditions.

## Architecture & Components

- **Database**
  - Supabase migration adding `reservation_last_seating_buffer_minutes` (integer, default 120, min 15, max 300) to `public.restaurants`.
  - Seed scripts updated to populate the column for fixture data.
- **Server**
  - Extend restaurant domain helpers (`server/restaurants/{create,update,list}.ts`, DTOs, services) and Ops API schema to read/write the new field.
  - Modify `getRestaurantSchedule` to honour the buffer by pruning slots whose start time is later than `closesAt - max(buffer, durationForSlot)`.
  - Surface buffer in `RestaurantSchedule` response for debugging (optional) while keeping existing consumers compatible.
- **Front End (Ops)**
  - Update `RestaurantDetailsForm` and related hooks so operators can configure the buffer with validation and help text.
- **Front End (Guest)**
  - Wizard already consumes filtered schedules; ensure `mapErrorToMessage` recognises validation payloads (e.g. capacity/service-period issues) and shows actionable copy.

## Data Flow & API Contracts

- `GET /api/restaurants/[slug]/schedule` → response includes revised `slots` array with restricted availability. No contract change apart from slot count reduction.
- Ops REST endpoints (`/api/ops/restaurants`) gain optional `reservationLastSeatingBufferMinutes` field on read/write payloads.
- Booking POST continues returning current error shapes; front-end mapping enhanced to detect validation issue structures.

## UI/UX States

- Plan step “time picker” should never surface slots that breach the buffer.
- If an API validation error still occurs (stale data), the wizard surfaces a contextual message (“Selected time is no longer available, please choose another slot”) and returns to Plan step.
- Admin UI exposes the buffer with helper copy explaining it controls latest seating relative to closing time.

## Edge Cases

- Restaurant closed day → slots list already empty (no change).
- Buffer larger than operating window → ensure we guard and return empty slot set gracefully.
- Occasion duration longer than buffer → use the larger of the two to keep bookings safe.
- Past bookings or edits via ops routes should inherit the same guard via `getRestaurantSchedule`.

## Testing Strategy

- Unit tests for `getRestaurantSchedule` (mocked data) to assert slot pruning logic.
- Adjust or add API schema tests verifying the new field is accepted/returned.
- Update wizard hook tests to confirm error mapping surfaces validation messages.
- Manual QA via Chrome DevTools MCP on reservation flow verifying unavailable late slots and error messaging.

## Rollout

- Run Supabase migration remotely (per handbook). Link migration + task folder in PR.
- Coordinate with ops stakeholders to backfill buffer value if non-default is needed.
