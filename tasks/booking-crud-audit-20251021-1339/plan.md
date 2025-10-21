# Implementation Plan: Booking CRUD Validation Audit

## Objective

Provide an authoritative audit plus a convergence plan so that `/reserve`, `/my-bookings`, `/ops/bookings`, and `/ops/bookings/new` enforce the same business rules for creating and editing reservations (operating hours, closures, past-time, capacity).

## Success Criteria

- [ ] Documented parity matrix capturing current vs desired validation for each flow and rule.
- [ ] Proposed shared validation service/API changes with clear ownership and sequencing.
- [ ] Prioritized backlog of fixes (critical blockers, high-risk divergences, follow-ups) agreed with stakeholders.

## Architecture & Components

- Introduce a reusable `BookingValidationService` (server) wrapping `getRestaurantSchedule`, `assertBookingWithinOperatingWindow`, `assertBookingNotInPast`, `validateBookingWindow`, and capacity checks; expose helpers for create/update operations.
- Consolidate API usage so `/api/bookings`, `/api/bookings/[id]`, `/api/ops/bookings`, `/api/ops/bookings/[id]` all delegate to the service instead of duplicating validation.
- Update client mutations (`useUpdateBooking`, `useOpsUpdateBooking`, ops walk-in wizard) to rely on shared error surface and typed responses.

## Data Flow & API Contracts

Endpoint baselines:

- `POST /api/bookings` & `POST /api/ops/bookings` → accept unified payload (extend ops schema with optional contacts) and return `{ booking, bookings? }` with standardized error codes (`OUTSIDE_WINDOW`, `BOOKING_IN_PAST`, `CAPACITY_FULL`, etc.).
- `PUT /api/bookings/[id]` & `PATCH /api/ops/bookings/[id]` → send `{ bookingId, date, time, party, notes, overrides? }`, receive `{ booking, auditContext }`.

Error model: `{ error: string, code: string, details?: Record<string, unknown> }` with consistent codes reused across flows.

## UI/UX States

- Unified copy for validation failures (past time, closed day, outside window, over capacity).
- Ensure date pickers/time grids surface disabled states (closed day, fully booked) in ops dashboards just as wizard does.
- Preserve existing offline/off-queue messaging; add inline link to operating hours policy when rejecting edits.

## Edge Cases

- Restaurants with bespoke closing overrides or service periods (weekly + one-off overrides).
- Admin override for past-time edits (honour `allow_past` only for privileged roles and log decisions).
- Idempotent create requests and duplicate handling when validation fails mid-flight.
- Customers in different timezones editing reservations (convert inputs safely).

## Testing Strategy

- Unit: cover service helpers (closed-day, after-close, past-time, override, capacity conflict).
- Integration: API route tests for each flow hitting shared validation (happy path + each error).
- E2E: Playwright flows for customer reservation, my-bookings edit denial outside hours, ops walk-in creation blocked on closed day.
- Accessibility: verify error surfaces announced properly (existing components + new states).

## Rollout

- Guard behind `bookingValidation.unified` flag; dogfood on staging ops dashboard first.
- Monitor booking creation/update errors via observability events (`booking.*` + `ops.bookings.*`); ensure volumes stable.
- Gradual rollout: enable for staff/ops endpoints first, then customer edit, finally customer create once metrics solid.
