---
task: reservation-pending-error
timestamp_utc: 2025-11-17T11:02:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Reservation schedule hydration error

## Objective

Resolve the React Query hydration rejection for reservation schedules so schedule views load without console errors for all dates and venues (e.g., `white-horse-pub-waterbeach` on 2025-11-18).

## Success Criteria

- [ ] Navigating to reservation schedules for affected venues/dates shows no hydration errors in the console.
- [ ] Schedule data renders successfully (or displays clear error state) for a range of dates without pending-query rejections.

## Architecture & Components

- Data fetching: existing React Query hook `useTimeSlots` querying `scheduleQueryKey([...])` via `/api/restaurants/[slug]/schedule`.
- Components: booking wizard pieces (e.g., `ScheduleAwareTimestampPicker`, `BookingFlowPage`) rely on query persistence configured in `configureQueryPersistence`.
- State: query cache persisted to `localStorage` and rehydrated on load; need to guard hydration of pending queries.

## Data Flow & API Contracts

- Endpoint: `/api/restaurants/[slug]/schedule?date=YYYY-MM-DD` returning schedule JSON as built by `getRestaurantSchedule`.
- Persistence: `configureQueryPersistence` currently excludes pending queries when dehydrating; we need to also filter/cleanup pending queries on **hydrate** to avoid React Query hydration warnings.
- Errors: retain existing server responses but ensure cached pending states are not restored; fresh fetches can fail with standard query error handling.

## UI/UX States

- Loading: reuse existing spinner/placeholder.
- Empty: no slots available for the date.
- Error: with persistence hardened, errors should surface via normal query error state (no hydration rejection spam).
- Success: render schedule grid for the date.

## Edge Cases

- Dates far in future/past (e.g., 2025-11-18 and others).
- Venue with no schedule data.
- Aborted fetches or offline restores leaving pending state in cache.

## Testing Strategy

- Targeted manual verification: navigate to affected venue/date plus others; confirm no console hydration warnings and schedule loads (or shows standard error state).
- Add/extend unit coverage around `configureQueryPersistence` to ensure pending queries from persisted state are ignored/cleaned on hydrate.
- Accessibility: ensure error/empty states remain semantic if UI is touched (likely no UI changes).

## Rollout

- No feature flag expected; small scoped fix.
- Monitor console/network during manual QA; ensure persisted cache no longer triggers hydration warnings.

## DB Change Plan (if applicable)

- Not applicable (no DB migrations anticipated); API contract unchanged.
