# Implementation Checklist

## Setup

- [x] Add feature flag `FEATURE_AUTO_ASSIGN_ON_BOOKING` to env schema and loader.
- [x] Expose `isAutoAssignOnBookingEnabled()` helper.

## Core

- [x] Implement `server/jobs/auto-assign.ts` (quote ➜ confirm ➜ transition ➜ email).
- [x] Wire job in `POST /api/bookings` (fire-and-forget when flag ON).
- [x] Suppress created email when flag is ON and status is pending.

## UI/UX

- [x] No guest interaction with tables; email only after confirmation.

## Tests

- [ ] Add unit coverage for job success/failure paths and retry timings (follow-up).

## Notes

- Assumptions:
  - Background execution is acceptable best-effort; robust retries can be layered later.
- Deviations:
  - N/A (retry policy implemented with configurable delays and start cutoff).

## Batched Questions (if any)

- Do we need a fallback “request received” email after a timeout window if auto-assign fails?
