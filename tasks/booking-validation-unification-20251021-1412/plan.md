# Implementation Plan: Booking Validation Unification

## Objective

Ensure every booking creation/update path (customer wizard, dashboard edit, Ops walk-in/edit) enforces the same validation rules and error semantics as `/reserve`, while supporting transactional capacity checks and explicit Ops overrides under a unified, feature-flagged service.

## Success Criteria

- [ ] `BookingValidationService` powers `/api/bookings`, `/api/bookings/[id]`, `/api/ops/bookings`, `/api/ops/bookings/[id]` (and optional preflight) with consistent validation + responses.
- [ ] Validation failures return standardized `BookingError` payloads; overrides capture reason/codes and emit telemetry.
- [ ] Unit, route, and Playwright coverage added for closed days, outside hours, past-time flag on/off, capacity race, overrides, and DST boundary.
- [ ] Rollout flag `bookingValidation.unified` allows shadow → warn → enforce progression without regressions (monitored via observability events).

## Architecture & Components

- `server/booking/types.ts`: export `BookingInput`, `BookingPatch`, `ValidationContext`, `BookingError{,Code}`, `BookingValidationResponse`, override payloads.
- `server/booking/BookingValidationService.ts`:
  - Inject schedule repo (`getRestaurantSchedule` abstraction), capacity gateway (wrapping existing `createBookingWithCapacityCheck` + new update/hold logic), `TimeProvider`, logger/telemetry hook.
  - Methods:
    - `validate(input, ctx, opts)` reusable for create/update.
    - `createWithEnforcement` + `updateWithEnforcement` performing validate → begin txn → capacity re-check (via RPC or locking helper) → persist (delegating to `insertBookingRecord` / new `updateBookingWithCapacityCheck`).
    - Override handling requiring capability + reason; capture `override_codes`, `override_reason`.
  - Internal pure helpers for schedule window checks, past-time, duration validation, service period alignment, lead/lag windows (if config exists), capacity preflight.
- Shared error mapper translating `OperatingHoursError`, `PastBookingError`, capacity `CapacityError` into new contract.
- Extend capacity module with update transaction (`server/capacity/transaction.ts`) supporting hold + update scenario; ensure uses `SELECT ... FOR UPDATE` (per instructions).
- Supabase migration: add `update_booking_with_capacity_check` RPC (mirroring insert logic, excluding target booking from counts, locking capacity rows) and expose via `server/capacity` gateway.
- Optional `src/app/api/booking-validation/route.ts`: wraps service `validate` for UI preflight.
- Barrel export and tests under `server/booking/__tests__`.

## Data Flow & API Contracts

Endpoint: `POST /api/booking-validation` (optional)
Request: `{ restaurantId, serviceId?, partySize, start, durationMinutes, bookingId?, override?: { reason, apply } }`
Response: `BookingValidationResponse`
Errors: HTTP 200 always (validation in payload)

Existing mutation endpoints:

- Request payloads largely unchanged; augment Ops edit/create to accept `overrideReason` (string) and possibly `force` flag behind capability.
- Responses: on failure → `{ ok: false, issues: BookingError[] }` with HTTP 400 (or 409 for commit-time capacity); on success with override → `{ ok: true, booking, overridden: true, issues: [], auditRef }`.
- Add response headers `X-Validation-Version: unified` when flag enabled for observability correlation.

## UI/UX States

- Dashboard Edit dialog and Ops walk-in forms consume unified issues array to surface inline errors identical to `/reserve` wizard copy.
- Disabled dates/times reusing wizard helper (`getDisabledDates` or equivalent) derived from service preflight endpoint.
- Override flows require reason input; display chip/badge indicating override applied with reason and highlight in timeline.
- Error copy referencing restaurant timezone; ensure screen-reader announcement via existing toast/alert components.

## Edge Cases

- Restaurants closed via custom closure table or service disabled: ensure schedule repo surfaces `isClosed`.
- Service breaks (e.g., 15:00–17:00 gap) and DST transitions (gap and overlap); convert using `Temporal`/Luxon or `date-fns-tz`.
- Past-time handling when flag toggled mid-request; ensure time provider stubbed in tests.
- Idempotent create (Ops) → if duplicate, bypass validation (should already succeed).
- Update operations moving booking across services or durations; ensure capacity recalculates against new slot while freeing old slot atomically.
- Overrides allowed only when actor has capability; missing or empty reason triggers `MISSING_OVERRIDE`.

## Testing Strategy

- Unit (`server/booking/__tests__/BookingValidationService.test.ts`):
  - Schedule closed, outside window, service period mismatch, duration invalid, past time flag on/off, lead/lag, override gating, capacity fail, DST transitions.
- Integration/route (Vitest) for each endpoint ensuring HTTP mapping, override requirements, capacity 409 race (simulate via mocks).
- Playwright:
  - Dashboard edit blocked on closed day with unified error copy.
  - Ops override flow capturing reason and showing success with override badge.
  - Customer edit within hours success.
- Accessibility: Validate alerts in UI components still expose `aria-live` with new messages (leverage existing jest-axe or manual QA plan).
- Telemetry assertions using spies to ensure `recordObservabilityEvent` invoked with expected payload.

## Rollout

1. Implement service + optional preflight behind `bookingValidation.unified` (default false); endpoints still return legacy responses but log diff.
2. Shadow mode: call validator in parallel, compare issues vs legacy; log mismatches (`booking.validation.shadow_diff`).
3. Warn mode: if flag + request header `X-Validation-Version: 2`, use new responses.
4. Enforce: toggle flag globally once metrics stable; remove legacy branches.
5. Post-rollout: update docs, remove deprecated validation helpers (`validateBookingWindow`, dashboard shortcuts).
