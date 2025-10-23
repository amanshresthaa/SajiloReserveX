# Implementation Plan: Fix schedule slot nulls in restaurant schedule

## Objective

We will ensure restaurant schedule slots never include null entries so that type checks pass and schedule rendering logic receives consistent data.

## Success Criteria

- [ ] Build succeeds without type errors in schedule generator
- [ ] Schedule slot list contains only valid `RestaurantScheduleSlot` objects

## Architecture & Components

- Modify `computeSlots` within `server/restaurants/schedule.ts` so it constructs the slot list without intermediate nulls.
- Reuse existing helper functions; ensure return type stays `RestaurantScheduleSlot[]`.

## Data Flow & API Contracts

- Endpoint: `GET /api/restaurants/[slug]/schedule` and related server callers consume `RestaurantSchedule` with `slots: RestaurantScheduleSlot[]`; no contract change beyond ensuring type safety.
- Request/Response/Errors remain unchanged; we're tightening implementation.

## UI/UX States

- Not a UI change; downstream consumers continue to receive slot arrays without nulls.

## Edge Cases

- Closing guard still prevents slots extending beyond closing time, respecting `lastSeatingBufferMinutes` and per-option durations.
- Ensure zero-slot days still return empty arrays.

## Testing Strategy

- Unit: Add/adjust tests in `tests/server/restaurants/schedule.test.ts` (or create if absent) to cover slots trimmed at closing.
- Integration/E2E/Accessibility: Not applicable for this backend utility.

## Rollout

- No rollout steps; change ships with next build once tests pass.
