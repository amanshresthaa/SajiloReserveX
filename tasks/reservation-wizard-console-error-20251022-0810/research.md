# Research: Reservation Wizard Console Error

## Existing Patterns & Reuse

- `reserve/shared/error/errorReporter.ts` only logs to the console in non-production builds, but it currently emits `[error] {}` for any captured payload, including expected domain rejections.
- `reserve/features/reservations/wizard/hooks/useReservationWizard.ts` (`handleConfirm`) always calls `errorReporter.capture` before branching on `isBookingInPastError`, so even the expected `"BOOKING_IN_PAST"` path triggers console noise.
- Other flows (e.g. `hooks/useUpdateBooking.ts`) treat `"BOOKING_IN_PAST"` as a user error and surface messaging without error reporting, suggesting we should follow the same pattern here.
- Domain errors from the booking API are normalized to plain objects via `reserve/shared/api/client.ts`, giving us structured fields (`code`, `message`, `status`) we can inspect prior to reporting.

## External Resources

- `reserve/features/reservations/wizard/ui/__tests__/BookingWizard.plan-review.test.tsx` verifies the UX for `"BOOKING_IN_PAST"` responses, confirming this error is part of the happy-path guidance rather than an exceptional failure.

## Constraints & Risks

- We must keep capturing genuinely unexpected failures so that telemetry and debugging remain intact.
- Any change should maintain the current customer messaging and analytics side effects (e.g. `analytics.track('booking_created', ...)` still suppressed on failures).
- Avoid broad try/catch suppression that could hide regressions for other error codes (`CAPACITY_FULL`, `OUTSIDE_WINDOW`, etc. are mentioned in planning docs).

## Open Questions (and answers if resolved)

- Q: Are there additional domain error codes we should treat as expected alongside `"BOOKING_IN_PAST"`?
  A: Need to confirm with product/maintainers; for now we only have reproduction evidence for `"BOOKING_IN_PAST"`.

## Recommended Direction (with rationale)

- Gate `errorReporter.capture` behind a guard that skips known domain validation errors (starting with `"BOOKING_IN_PAST"`). This aligns with other hooks, keeps telemetry signal clean, and preserves existing UX flows.
