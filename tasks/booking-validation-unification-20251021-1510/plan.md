# Implementation Plan: Booking Validation Unification

## Objective

Deliver a single, feature-flagged validation pipeline that mirrors `/reserve` safeguards across dashboard edits, Ops edits, and Ops walk-ins while preserving override semantics and transactional capacity enforcement.

## Success Criteria

- [ ] All booking create/update APIs call `BookingValidationService` and honour `env.featureFlags.bookingValidationUnified` for staged rollout.
- [ ] Ops overrides require `booking.override` capability + reason, log `override_codes`, and persist audit entries without regressing existing telemetry.
- [ ] Transactional capacity enforcement (insert + update) eliminates TOCTOU windows; commit-time failures return standardized `BookingError` payloads with correct HTTP status mapping.
- [ ] Unit, route, and E2E coverage exercise closed days, outside-hours, past-time (flag on/off), capacity race, override flow, and DST transition.

## Architecture & Components

- **BookingValidationService wiring**
  - Provide a concrete `ScheduleRepository` adapter around `getRestaurantSchedule`. Validate assumption that schedule fetch works for dashboards by replaying with mocked routes (verified earlier via `sed`).
  - Implement `CapacityService` wrapper:
    - `checkAvailability`: reuse or extend capacity engine (investigate `server/capacity/service.ts`; current stub always returns ok → must either enhance or guard behind feature flag until real engine ready).
    - `createBooking` / `updateBooking`: call Supabase RPCs (`create_booking_with_capacity_check`, new `update_booking_with_capacity_check`). Alternative considered: run manual transaction in app layer; rejected due to Supabase concurrency requirements.
  - Inject DI-friendly dependencies via `createBookingValidationService()` factory that caches per-request to minimise start-up cost.
- **Transactional update path**
  - Author Supabase migration for `update_booking_with_capacity_check` (shadow mode: SQL should exclude the target booking from counts and apply `FOR UPDATE`). Alternative: reuse insert RPC by cancel + reinsert; discarded due to race window and audit implications.
  - Add corresponding TypeScript wrapper in `server/capacity/transaction.ts`, respecting retries/backoff.
- **API integration**
  - `/api/bookings` POST: behind flag, replace inline validation with call to `createWithEnforcement`; maintain legacy response structure when flag disabled. Need to compare new errors vs legacy and log diffs.
  - `/api/bookings/[id]` PATCH: call `updateWithEnforcement`. Provide compatibility shim translating `BookingValidationError` into current 422/400 payloads until clients migrate.
  - `/api/ops/bookings/[id]` PATCH & `/api/ops/bookings` POST: unify with service, add override input (`overrideReason`) & capability detection. Consider improbable case where Ops lacks capability mapping—fallback to legacy behaviour with warning log until roles updated.
- **Preflight endpoint (optional but recommended)**
  - `POST /api/booking-validation`: Proxy to `validateCreate`/`validateUpdate` without commit. Helps dashboards fetch disabled states. Must remain read-only (no capacity commit).
- **Telemetry & auditing**
  - Emit `booking.validation_failed` / `booking.override.applied` events through the service to centralise observability (ensuring existing event names continue for backwards compatibility).
  - Extend `logAuditEvent` metadata to include override info; confirm JSON column can store arrays (checked via prior audits).

## Data Flow & API Contracts

- **Create flow (`createWithEnforcement`)**
  1. Request (customer or Ops) → convert payload to `BookingInput` (ensure ISO conversion into restaurant TZ).
  2. `BookingValidationService.runValidation`:
     - scheduleRepo loads `RestaurantSchedule` (closures, slots, timezone).
     - `assertBookingWithinOperatingWindow` + slot disable detection.
     - Past-time guard when `bookingPastTimeBlocking` true; override not allowed for customers.
     - Capacity preflight (when `checkCapacity` true).
  3. If ok → `capacityService.createBooking` executes RPC in transaction, rechecking availability; commit-time failures throw `BookingValidationError` with `CAPACITY_EXCEEDED`.
  4. Response: success payload includes normalized start/end, override metadata (if any).
