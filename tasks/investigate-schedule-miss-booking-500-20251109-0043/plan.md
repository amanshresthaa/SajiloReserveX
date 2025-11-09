# Implementation Plan: Schedule Miss & Booking 500 Investigation

## Objective

Identify and fix the root causes of repeated `schedule.fetch.miss` events and `POST /api/bookings` returning 500 "Restaurant not found" for `white-horse-pub-waterbeach` in local dev.

## Success Criteria

- [ ] Reproduce the schedule miss and 500 locally with clear logs.
- [ ] Determine root causes, document them, and implement fixes or mitigations.
- [ ] Verify the fix via `pnpm run dev` (or targeted tests) showing schedules load without misses and booking submission no longer errors.

## Architecture & Components

- Investigate `src/app/api/restaurants/[slug]/schedule` route for schedule fetching logic.
- Investigate `src/app/api/bookings/route.ts` (or analogous) to trace restaurant lookup.
- Engage with Supabase data helpers located in `server/` directory.

## Data Flow & API Contracts

- Understand how the wizard queries schedule data (likely `GET /api/restaurants/{slug}/schedule?date=...`). Ensure contract gracefully handles missing restaurants/dates.
- Confirm booking POST payload includes slug or restaurant ID and how service resolves it.

## UI/UX States

- For the wizard, ensure missing schedule surfaces user-friendly message rather than silent failure.
- Booking submit errors should be descriptive (e.g., "Restaurant unavailable") rather than generic 500.

## Edge Cases

- Absent seed data in dev env.
- Restaurant slug mismatch between UI config and DB.
- Network or Supabase errors.

## Testing Strategy

- `pnpm run dev` to reproduce/resolution.
- Consider targeted unit tests for booking service if logic changes.
- Lint as required for bug fixes.

## Rollout

- No feature flags expected; ensure documentation instructs developers to have necessary seed data or fallback behavior.
