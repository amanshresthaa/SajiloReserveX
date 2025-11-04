# Implementation Plan: Manual Context Service Overrun 500s

## Objective

Prevent 500 errors from `GET /api/staff/manual/context` when a booking window would overrun the service end; return a structured 422 instead.

## Success Criteria

- [ ] `/api/staff/manual/context` responds 422 with `{ code: "SERVICE_OVERRUN" }` for overrun cases.
- [ ] No change to valid booking behavior; other bookings continue to 200.
- [ ] No DB changes or migrations.

## Architecture & Components

- `server/capacity/tables.ts#getManualAssignmentContext`: wrap window computation and translate `ServiceOverrunError` to `ManualSelectionInputError(422)`.
- API route already maps `ManualSelectionInputError` to structured 4xx.

## Data Flow & API Contracts

Endpoint: GET /api/staff/manual/context?bookingId=UUID
Response (overrun): 422 { error, code: "SERVICE_OVERRUN" }

No changes for success responses.

## UI/UX States

- UI should surface a friendly message when `code === "SERVICE_OVERRUN"`.

## Edge Cases

- Missing booking → unchanged (404/500 as implemented).
- Other policy errors → unchanged; only `ServiceOverrunError` is mapped.

## Testing Strategy

- Local manual QA: reproduce overrun booking and confirm 422.
- Quick typecheck/build to ensure no regressions.

## Rollout

- No flags; small, targeted change.