- **Update flow (`updateWithEnforcement`)**
  - Accepts existing booking record + patch; service normalises missing fields (duration, type) and reruns validation before calling transactional update RPC.
  - Overrides allowed when Ops capability present and reason provided; service records override codes and sets `overridden: true`.
- **Error mapping**
  - Validation failures (no override) → 400 with `{ ok: false, issues: [...] }`.
  - Override missing capability/reason → 403 or 400 (aligned with existing semantics; need to decide final mapping in implementation).
  - Commit-time capacity conflict → 409 with `CAPACITY_EXCEEDED`.
  - Legacy fallback path (flag off) retains existing payloads to avoid client regressions.
- **Preflight**
  - Always returns 200 with `BookingValidationResponse`, allowing clients to interpret issues list without triggering writes.

## UI/UX States

- **Dashboard Edit & Ops Modals**
  - Prior to submit, call preflight (when flag on) to disable invalid slots and surface identical copy as wizard. Provide inline reason list referencing `BookingError.message`.
  - On override attempt, require reason input; disable submit until both capability (front-end gating) and reason present. Show override badge once API returns `overridden: true`.
- **Wizard parity**
  - Ensure disabled dates/time list derived from same service (potentially reuse wizard helper or call new preflight endpoint). Validate mobile/responsive behaviour as per AGENTS.md.
- **Error toast/banner**
  - Display aggregated validation issues with timezone-aware context (e.g., “Restaurant is closed on 27 Nov 2025 (Europe/London)”).

## Edge Cases

- Custom closures and service breaks (schedule slots marked `disabled`) — ensure validator respects `slot.disabled`.
- DST transitions: check bookings straddling fall-back/spring-forward boundaries using Luxon conversions (service already uses `DateTime.fromISO` with zone).
- Capacity race: two concurrent updates should lead one to succeed and the other to receive `CAPACITY_EXCEEDED` 409.
- Past-time toggles: if flag disabled mid-request, validator should skip check to match legacy baseline (guard via `ctx.flags.bookingPastTimeBlocking`).
- Override misuse: missing capability or empty reason must enrich error list with `MISSING_OVERRIDE` without leaking previous issues.
- API consumers lacking new flag: ensure we don’t send `issues` array unless clients expect it; guard behind flag or header per rollout plan.

## Testing Strategy

- **Unit**
  - `BookingValidationService` tests with mocked schedule/capacity:
    - Closed date, outside hours, disabled slot, invalid duration, past-time (flag on/off), override gating, capacity fail, DST boundary.
    - Counter-check by injecting malformed schedule (missing timezone) to ensure graceful `UNKNOWN` error logging.
- **Integration / route (Vitest)**
  - `/api/bookings` create: ensure 400 on closed day, 409 on commit-time failure, 200 success with normalized times.
  - `/api/bookings/[id]` update: rejects past-time when flag on, allows when override applied and capability provided.
  - Ops routes: verify override reason required; check legacy flag-off path still returns historical payloads.
- **Playwright**
  - Dashboard edit -> attempt closed date (expect inline errors identical to wizard).
  - Ops override flow -> ensure reason prompt + success badge.
  - Reserve wizard unaffected (regression).
- **Telemetry assertions**
  - Spy on `recordObservabilityEvent` to confirm `booking.validation_failed` and override events fire with expected payload.
- **Accessibility**
  - Run axe (jest-axe or manual) on updated modals to confirm new error states remain screen-reader accessible.

## Rollout

- Feature flag: `bookingValidation.unified` (default `false`).
  1. **Shadow mode**: call validator alongside legacy path; log diff events (`booking.validation.shadow_diff`) without altering responses.
  2. **Warn mode**: when header `X-Validation-Version: unified` present, respond with unified payloads for opted-in clients.
  3. **Enforce**: flip flag after monitoring; remove legacy paths once stable.
- Monitoring: instrument counters for each `BookingError.code`, track override frequency, and alert on spikes.
- Backout: toggle flag off to revert to legacy validation instantly; ensure fallback path remains intact until decommission.
