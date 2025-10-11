# Implementation Plan: Reservation Time Validation

## Objective

Block reservation submissions (create and update) when the requested start time falls outside the restaurant's operating hours for the selected date, ensuring backend enforcement matches the UI's availability constraints.

## Success Criteria

- [ ] POST `/api/bookings` returns a 400 response when a guest submits a time outside the computed operating window (closed day, invalid slot, or past closing).
- [ ] PUT `/api/bookings/[id]` applies the same operating-hour validation before persisting updates.
- [ ] Valid in-window submissions continue to succeed without impacting loyalty, audit, or side-effect flows.
- [ ] Automated tests cover success and failure paths for the new validation logic.
- [ ] Owner admin updates for operating hours/service periods succeed even when incoming data contains `HH:MM:SS` strings from Supabase, with responses normalized to `HH:MM`.

## Architecture

- **Schedule Lookup**: Reuse `getRestaurantSchedule` to resolve open/close windows and available slots for the requested date using the existing Supabase service client.
- **Validation Helper**: Introduce a pure helper that compares a requested time (and derived duration) against the schedule data so it can be unit-tested independently and reused by both routes.
- **Error Handling**: Short-circuit route handlers with structured 400 responses when validation fails, keeping existing try/catch error reporting for unexpected failures.
- **Owner Admin Normalization**: Update owner endpoints and supporting services to accept `HH:MM:SS`, canonicalize to `HH:MM`, and ensure the admin UI hydrates/saves using the canonical format.

## Component Breakdown

- `server/bookings/timeValidation.ts` (new): export `assertBookingWithinOperatingWindow` (or similar) that accepts schedule, time, and booking type, throwing descriptive errors for closed days, missing slots, or overruns.
- `app/api/bookings/route.ts`: fetch schedule prior to booking creation, invoke the helper, and use the validated/normalized time value.
- `app/api/bookings/[id]/route.ts`: apply the same helper during updates before persisting changes.
- `app/api/bookings/__tests__/timeValidation.test.ts` (new): cover helper edge cases.
- Extend or add API route tests for POST/PUT to ensure 400 responses on invalid times (mocking schedule and Supabase dependencies as needed).
- `app/api/owner/restaurants/[id]/hours` & `/service-periods`: relax Zod schemas, normalize payloads/responses, and expand tests to cover seconds-inclusive inputs.
- `components/ops/restaurant-settings/*Section.tsx`: strip trailing seconds during hydration and before submission so admin UI remains aligned with backend canonical format.

## Data Flow

1. Route parses request payload (existing Zod schema).
2. Service Supabase client fetches schedule via `getRestaurantSchedule`.
3. Validation helper confirms the restaurant is open and the requested time aligns with an available slot and duration fits before closing.
4. On success, helper returns normalized time (and optionally duration) so route can compute end time and proceed with existing booking persistence.
5. On failure, helper throws typed error; route catches and responds with 400 JSON.

## API Contracts

- Request payloads remain unchanged.
- Failure responses include `{ error: string }` with 400 status for out-of-hours submissions.
- Successful responses unaffected.

## UI/UX Considerations

- Frontend already prevents selecting invalid times; backend errors should surface meaningful messages for users if direct API calls occur.
- Keep error strings concise so they can map to user-friendly toasts in the wizard.

## Testing Strategy

- Unit tests for the validation helper covering:
  - Closed day returns specific error.
  - Missing slot / time outside interval returns error.
  - Duration exceeding closing time returns error.
  - Valid time passes through.
- Route-level tests (mocking dependencies) to assert POST/PUT return 400 with appropriate error payloads when helper rejects, and continue for valid cases.
- Manual regression (later) through reservation wizard to confirm booking still succeeds for valid slots.

## Edge Cases

- Restaurants closed on the requested date (override or weekly closure).
- Times exactly equal to `closesAt` (should be rejected because slots end before close).
- Bookings near close where default duration would push end time past closing.
- Submitted booking type `"drinks"` skips meal inference; validation should still use duration appropriate for the booking type stored.
- Admin saves without editing fields must not fail when Supabase returns times with seconds.

## Rollout Plan

- Deploy with the rest of the backend changes once manual verification passes; no feature flag required.
