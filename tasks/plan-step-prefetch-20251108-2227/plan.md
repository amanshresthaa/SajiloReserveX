# Implementation Plan: Plan Step Prefetch

## Objective

Ensure Plan step visitors immediately see accurate closed/disabled dates—especially weekends—without needing to click the calendar, by eagerly prefetching month schedules and blocking interaction while data is loading.

## Success Criteria

- [ ] `prefetchVisibleMonth` fires when the Plan step hook mounts (before any calendar UI interaction).
- [ ] `Calendar24Field` treats entries in `loadingDates` as disabled so users cannot pick unknown dates.
- [ ] Updated unit tests cover both the eager prefetch trigger and the disabled loading-day UX.

## Architecture & Components

- `usePlanStepForm` (`reserve/.../hooks/usePlanStepForm.ts`): add a mount-time `useEffect` that calls `prefetchVisibleMonth` with the current selection (or min date) whenever a restaurant slug becomes available. Keep using existing abort logic and `prefetchedMonthsRef` to avoid duplicate fetches.
- `Calendar24Field` (`reserve/.../components/Calendar24Field.tsx`): extend the `disabled` matcher so it returns `true` when a date is present in `loadingDates` and pass the modifier class so day buttons show the disabled treatment while a fetch is pending.

## Data Flow & API Contracts

- Continue relying on `fetchReservationSchedule` (single-date endpoint). No new API contract introduced.
- `prefetchVisibleMonth` fans out to React Query per-date requests; the new effect just kicks it off earlier.

## UI/UX States

- Loading: `Calendar24Field` now disables pending days and continues to show the existing pulsing indicator via `modifiersClassNames`.
- Success: Days become enabled once a schedule returns open slots; closed days remain disabled as today.
- Error: Prefetch already updates `unavailableDates` to `'unknown'`; behavior unchanged.

## Edge Cases

- Restaurant slug flips (user switches venue) — clearing refs is already handled inside `useUnavailableDateTracking`; ensure the new effect observes the slug so prefetch restarts.
- Dates before `minDate` — still blocked by existing `endOfDay < minDate` logic.

## Testing Strategy

- Extend `Calendar24Field` unit tests to assert that a day contained in `loadingDates` is rendered as disabled.
- Add a focused hook test (in `PlanStepForm.test.tsx`) confirming `prefetchVisibleMonth` is invoked on mount when a slug is present (can spy via custom test helper).

## Rollout

- No feature flag needed; change is scoped to the Plan step. After tests/lint pass, surface evidence in `verification.md`. Manual UI QA via DevTools MCP will confirm the disabled state in-browser.
