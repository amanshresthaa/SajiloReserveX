# Implementation Checklist

## Setup

- [x] Capture research and plan artifacts in task folder

## Core

- [x] Short-circuit `extractConflictsForTables` with bitset pre-check
- [x] Scope Supabase loaders to `.in` queries while preserving order
- [x] Document and centralize `windowsOverlap` usage
- [x] Expose internals needed for parity testing
- [x] Record synthetic benchmark evidence for conflict extraction speedup

## UI/UX

- [ ] Not applicable (no UI changes)

## Tests

- [x] Add bitset parity regression tests
- [x] Cover `isWindowFree` occupancy expectations
- [x] Update overlap unit tests to reuse canonical helper
- [x] Run targeted Vitest suites (capacity + property tests)
- [x] Document benchmark + telemetry checks in `verification.md`

## Notes

- Assumptions: Existing lint warnings in `server/capacity/tables.ts` remain out of scope.
- Deviations: Benchmark pending once implementation stabilizes.

## Batched Questions (if any)

- None at this time
