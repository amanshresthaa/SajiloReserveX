# Implementation Plan: Booking Time Interval Bug

## Objective

We will enable staff to only schedule bookings at approved interval increments so that all booking edits respect the Reserve service rules.

## Success Criteria

- [ ] Editing a booking start time enforces allowed increments from Reserve rules.
- [ ] End time auto-adjusts based on valid intervals without allowing invalid values.
- [ ] UI time picker snaps to the configured interval (default 15 min) and surfaces errors when input is off cadence.

## Architecture & Components

- `EditBookingDialog` (client): pass allowed interval into `TimestampPicker`, display validation errors, prevent submission of off-slot values.
- `TimestampPicker` (client): accept configurable `minuteStep`, enforce multiples when applying selection.
- `processDashboardUpdate` in `src/app/api/bookings/[id]/route.ts`: reuse `assertBookingWithinOperatingWindow` before mutating bookings.
- Bookings list APIs (`/api/ops/bookings`, `/api/bookings?me=1`) expose `reservationIntervalMinutes` so the client can honour restaurant-specific cadence.

## Data Flow & API Contracts

Endpoint: `PUT /api/bookings/:id` (dashboard shortcut)  
Request: `{ startIso, endIso?, partySize, notes? }`  
Response: `{ id, startIso, endIso, partySize, status, notes, reservationIntervalMinutes? }` (existing shape + new optional field)

List endpoints `/api/ops/bookings` and `/api/bookings?me=1` will now include `reservationIntervalMinutes` on each booking DTO. No request changes.

## UI/UX States

- Loading: unchanged (dialog opens with spinner from existing query states).
- Error: surface API error returned when time violates schedule; show inline picker error if user tries to apply off-step time.
- Success: Save button stays disabled until dirty; once saved, dialog closes as today.

## Edge Cases

- Existing bookings with legacy off-interval times should load, but any attempt to re-save must align to the configured slots (picker shows validation + API rejects).
- Restaurants configured with non-15 intervals (e.g., 10 min) should see correct step once data is exposed; fallback remains 15 if server omits value.
- Closed days / muted schedules should still return the same validation errors from `assertBookingWithinOperatingWindow`.

## Testing Strategy

- Unit: extend `EditBookingDialog`/`TimestampPicker` tests to cover interval enforcement; add server route tests asserting 422 on invalid intervals.
- Integration: exercise `PUT /api/bookings/:id` dashboard path via existing test harness with mocked schedule.
- E2E: sanity-check booking edit flow via Playwright smoke (if available) or manual scenario.
- Accessibility: ensure picker error message uses `aria-errormessage` and remains keyboard navigable.

## Rollout

- Feature flag: reuse existing `FEATURE_BOOKING_VALIDATION_UNIFIED` (no change); new enforcement executes regardless of flag.
- Exposure: full rollout immediately (backend guard + UI enhancement).
- Monitoring: rely on existing observability events (`booking.past_time.blocked` etc.); add logging if needed for validation failures.
