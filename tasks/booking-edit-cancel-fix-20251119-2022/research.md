---
task: booking-edit-cancel-fix
timestamp_utc: 2025-11-19T20:23:16Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Fix booking edit/cancel errors

## Requirements

- Functional: booking edit and cancel flows should work without errors for bookings in the bookings page (`/bookings`). Availability loading for date/time selection should succeed or present a clear recoverable error.
- Non-functional: maintain accessibility (keyboard, focus, ARIA), follow existing components and state machine patterns, avoid regressions to booking status handling.

## Existing Patterns & Reuse

- Booking state machine components in `src/components/features/booking-state-machine/` handle availability loading and UI states.
- Dialog-based booking edit UI appears in `components/dashboard/EditBookingDialog.tsx`.
- API routes for bookings and schedule/availability under `src/app/api/bookings` and `src/app/api/restaurants/[slug]/schedule`.

## External Resources

- None yet; rely on in-repo patterns.

## Constraints & Risks

- Supabase is remote-only; no local migrations allowed (per policy).
- Potential data coupling between availability API and booking edit dialog; risk of missing edge cases if status machine not updated.

## Open Questions (owner, due)

- Does the availability API return expected shape for edit flow? (owner: self, due: before implementation)
- Is cancel flow blocked by API error or UI state? (owner: self, due: before implementation)

## Recommended Direction (with rationale)

- Inspect booking edit dialog and availability loader to reproduce the "Unable to load availability" error and identify missing fallbacks or incorrect parameters.
- Verify cancel API handler and UI actions to ensure request paths and parameters are correct; check for missing restaurantId or bookingId validation.
- Apply targeted fixes within existing components/state machine to resolve availability fetch failures and ensure edit/cancel actions handle errors gracefully.
