# Implementation Checklist

## Setup

- [x] Create task folder + SDLC stubs.

## Core

- [x] Trigger `prefetchVisibleMonth` as soon as `usePlanStepForm` mounts with a restaurant slug.
- [x] Ensure date disabling logic treats `loadingDates` as blocked.

## UI/UX

- [x] Visually communicate loading (pulsing dot already exists) while dates are disabled.

## Tests

- [x] Add/adjust `Calendar24Field` test for `loadingDates`.
- [x] Add unit coverage ensuring eager prefetch is invoked on mount (hook or form test).

## Notes

- Assumptions: backend batch endpoint is out of scope; we rely on existing per-date schedule fetches.
- Deviations: following existing React Query per-date strategy even though product note mentions a batch API.

## Batched Questions (if any)

- None
