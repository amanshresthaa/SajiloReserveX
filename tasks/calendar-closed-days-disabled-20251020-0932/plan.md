# Implementation Plan: Calendar Closed Dates Visibility

## Objective

We will enable guests to see closed or fully booked dates disabled directly in the calendar so that unavailable days cannot be selected.

## Success Criteria

- [ ] Month view greys out (disabled state) for dates where the restaurant is closed or has no available slots before the guest clicks the day.
- [ ] Selecting a disabled day is prevented and the existing unavailable messaging still renders.

## Architecture & Components

- `reserve/features/reservations/wizard/hooks/usePlanStepForm.ts`: add month-level prefetch that populates `unavailableDates` using the existing schedule endpoint; expose a handler for visible-month changes; centralise map updates.
- `reserve/features/reservations/wizard/services/` (new `schedule.ts` helper): share schedule fetch + query key between `useTimeSlots` and month prefetch.
- `reserve/features/reservations/wizard/ui/steps/plan-step/PlanStepForm.tsx`: pass new month-change handler into `Calendar24Field`.
- `reserve/features/reservations/wizard/ui/steps/plan-step/components/Calendar24Field.tsx`: surface `onMonthChange`, set the initial month, and forward to DayPicker.

State: `usePlanStepForm` keeps `unavailableDates` map; month prefetch extends it without blocking existing selection flow.

## Data Flow & API Contracts

Endpoint: `GET /api/restaurants/:slug/schedule?date=YYYY-MM-DD`
Request: slug + ISO date per day (existing).
Response: `{ isClosed: boolean; slots: RawScheduleSlot[]; ... }`
Errors: bubbled through existing `apiClient` error handling (no change).

Month prefetch will reuse React Query caching via shared `queryKey` so that single-date requests still dedupe.

## UI/UX States

- Loading: Calendar should remain interactive; disabled states update asynchronously as prefetch completes.
- Empty: If no date selected yet, initial month uses `minDate` and prefetch populates closures.
- Error: If schedule fetch fails, we log and skip (no regression; dates remain enabled until retried via selection).
- Success: Disabled days appear grey (existing styling) and remain unselectable.

## Edge Cases

- Min date inside month (skip dates before `minDate`).
- Months processed once per session (avoid redundant network calls via memoised month keys).
- Availability changes back to open: helper removes map entry when schedule shows open slots.
- Timezone parsing from `YYYY-MM-DD` strings (use local Date constructors to avoid off-by-one).

## Testing Strategy

- Unit: update/add tests around `usePlanStepForm` to ensure `updateUnavailableDates` helper toggles map correctly; adjust existing tests for extra schedule calls.
- Integration: extend `Calendar24Field` test to assert `onMonthChange` invoked on mount.
- E2E: rely on manual QA to verify disabled styling in browser.
- Accessibility: confirm disabled days remain non-focusable and announcements unchanged.

## Rollout

- No feature flag.
- Deployment via existing pipeline; monitor booking funnel analytics for anomaly after release.
