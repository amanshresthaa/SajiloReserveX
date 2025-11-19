---
task: booking-edit-cancel-fix
timestamp_utc: 2025-11-19T20:23:16Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Fix booking edit/cancel errors

## Objective

Ensure booking edit and cancel flows work on `/bookings` by loading availability correctly and sending valid requests to update or cancel a booking.

## Success Criteria

- [ ] Availability loads without the generic error when editing a booking for supported dates.
- [ ] Booking edit dialog saves updates successfully with valid payload.
- [ ] Cancel action succeeds and reflects updated status in UI without errors.

## Architecture & Components

- `components/dashboard/EditBookingDialog.tsx`: inspect edit/cancel handlers, payloads, and state integration with booking state machine.
- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`: verify availability loading logic and error states.
- API routes under `src/app/api/bookings` and related services for update/cancel.

## Data Flow & API Contracts

- Edit booking likely calls `/api/bookings/[id]` (PATCH/PUT) with booking details including schedule/party size/state.
- Cancel booking likely calls `/api/bookings/[id]/cancel` or status mutation; confirm route and required params (bookingId, restaurantId, reason?).
- Availability fetch uses `/api/restaurants/[slug]/schedule?date=YYYY-MM-DD`; ensure correct date formatting and slug usage.

## UI/UX States

- Edit dialog: loading availability, success with options, error fallback with retry.
- Cancel action: confirmation, loading state, success state (status updated) and error surface.

## Edge Cases

- Invalid/unsupported future dates returning 404 should present user-friendly message and allow retry/alternate date.
- Missing restaurantId/bookingId in requests should be blocked client-side.

## Testing Strategy

- Manual reproduction in dev: open `/bookings`, attempt edit and cancel on sample booking.
- Unit-level check via existing hooks/services if feasible; otherwise rely on manual verification and console/network inspection.
- Accessibility: ensure dialog flows remain keyboard accessible, focus intact after operations.

## Rollout

- No feature flag identified; ship as bugfix.

## DB Change Plan (if applicable)

- No DB schema changes expected.
