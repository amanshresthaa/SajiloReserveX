# Implementation Notes

- `timeSlots` service keeps temporary duplication with `bookingHelpers.serviceWindows` and `formatTime`. S2/S4 will route config + formatting through shared modules; keep this note to avoid losing context.
- `useTimeSlots` exposes `inferBookingOption` so S3 can route analytics props without re-importing service helpers.
- Re-exported the `BookingOption` type from `timeSlots` and tightened `normalizeTime` casting so the build succeeds when consuming the hook.
