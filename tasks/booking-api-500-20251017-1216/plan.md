# Implementation Plan: Booking API 500 Error

## Objective

Restore customer booking submissions for `old-crown-pub` (and future venues) by eliminating the 500 emitted when Supabase rejects invalid restaurant timezones, while improving diagnostics and preventing bad data from re-entering the system.

## Success Criteria

- [ ] `POST /api/bookings` succeeds (201/200) for venues whose saved timezone previously triggered the `INTERNAL_ERROR` path.
- [ ] RPC returns structured details when failures occur and API logs them, enabling quick triage instead of opaque 500s.
- [ ] Admin create/update flows reject invalid timezone strings early, preventing regression.
- [ ] Migration cleans existing invalid timezones and is idempotent.

## Architecture & Components

- `supabase/migrations/*`: add SQL migration to (a) update `create_booking_with_capacity_check` with timezone validation/fallback and (b) normalize existing bad `restaurants.timezone` values.
- `server/restaurants/…`: introduce shared `ensureValidTimezone` helper leveraged by create/update/detail validators so only IANA names are persisted.
- `src/app/api/bookings/route.ts`: enhance error handling for `bookingResult.error === 'INTERNAL_ERROR'` to log returned `details`.
  State: no UI state change; instrumentation improvement only.

## Data Flow & API Contracts

Endpoint: `POST /api/bookings`
Request: unchanged payload (`restaurantId`, `date`, `time`, …).
Response:

- Success: unchanged.
- Failure: when RPC returns `INTERNAL_ERROR`, include stable support code/message while logging diagnostic metadata (sqlstate/sqlerrm). Public contract remains `500` but with improved observability.

Errors:

- `500` retains for unexpected failures, but server log/event must include RPC `details`.
- No new response fields added to clients.

## UI/UX States

- No customer UI changes; ensure wizard displays existing generic error but capture analytics event with enriched metadata (already happening).

## Edge Cases

- Restaurant timezone blank/null → fallback to `'UTC'` at RPC level; app-layer validation should block blank submissions going forward.
- Locale-specific values (e.g. `"Europe/London"`, `"America/New_York"`) remain untouched.
- Migration must skip venues already valid; ensure safe re-run.

## Testing Strategy

- Unit: cover new `ensureValidTimezone` helper; adjust tests around restaurant validation if present.
- Integration: extend server-side tests for bookings route (mock RPC) to assert logging of `details`; add regression test in capacity integration suite if feasible (may need to stub invalid timezone scenario locally).
- Manual: exercise booking flow against staging once migration applied; capture verification in `verification.md`.

## Rollout

- Migration deployed alongside code change (no feature flag).
- Coordinate with Supabase promotion checklist; monitor observability channel (`booking.create.failure`) for lingering `sqlstate` hits post-deploy.
