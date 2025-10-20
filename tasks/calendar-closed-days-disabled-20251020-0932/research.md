# Research: Calendar Closed Dates Visibility

## Existing Patterns & Reuse

- Reservation date selection uses `Calendar24Field` (reserve/features/reservations/wizard/ui/steps/plan-step/components/Calendar24Field.tsx) which wraps the shared `Calendar` component from `components/ui/calendar.tsx` (React DayPicker).
- Disabled dates are controlled via `disabled` matcher passed to the calendar; `Calendar24Field` builds the matcher from `date.minDate` and `state.unavailableDates` provided by `usePlanStepForm`.
- `usePlanStepForm` (reserve/features/reservations/wizard/hooks/usePlanStepForm.ts) tracks a `Map<string, PlanStepUnavailableReason>` (`unavailableDates`). Entries are only added when the active day’s schedule is fetched via `useTimeSlots`.
- `useTimeSlots` (reserve/features/reservations/wizard/services/useTimeSlots.ts) calls `/api/restaurants/[slug]/schedule?date=YYYY-MM-DD` to retrieve a `ReservationSchedule` for a single date; the hook exposes `schedule`, `slots`, and derived helpers.
- Calendar UI already supports disabling dates (`CalendarDayButton` disable styles). Tests cover disabling behaviour when matcher returns true.

## External Resources

- [React DayPicker `onMonthChange` docs](https://react-day-picker.js.org/api/interfaces/DayPickerSingleProps#onmonthchange) — needed to react when the visible month changes to trigger background prefetching.

## Constraints & Risks

- The public schedule endpoint serves one date at a time; naïvely looping over many days may introduce 30+ network calls per month. Need to balance responsiveness with network load (batched prefetch, caching via React Query).
- Calendar must stay responsive and accessible (avoid blocking UI while prefetch runs, keep disabled styling consistent with existing theme).
- Need to respect `minDate` so we don’t fetch/mark past dates.
- Must avoid regressions where map state diverges (e.g. ensure removing entries when availability returns).
- React Query already caches schedules per date; reusing its cache avoids duplicate fetches but we still need to orchestrate queries carefully.

## Open Questions (and answers if resolved)

- Q: Is there an existing API that returns a month of closures/availability?  
  A: Not in the current codebase; only single-date schedule endpoint is exposed publicly. Owner-facing operating-hours API is admin-restricted.
- Q: Can we rely on React Query’s cache to dedupe schedule calls during prefetch?  
  A: Yes — `useTimeSlots` uses `queryKey: ['reservations','schedule', slug, date]`; `queryClient.fetchQuery` with the same key will share cache.

## Recommended Direction (with rationale)

- Extend `usePlanStepForm` to prefetch schedules for every day in the visible month (respecting `minDate`) using the existing schedule endpoint and React Query cache. Derive unavailability (`closed` vs `no-slots`) from each response and update the shared `unavailableDates` map.
- Wire `Calendar24Field` to emit visible month changes (`onMonthChange`) so the hook can trigger prefetch when the calendar navigates; also fire once on mount using the initial month (selected date or min date).
- Centralise map updates via a helper so both the active-date effect and month prefetch path stay in sync (add/remove entries as availability changes). This leverages existing components without introducing new backend APIs and should deliver greyed-out closed days after background fetch completes.
