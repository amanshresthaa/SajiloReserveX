# Implementation Plan: Instant Closed-Days Marking

## Objective

We will make the booking date picker mark closed days instantly so that users immediately see unavailable dates without waiting for per-day schedule fetches.

## Success Criteria

- [ ] Endpoint returns closed days within ~50ms for typical month ranges.
- [ ] Date picker disables closed days immediately on month render.

## Architecture & Components

- API route: `src/app/api/restaurants/[slug]/closed-days/route.ts`
  - Reads weekly hours + in-range overrides; outputs `{ timezone, closed: string[] }`.
- Server helper: `server/restaurants/closedDays.ts`
  - Computes closed days for a date range (timezone-aware DOW).
- Client service: `reserve/features/reservations/wizard/services/closedDays.ts`
  - Fetches closed days for a month range.
- Picker update: `ScheduleAwareTimestampPicker.tsx`
  - Prefetch closed days on initial month and on month change.
  - Merge with existing disabled-day map from schedules.

## Data Flow & API Contracts

Endpoint: GET /api/restaurants/:slug/closed-days?start=YYYY-MM-DD&end=YYYY-MM-DD
Response: { timezone: string; closed: string[] }
Errors: { error, details? }

## UI/UX States

- Loading: Existing “Loading availability…” remains for slots; closed days render instantly.
- Error: If closed-day prefetch fails, silently degrade to current behavior.

## Edge Cases

- Invalid date params → 400.
- No weekly rows → treat as closed by default.
- Invalid opens/closes or reversed times → treat as closed.

## Testing Strategy

- Unit-light: rely on existing schedule tests; spot-check helper with a narrow range.
- Manual QA: verify month renders with immediate closed-day disabling.

## Rollout

- No flags. Endpoint is read-only. Safe to ship.
