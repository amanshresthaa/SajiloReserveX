# Implementation Checklist

## Setup

- [x] Capture restaurant timezone inside `autoAssignTablesForDate`

## Core

- [x] Reuse timezone-aware policy when computing booking windows and calling `assignTableToBooking`
- [x] Ensure fallback to default timezone remains when Supabase row lacks data

## UI/UX

- [x] No UI changes required

## Tests

- [x] Extend auto-assign unit tests to cover non-default timezone windows
- [x] Run targeted Vitest suite (`pnpm test:ops tests/server/capacity/autoAssignTables.test.ts`)

## Notes

- Assumptions: Auto-assign route continues to use service client; UI already handles response shape.
- Deviations: None currently.

## Batched Questions (if any)

- None
