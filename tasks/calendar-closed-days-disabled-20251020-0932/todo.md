# Implementation Checklist

## Setup

- [x] Add shared schedule query helper (query key + fetcher)

## Core

- [x] Update `usePlanStepForm` to prefetch month schedules and centralise unavailable map updates
- [x] Wire month-change handler through `PlanStepForm` into `Calendar24Field`

## UI/UX

- [x] Update `Calendar24Field` to emit month changes and set initial month/defaultMonth

## Tests

- [x] Adjust/extend unit tests for new helpers and ensure mocks handle prefetch

## Notes

- Assumptions: schedule endpoint remains performant for per-day fetch; React Query caching dedupes repeated queries.
- Deviations: Manual Chrome DevTools QA deferred; requires running the app with a browser session.

## Batched Questions (if any)

- None
