# Implementation Checklist

## Setup

- [x] Inspect `server/capacity/tables.ts` for group typings and usages

## Core

- [x] Update type handling so `mergeGroup` resolves to a normalized record
- [x] Adjust initialization logic to match the type updates and ensure `capacity` exists

## UI/UX

- [ ] N/A

## Tests

- [x] Run `pnpm run build`
- [ ] Run targeted capacity tests if they exist

## Notes

- Assumptions:
- Deviations: Added `getMergeGroupCapacity` helper instead of modifying Supabase types directly. `pnpm test -- tests/server/capacity/autoAssignTables.test.ts` currently fails due to unresolved Next.js route imports unrelated to this change.

## Batched Questions (if any)

- None
