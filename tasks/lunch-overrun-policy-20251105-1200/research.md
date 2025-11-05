# Research: Lunch Overrun Policy

## Requirements

- Functional:
  - Treat any booking that starts before 15:00 as "lunch", regardless of end time.
  - Eliminate lunch-specific service overrun errors and clamping to service end.
- Non-functional (a11y, perf, security, privacy, i18n):
  - No UI changes required.
  - Capacity engine behavior change must be deterministic and traceable.

## Existing Patterns & Reuse

- Service classification uses `whichService(start)` (start-time based).
- Window computation and overrun enforcement live in `server/capacity/tables.ts#computeBookingWindow`.
- Validation surface maps `ServiceOverrunError` to reason `booking_exceeds_service_end`.

## External Resources

- N/A (internal policy change only).

## Constraints & Risks

- Allowing lunch bookings to run past 15:00 reduces headroom for subsequent services (e.g., dinner prep).
- Existing tests around dinner clamping must continue to pass.
- Ensure we only relax overrun for lunch, not for dinner/drinks.

## Open Questions (owner, due)

- Q: Should UI availability show lunch slots after 14:50 for long dwell times?
  A: For now, engine permits; UI filtering can be addressed separately.

## Recommended Direction (with rationale)

- Modify `computeBookingWindow` to skip clamping and overrun errors when `service === 'lunch'`.
- Leave dinner/drinks behavior unchanged to preserve existing guarantees and tests.
