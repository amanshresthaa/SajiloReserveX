# Implementation Plan

1. Update `softCancelBooking`, `updateBookingRecord`, and `insertBookingRecord` in `server/bookings.ts` to `await invalidateAvailabilitySnapshot(...)`.
2. Remove `void` casts; no other logic change needed.
3. Run `pnpm lint`.
