# Implementation Plan: Booking Edit 400 Error

## Objective

Ensure customer and dashboard users can update bookings successfully from any timezone; server-side validation must interpret the submitted `startIso/endIso` in the restaurant’s timezone so updates no longer fail with `HTTP_400`.

## Success Criteria

- [ ] Editing a booking via `/api/bookings/:id` succeeds (200) when the client is in a different timezone than the venue, provided the requested time is within operating hours.
- [ ] Operating-hours and past-booking guards continue to trigger with the existing error codes/messages when appropriate (e.g., `BOOKING_IN_PAST`, “Selected time is outside operating hours.”).
- [ ] Unit coverage added for the timezone conversion logic that previously failed.

## Architecture & Components

- `src/app/api/bookings/[id]/route.ts` (`handleDashboardUpdate` path) — update parsing/validation to use Luxon-based timezone conversion instead of locale-bound `Date` arithmetic.
- `server/booking/BookingValidationService.ts` / `server/capacity/tables.ts` — reference implementations for Luxon usage; mirror their pattern for consistent behavior.
- Potential new helper (server-side) to encapsulate ISO→venue date/time conversion so it can be unit-tested independently.

## Data Flow & API Contracts

Endpoint: `PUT /api/bookings/:id`
Request body (dashboard path): `{ startIso: string; endIso?: string; partySize: number; notes?: string | null }`
Response (success): booking DTO `{ id, partySize, startIso, endIso, ... }`
Errors: 4xx JSON with `{ error: string, code?: string }` — must remain unchanged for existing consumers.

## UI/UX States

- Loading/Error handling already surfaced by `EditBookingDialog`; no UI changes planned, but error copy should continue to surface server messages (400 outside hours, 422 past time).
- Success: toast “Booking updated” continues to fire via existing mutation hook.

## Edge Cases

- DST boundaries (e.g., clocks going back) — ensure slot normalization still aligns to schedule-provided intervals.
- Date changes across timezone boundaries (e.g., user in UTC-8 updating a UK restaurant for “today”) — schedule lookup should re-fetch if the computed date shifts.
- Missing/invalid ISO strings — continue returning the existing “Invalid date values” 400.

## Testing Strategy

- Unit: add targeted tests for the new helper to verify ISO→date/time conversion with different client/venue offsets (including day rollover).
- Integration: consider lightweight test for `handleDashboardUpdate` via mocked dependencies if feasible; otherwise rely on unit test + manual QA (DevTools) to confirm edit succeeds.
- E2E: manual verification through Chrome DevTools MCP editing a booking from a non-UK timezone (simulated via overriding browser timezone) once available.
- Accessibility: unchanged (UI already leverages `TimestampPicker`).

## Rollout

- Feature flag: not applicable (server fix).
- Exposure: deploy normally; no staged rollout needed.
- Monitoring: ensure observability events (`booking_edit_succeeded/failed`) reflect lower failure rate; watch logs for new unexpected errors post-change.
