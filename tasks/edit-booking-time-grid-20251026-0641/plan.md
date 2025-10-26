# Implementation Plan: Edit Booking Time Grid

## Objective

Ensure the edit booking modal keeps the available time grid visible when a user picks a different slot on the same date so visitors can compare and adjust without losing context.

## Success Criteria

- [ ] Selecting any alternate time preserves the slot grid, merely updating the active highlight.
- [ ] Availability warnings (“No available times…”) only appear when the schedule truly has no enabled slots.

## Architecture & Components

- `ScheduleAwareTimestampPicker.tsx`: introduce a guard around the cache-reset effect so it executes only when the restaurant slug or base date changes. Use a ref to remember the last slug/date signature.
- Retain current exports (`index.ts`) so other callers remain untouched.

## Data Flow & API Contracts

- No API schema changes. The picker still pulls schedules via `fetchReservationSchedule`. We simply avoid wiping `scheduleStateByDate` during time-only changes, preventing false “no availability” states.

## UI/UX States

- Grid remains populated post-selection; `Calendar24Field` keeps its datalist suggestions since `availableSlots` stays non-empty.
- Existing behaviours for closed dates or empty schedules remain intact (message surfaces when appropriate).

## Edge Cases

- Switching bookings (new slug or different base date) should still clear cached data and rehydrate correctly.
- Ensure rapid time toggles don’t degrade performance or leave stale validation errors.

## Testing Strategy

- Automated: `npm run typecheck`; run targeted unit/integration tests if available (e.g., picker tests) after adjustments.
- Manual QA via Chrome DevTools MCP (pending auth) focusing on time selection, date switches, and unavailable-day scenarios.

## Rollout

- No feature flag. Ship after QA; document in `verification.md`. Monitor for regressions mentioned in discovery video.
