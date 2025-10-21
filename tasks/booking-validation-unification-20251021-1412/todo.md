# Implementation Checklist

## Setup

- [x] Confirm existing env schema and feature flag handling; add `bookingValidation.unified` to `config/env.schema.ts` + `env.featureFlags`.
- [x] Define shared booking validation types (`server/booking/types.ts`) and ensure lint/build integration.
- [x] Stub `BookingValidationService` file with dependency interfaces (schedule repo, capacity gateway, logger, time provider).

## Core

- [x] Implement schedule + operating hours validation pipeline (closed days, service periods, duration limits, lead/lag placeholders).
- [x] Integrate past-time validation respecting `bookingPastTimeBlocking` flag and override capability requirements.
- [ ] Build capacity preflight + transactional enforcement (create/update) using `createBookingWithCapacityCheck` and new update helper.
- [ ] Author Supabase migration for `update_booking_with_capacity_check` RPC and client wrapper, ensuring remote-only execution.
- [x] Implement error mapper to standardized `BookingError` codes/messages and HTTP mapping utility.
- [ ] Honor ops override semantics: require capability + `override_reason`, capture `override_codes`, persist audit entry, log telemetry.
- [ ] Add feature flag guard + shadow/warn/enforce branches in new service/consumers.

## UI/UX

- [ ] Add optional `POST /api/booking-validation` preflight endpoint and hook up to dashboards (Edit dialog, Ops walk-in) for disabled states + inline messaging.
- [ ] Ensure dashboard/Ops clients surface unified errors and collect override reason before applying.
- [ ] Share wizard date-disable helper (export or new utility) so dashboards and wizard use same schedule-based availability data.

## Tests

- [ ] Unit tests for `BookingValidationService` covering closed dates, after-hours, past-time flag on/off, capacity fail, override gating, DST.
- [ ] Integration tests for each API route verifying unified responses + override handling + feature-flagged fallbacks.
- [ ] Playwright E2E scenarios (customer edit failure, ops override success, ops walk-in closed day rejection).
- [ ] Accessibility regression checks for new error surfaces (axe/manual QA entries).

## Notes

- Assumptions: existing audit_logs metadata can store override details; capacity update transaction can extend existing RPC or new helper without migration (verify).
- Deviations: if update-time capacity enforcement requires DB migration beyond scope, surface as risk + fallback plan (document before implementation).

## Batched Questions (if any)

- Do we have an existing capability model for `booking.override`, or should admin roles suffice? (Need maintainer guidance.)
