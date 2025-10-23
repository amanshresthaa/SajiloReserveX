# Implementation Checklist

## Setup

- [x] Review ScheduleAwareTimestampPicker usage contexts
- [x] Confirm directive strategy with Next.js docs

## Core

- [x] Adjust component exports to satisfy client requirements
- [x] Validate module boundaries for server consumption
- [x] Resolve query persistence type mismatch blocking build

## UI/UX

- [ ] Verify no runtime warnings in browser console

## Tests

- [ ] Run `pnpm run build`

## Notes

- Assumptions:
  - Query persistence helpers are only invoked in browser contexts.
- Deviations:
  - Extended scope to align TanStack types and story mocks surfaced by full build.

## Batched Questions (if any)

- None yet
