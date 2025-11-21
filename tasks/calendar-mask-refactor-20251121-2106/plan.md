---
task: calendar-mask-refactor
timestamp_utc: 2025-11-21T21:06:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Calendar mask prefetch removal

## Objective

We will enable guests to experience a faster booking calendar by using only calendar masks for open/closed days and fetching schedules only for the selected date.

## Success Criteria

- [ ] Calendar view only issues `calendarMask` requests for visible months; no schedule prefetch.
- [ ] Selecting a date triggers exactly one schedule fetch for that date and shows correct messaging.
- [ ] Closed days derived from masks are disabled; open days remain selectable.

## Architecture & Components

- useUnavailableDateTracking: restrict prefetch to calendar masks; simplify state.
- Calendar UI consumers: rely on `'closed'` vs other statuses only.
- useTimeSlots / usePlanSlotData: ensure date-selected scheduling only.
- Modularization: isolate calendar mask helpers (prefetch/apply) for clarity and testing.

## Data Flow & API Contracts

Endpoint: GET calendarMask for given month (existing).
Endpoint: GET schedule for selected date via useTimeSlots (existing).
State: unavailableDates maps date ISO -> status (`'closed'` | `null`).

## UI/UX States

- Loading calendar (mask prefetch)
- Closed day (disabled)
- Open day with slots (time slots visible)
- Open day without slots (message shown)
- Error fetching schedule (fallback message)

## Edge Cases

- Min date boundary when prefetched previous month should be skipped.
- Invalid mask ranges avoid state updates.
- Restaurant slug changes reset mask state only.

## Testing Strategy

- Unit: applyCalendarMask marks closed days; prefetchVisibleMonth calls mask prefetch for current/prev/next as allowed.
- Integration/unit: calendar component uses only closed flags; no-schedule messaging on open but empty slots.
- Manual QA: device/browser smoke; verify network calls and UX for closed vs open/full days.

## Rollout

- Behind existing flows (no new flag).
- Monitor network request counts pre/post in QA; log anomalies manually.

## DB Change Plan (if applicable)

- N/A (no DB changes).
