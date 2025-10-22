# Implementation Checklist

## Setup

- [x] Review booking schema and type definitions

## Core

- [x] Align loyalty points property with existing types

## UI/UX

- [ ] Not applicable

## Tests

- [x] Run `pnpm run build`

## Notes

- Assumptions:
- Supabase generated types should eventually be regenerated to capture future schema changes.
- Deviations:
- Updated `src/app/api/test-email/route.ts` mock booking to include `loyalty_points_awarded` after type change.

## Batched Questions (if any)

-
