# Research: Ops Dashboard Assign Tables Lunch Overrun Error

## Existing Patterns & Reuse

- Booking windows are computed via `server/capacity/tables.ts:278-308` (`computeBookingWindow`), which calculates a dining block using turn bands plus pre/post buffers, then bails with `ServiceOverrunError` if the buffered window extends past `serviceEnd`.
- Default venue policy (`server/capacity/policy.ts:32-76`) sets lunch to 12:00–15:00 with a 5-minute post buffer; party-size turn bands define 75–85 minute dining durations depending on size.
- Ops dashboard API (`src/app/api/ops/dashboard/assign-tables/route.ts`, to inspect) eventually invokes `computeBookingWindowWithFallback`, so any window violation hits the same guard surfaced through `ServiceOverrunError`.

## External Resources

- Error surfaced in logs: `ServiceOverrunError` message matches default policy formatting in `policy.ts`.
- Tests already cover overrun scenarios (e.g., `tests/server/capacity/policy.test.ts`) ensuring the guard triggers when calculated `blockEnd` surpasses service boundary.

## Constraints & Risks

- Relaxing the guard too far risks allowing allocations that collide with venue closing buffers or staff breaks.
- Need to preserve separation between lunch and dinner prep—policy might require a configurable grace rather than hard-coded 5-minute post buffer.
- Changes should stay backwards-compatible with existing bookings and avoid shifting standard durations unless policy explicitly updated.

## Open Questions (and answers if resolved)

- Q: Is the post-lunch buffer meant to be adjustable per venue (config-driven) rather than hard-coded 5 minutes?
  A: Pending review—no alternate policy definitions currently loaded; likely need a configurable grace window.
- Q: Does ops dashboard expect to seat parties that naturally spill into dinner (e.g., late lunch)? Or should UX surface a better message?
  A: Determine per product requirements; currently error bubbles up as 500, so at minimum response handling needs improvement.

## Recommended Direction (with rationale)

- Inspect the booking causing the failure to confirm start time/party and derived block; quantify how far past 15:00 we are (app likely hitting 15:05 because of buffer).
- Depending on product guidance: either (a) introduce a configurable post-service grace window to allow ops-led assignments slightly beyond the nominal end, or (b) adjust ops dashboard error handling to return 409 with actionable messaging instead of 500.
- Add tests covering lunch boundary assignments, ensuring whichever approach we take is locked in.
