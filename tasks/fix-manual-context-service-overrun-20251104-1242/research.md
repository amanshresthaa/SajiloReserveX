# Research: Manual Context Service Overrun 500s

## Requirements

- Functional: Manual assignment context (`GET /api/staff/manual/context`) must not return 500 for bookings that exceed service end; respond gracefully so UI can handle.
- Non-functional: Minimal change, reuse existing error patterns; no DB migrations.

## Existing Patterns & Reuse

- `server/capacity/tables.ts#computeBookingWindow` throws `ServiceOverrunError` when the buffered block exceeds service end after clamping.
- `server/capacity/validation.ts#validateBookingWindow` already handles `ServiceOverrunError` by returning a reason (`booking_exceeds_service_end`).
- API routes treat `ManualSelectionInputError` as a structured 4xx response.

## External Resources

- Internal docs: `docs/table-assignment-business-rules.md` (window computation and overrun behavior)

## Constraints & Risks

- Must not mask genuine policy errors; only convert service overruns to a user-facing 422 to prevent 500s.
- Avoid changing window math here to keep behavior consistent.

## Open Questions (owner, due)

- Q: Should we attempt an auto-clamped window fallback for context views?
  A: Not in this change; keep behavior explicit via 422 so UI can guide staff. (owner: eng, due: later)

## Recommended Direction (with rationale)

- Catch `ServiceOverrunError` inside `getManualAssignmentContext` and rethrow as `ManualSelectionInputError` with code `SERVICE_OVERRUN` and status 422. This aligns with how other manual selection validation errors are surfaced and prevents 500s.
