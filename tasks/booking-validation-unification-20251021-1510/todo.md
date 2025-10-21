# Implementation Checklist

## Setup

- [x] Implement concrete adapters for `ScheduleRepository` and `CapacityService`, including transactional update RPC + migration.
- [x] Add factory/helper to instantiate `BookingValidationService` with shared dependencies per request.

## Core

- [x] Wire `/api/bookings` POST to `BookingValidationService` under `bookingValidationUnified` flag; maintain legacy fallback + diff logging.
- [x] Wire `/api/bookings/[id]` PATCH to `updateWithEnforcement`, including override handling + audit metadata.
- [x] Wire `/api/ops/bookings` POST (walk-in) to the unified service with Ops capability checks.
- [x] Wire `/api/ops/bookings/[id]` PATCH (Ops edit) to the unified service; require override reason when bypassing validation.
- [x] Implement standardized error mapping + HTTP response helpers for all routes.

## UI/UX

- [ ] Add optional `POST /api/booking-validation` preflight endpoint and integrate dashboard/Ops clients for inline messaging.
- [ ] Surface override reason input + unified error copy in dashboard/Ops frontends (ensure mobile compliance).
- [ ] Share disabled-date/time helper across wizard and dashboard contexts.

## Tests

- [ ] Add unit tests for `BookingValidationService` covering closed date, outside hours, past-time, capacity, overrides, DST.
- [ ] Expand route tests for each updated endpoint ensuring new responses + feature flag fallback.
- [ ] Add Playwright coverage for dashboard edit + Ops override flows, plus reserve regression.
- [ ] Document manual QA steps in `verification.md` (Chrome DevTools MCP).

## Notes

- Assumptions:
- - Ops capability mapping can derive `booking.override` from existing manager/owner roles.
- - Capacity update RPC will be accepted by DBA for remote deployment.
- Deviations:
- - If RPC work needs separate deployment window, guard update integration behind feature flag and degrade gracefully.

## Batched Questions (if any)

- Are there existing role-to-capability mappings for Ops staff, or do we introduce a new lookup?
