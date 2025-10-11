# Implementation Checklist

## Prep & Validation Logic

- [x] Implement `assertBookingWithinOperatingWindow` helper in `server/bookings/timeValidation.ts`.
- [x] Cover helper with unit tests.

## API Updates

- [x] Apply time validation in POST `/api/bookings`.
- [x] Apply time validation in PUT `/api/bookings/[id]`.
- [x] Add/extend API route tests verifying 400 responses for out-of-hours requests and success for valid submissions.

## Owner Admin Fixes

- [x] Normalize Supabase `HH:MM:SS` values to `HH:MM` in owner operating-hours/service-periods APIs and services.
- [x] Ensure `/ops/restaurant-settings` sections hydrate and submit canonical `HH:MM` strings.
- [x] Expand API/service tests to cover seconds-inclusive payloads.

## Verification

- [x] Run affected test suites (`pnpm test --filter bookings` or equivalent).
- [ ] Perform manual booking flow QA (after implementation) via Chrome DevTools.
- [ ] Update `verification.md` with results.
