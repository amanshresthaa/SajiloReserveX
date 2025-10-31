# Implementation Checklist

## Setup

- [x] Map all test files asserting on `emitSelectorDecision` payloads.

## Core

- [x] Extend telemetry event/capture types with optional `availabilitySnapshot`.
- [x] Update `buildSelectorDecisionPayload` sanitisation pipeline to include the new field.
- [x] Compute `availabilitySnapshot` (total candidates, remaining after selection, remaining table ids/numbers) during successful assignments in `autoAssignTablesForDate` and pass through `recordDecision`.
- [x] Default `availabilitySnapshot` to `null` for skip/error paths to keep payload shape stable.

## UI/UX

- [ ] n/a (backend telemetry only)

## Tests

- [x] Refresh expectations in `autoAssignTables.test.ts`.
- [x] Refresh expectations in `manualConfirm.test.ts`.
- [x] Refresh expectations in `telemetry.sanitization.test.ts`.
- [x] Run relevant Vitest suites locally.

## Notes

- Assumptions:
  - User request targets successful auto-assignment decisions; skipped bookings expose `availabilitySnapshot: null`.
- Deviations:
  - None.

## Batched Questions (if any)

- none yet
