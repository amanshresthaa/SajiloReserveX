# Implementation Checklist

## Setup

- [x] Review current assign_tables_atomic_v2 SQL definition and dependencies
- [x] Identify current conflict detection logic relying on dates

## Core

- [x] Update RPC signature/logic to accept precise start/end timestamps
- [x] Adjust RPC internals to use range overlap predicates
- [x] Persist precise start/end in booking_table_assignments upsert
- [x] Add exclusion constraint for overlapping assignments
- [x] Add TS stopgap to update booking_table_assignments.start_at/end_at when confirming assignments
- [x] Ensure availability checks (isTableAvailableV2) query precise windows
- [x] Align manual selection/hold conflict detection with stored assignment windows

## UI/UX

- [ ] N/A

## Tests

- [x] Update server RPC wrapper tests to reflect new parameters
- [x] Run targeted Vitest suites for capacity/ops manual routes
- [x] Extend mocks/coverage for new stopgap updates
- [x] Cover manual hold validation against precise assignment windows

## Notes

- Assumptions: Legacy booking_table_assignments rows can retain null start/end values; partial GiST constraint skips them until refreshed.
- Deviations:
  - Scoped migration avoids re-emitting get_or_create_booking_slot changes to limit drift.
  - Added SQL bump to reuse existing assignment rows on unique constraint conflicts by aliasing booking_table_assignments columns to avoid ambiguous references.
  - loadAdjacency now falls back to dual `.in` lookups when Supabase client mocks do not expose `.or`, preserving undirected graph behaviour in tests.

## Batched Questions (if any)

- None yet
