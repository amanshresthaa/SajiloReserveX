# Implementation Checklist

## Setup

- [x] Add `luxon` dependency and ensure lockfile updates cleanly.
- [x] Scaffold `server/capacity/policy.ts` with type definitions and exports.

## Core

- [x] Implement policy helpers (`whichService`, `serviceEnd`, `bandDuration`, etc.) with Luxon.
- [x] Refactor `computeBookingWindow` and `windowsOverlap` in `server/capacity/tables.ts` to use policy + buffers.
- [x] Update booking schedule loading/sorting to rely on `start_at` and block intervals; propagate new errors.

## UI/UX

- [x] N/A (backend-only change).

## Tests

- [x] Add unit tests for `policy.ts`.
- [x] Add/refresh tests for `computeBookingWindow` + overlap behaviour.
- [x] Update `autoAssignTables` tests to cover buffer rejection and overrun cases.

## Notes

- Assumptions:
  - Restaurant timezone is sourced from Supabase; fallback remains Europe/London until per-venue overrides exist.
  - Post-buffer is 15 minutes; pre-buffer remains 0 unless future tasks demand otherwise.
- Deviations:
  - Legacy `end_time` values will be ignored in favour of policy-driven computation; record in PR notes.

## Batched Questions (if any)

- None at this stage.
