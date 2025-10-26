# Implementation Checklist

## Setup

- [x] Confirm Supabase `bookings` query exposes restaurant slug/timezone fields.

## Core

- [x] Extend `/api/bookings?me=1` select & DTO mapping to include `restaurantId`, `restaurantSlug`, `restaurantTimezone`.
- [x] Remove `TimestampPicker` fallback from `EditBookingDialog`; always render `ScheduleAwareTimestampPicker`.
- [x] Add guard/alert when slug is unexpectedly missing and disable submit.
- [x] Wrap edit time picker in accordion so availability selector stays closed by default, mirroring plan step UX.

## UI/UX

- [ ] Verify edit dialog calendar greys out unavailable dates immediately.

## Tests

- [x] Unit
- [x] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions: Backend has slug/timezone for every customer booking.
- Deviations: 

## Batched Questions (if any)

- 
