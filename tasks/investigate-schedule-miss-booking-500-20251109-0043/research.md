# Research: Schedule Fetch Misses & Booking 500

## Requirements

- Functional: Determine why `/reserve/r/white-horse-pub-waterbeach` triggers repeated `schedule.fetch.miss` events and why POST `/api/bookings` returns 500 "Restaurant not found" during the wizard submit flow; outline fixes.
- Non-functional: Preserve telemetry clarity; avoid breaking local dev assumptions; maintain a11y unaffected.

## Existing Patterns & Reuse

- Schedule fetching: likely via `reserve/features/reservations/wizard` hooks calling `api/restaurants/[slug]/schedule`; existing server handlers under `src/app/api/restaurants/[slug]/schedule/route.ts` (or similar) and `server/` modules for booking creation.
- Booking submission: `POST /api/bookings` likely uses `server/reservations` service (search in repo) and requires restaurant lookup by slug.

## External Resources

- N/A at this stage.

## Constraints & Risks

- Data source may expect seeded restaurant in Supabase; dev env might lack `white-horse-pub-waterbeach` entry.
- Fix might require seeding/test data adjustments or graceful fallback to stub schedule/restaurant data for dev.

## Open Questions

1. Is the seed data present locally for `white-horse-pub-waterbeach`? (Confirmed: yes; Supabase query shows slug + id exist.)
2. Should schedule misses be logged as warnings instead of errors when seeds missing? (Resolved: actual misses were aborts, not missing data.)

## Recommended Direction

- Inspect schedule API handler and booking POST handler to confirm they require remote Supabase data and fail when restaurant slug absent.
- Provide fallback or developer guidance to load seeds; or alter env/dev config to point to existing restaurant slug.
- After understanding root cause, implement fix ensuring `schedule.fetch.miss` reflects genuine misses only and booking submissions return 400/404 with actionable message when restaurant absent.
- Identified findings:
  - `schedule.fetch.miss` spam is caused by `AbortError`s from prefetch controllers; treat aborts as expected and skip analytics/logging.
  - `POST /api/bookings` 500 occurs when the payload lacks `restaurantId`, causing the server to fall back to a stale default ID (`39cb...`). Ensure drafts never submit without a valid restaurant id and update defaults to the actual Waterbeach venue.
