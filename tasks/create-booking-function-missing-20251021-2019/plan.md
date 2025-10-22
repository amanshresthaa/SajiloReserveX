# Implementation Plan: Resolve Missing Supabase Function For Booking Creation

## Objective

We will enable booking submissions to succeed by ensuring the expected Supabase RPC exists or calls the correct endpoint so that the reservation wizard can confirm bookings without server errors.

## Success Criteria

- [ ] Booking creation no longer triggers `[error] {}` console errors in dev.
- [ ] The reservation wizard receives a successful response for a happy-path booking in local dev.

## Architecture & Components

- Update `server/capacity/transaction.ts#createBookingWithCapacityCheck` to attempt the legacy RPC once, but gracefully fall back to an application-level booking insert when Supabase reports `PGRST202` (function missing) or `42P01` (dropped relation).
- Reuse existing helpers from `server/bookings.ts` (`generateUniqueBookingReference`, `insertBookingRecord`, `buildBookingAuditSnapshot`) inside the fallback to keep duplication minimal.
- Propagate the fallback through exported surface (`createBookingOrThrow`, validation service) without changing call sites, so `/api/bookings` and any other consumers benefit automatically.
- Preserve observability by emitting structured events for both fallback success and duplicate reuse; tag events so downstream dashboards can highlight the degraded capacity path.

## Data Flow & API Contracts

Endpoint: `POST /api/bookings`

Request: unchanged; client supplies restaurant, customer details, desired slot, idempotency key.

Response: unchanged JSON payload that includes the created booking.

Errors:

- Maintain existing validation errors.
- On fallback insert, map duplicate idempotency collisions to the existing `"duplicate": true` response rather than surfacing 500s.
- If the fallback insert itself fails (e.g., DB constraint violation), wrap in `CapacityError` with `INTERNAL_ERROR` so callers continue to handle via existing paths.

## UI/UX States

- Loading: no change (wizard continues showing existing progress UI).
- Error: ensure legacy `[error] {}` console logs become informative (`[error] { context: 'capacityFallback', ... }`) when fallback fails.
- Success: booking wizard receives success payload and confirmation view renders; duplicate submissions should still surface as success with reuse indicator.

## Edge Cases

- Idempotent retries (same `idempotencyKey`): verify fallback detects and returns existing booking instead of attempting a new insert.
- Missing `idempotencyKey`: ensure retry guard via `clientRequestId`/duplicate detection does not erroneously treat distinct submissions as duplicates.
- Race condition: without capacity RPC, simultaneous inserts rely on basic constraints; document the temporary lack of hard capacity enforcement.

## Testing Strategy

- Unit: extend/adjust `src/app/api/bookings/route.test.ts` mocks to cover the fallback branch (function missing) and duplicate handling.
- Integration: where feasible, add a server-level test that exercises the fallback helper directly using a mocked Supabase client.
- Manual: run booking wizard flow locally to confirm no console errors and that bookings persist.
- Accessibility: unchanged (no UI modifications).

## Rollout

- Feature flag: none; change applies immediately.
- Exposure: standard deploy; highlight temporary capacity limitations in task notes.
- Monitoring: watch `wizard_submit_failed` analytics for regression; leverage new observability event tags to confirm fallback usage frequency.
