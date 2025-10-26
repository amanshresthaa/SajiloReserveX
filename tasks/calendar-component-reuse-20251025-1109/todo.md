# Implementation Checklist

## Investigation

- [x] Inspect calendar usage on `/my-bookings` edit flow.
- [x] Inspect calendar usage on `/reserve/r/[slug]` create plan flow.
- [x] Compare implementations to determine reuse.

## Implementation

- [x] Default the edit schedule parity flag to enabled and remove the prop plumbing.
- [x] Update `MyBookings` client/dialog to always use `ScheduleAwareTimestampPicker` when slug is available.
- [x] Enhance fallback `TimestampPicker` invocation with `minDate` and validation messaging.
- [x] Expand `EditBookingDialog` error copy for booking validation codes.
- [x] Update `/api/bookings/[id]` responses to return structured error codes for operating-hours and access failures.
- [x] Map client errors (including invalid time) using the expanded codes.
- [x] Prefetch adjacent schedules and refine disabled-day logic so closed dates surface immediately across edit & plan flows.
- [ ] Smoke test `/my-bookings` edit flows (schedule-aware + fallback scenario if possible).

## Batched Questions (if any)

- None.
