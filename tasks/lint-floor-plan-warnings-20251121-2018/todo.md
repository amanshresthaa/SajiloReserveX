---
task: lint-floor-plan-warnings
timestamp_utc: 2025-11-21T20:18:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm lint errors/warnings reported by pre-commit on floor plan page.

## Core

- [x] Remove unused imports and variables.
- [x] Fix missing dependency in `useEffect`.
- [x] Address `useMemo` dependency warning by moving `tables` logical expression inside `useMemo`.
- [x] Escape unescaped quotes in JSX text.

## Tests

- [x] Run `pnpm exec eslint src/app/app/(app)/seating/floor-plan/page.tsx --max-warnings=0`.

## Notes

- Assumptions: No behavioral change; only lint compliance.
- Deviations: None.
