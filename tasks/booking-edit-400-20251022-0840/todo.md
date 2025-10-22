# Implementation Checklist

## Setup

- [x] Draft timezone conversion helper for booking updates
- [x] Refactor `handleDashboardUpdate` to use helper

## Core

- [x] Ensure schedule lookups re-run when date shifts across timezones
- [x] Preserve unified validation + side effects after refactor

## UI/UX

- [ ] Confirm dashboard edit mutation still surfaces server errors sensibly (manual check)

## Tests

- [x] Unit: cover ISO→venue conversion (different offsets + day rollover)
- [ ] Integration/manual: exercise API via DevTools once authenticated (pending access)

## Notes

- Assumptions: Supabase data + login available for manual QA; otherwise document blocked steps.
- Deviations:

## Batched Questions (if any)

- None yet
