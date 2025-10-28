# Implementation Checklist

## Setup

- [x] Add `fast-check` devDependency (ensure lockfile updated via pnpm) for property tests.

## Core

- [x] Guard fallback window against service overruns in `computeBookingWindowWithFallback`.
- [x] Refactor overlap logic to single Luxon-based helper and update call sites.
- [x] Enforce hold ↔ booking linkage in `confirmHoldAssignment` with telemetry.
- [x] Adjust `emitHoldConfirmed` zone field and metadata handling.
- [x] Apply restaurant timezone resolution in `findSuitableTables`.
- [x] Make `isTableAvailableV2` throw on Supabase errors.

## UI/UX

- [ ] Confirm upstream messaging paths acknowledge new errors (document if out-of-band).

## Tests

- [x] Update existing overlap and availability tests to match new helper semantics.
- [x] Add property test with `fast-check` for half-open interval semantics.
- [x] Cover fallback overrun, hold mismatch, timezone flow, telemetry metadata, and Supabase error path.
- [x] Run `pnpm test:ops` (or targeted Vitest suites) and capture results.

## Notes

- Assumptions:
- Deviations:
  - `pnpm test:ops` fails in baseline due to missing `env.node.env` in rate limiter and syntax error in unrelated owner service-period tests; recorded in verification with targeted suite passes for capacity modules.

## Batched Questions (if any)

-
