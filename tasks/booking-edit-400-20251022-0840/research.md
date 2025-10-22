# Research: Booking Edit 400 Error

## Existing Patterns & Reuse

- `components/dashboard/EditBookingDialog.tsx` already enforces slot alignment in the UI via `TimestampPicker` minute steps and client-side validation.
- `src/app/api/bookings/[id]/route.ts` has a dedicated `dashboardUpdateSchema` and `handleDashboardUpdate` path for these edits; it reuses booking utilities like `assertBookingWithinOperatingWindow`, `assertBookingNotInPast`, and `updateBookingRecord`.
- `lib/utils/datetime.ts#getDateInTimezone` and Luxon-based helpers in `server/capacity/tables.ts` / `server/booking/BookingValidationService.ts` show the existing approach for timezone-safe conversions (use `DateTime.fromISO(...).setZone(...)` plus `toISODate()` / `toFormat('HH:mm')`).

## External Resources

- [Luxon docs](https://moment.github.io/luxon/#/) — reference for `DateTime` conversions between UTC and venue timezone.
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) — confirms `Intl` formatting can provide `HH:mm` strings for specific timezones (mirrors existing utilities).

## Constraints & Risks

- The API route currently derives `bookingDate` and `startTime` using the host machine’s locale (`Date#getHours()` / `#getFullYear()`), so anyone outside the venue timezone gets shifted times and fails validation (`HTTP_400` with “Selected time is outside operating hours.”).
- Any fix must preserve backwards compat for dashboard + legacy update flows and keep side-effects (audit logs, job enqueues) intact.
- We must avoid introducing DST regressions—schedule lookups must use the venue’s timezone consistently, and re-fetching schedules when the computed date changes may be required.
- Need to ensure we do not break past-time guard (`BOOKING_IN_PAST`) or unified validation flag path.

## Open Questions (and answers if resolved)

- Q: Do we already have a venue timezone available when handling dashboard updates?  
  A: Yes—`getRestaurantSchedule` returns `timezone`; we may need to re-fetch if the computed booking date differs from the initial lookup.
- Q: Can we reuse an existing helper for ISO→HH:mm conversion in a specific timezone?  
  A: No single helper exists today, but we can follow the Luxon-based approach used in `server/booking/BookingValidationService.ts` for consistent results.

## Recommended Direction (with rationale)

- Refactor `handleDashboardUpdate` to parse `startIso` / `endIso` with Luxon (`DateTime.fromISO(..., { setZone: true })`), convert them to the restaurant’s timezone, and derive `bookingDate` + `startTime` via `toISODate()` / `toFormat('HH:mm')`. This aligns server-side calculations with venue slots, eliminating timezone drift.
- After converting, if the derived date differs from the schedule that was fetched, reload the schedule for the correct day before validating windows.
- Use the timezone-aware `DateTime` instance when computing durations, `endTime`, and the response DTO to keep downstream logic consistent (including unified validation and job payloads).
