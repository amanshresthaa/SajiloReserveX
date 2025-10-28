# Implementation Plan: Sprint 1 Service Window Integrity

## Objective

We will harden booking/hold time computations and telemetry so that fallback service windows, overlap detection, and table availability decisions remain correct and conservative across timezones.

## Success Criteria

- [ ] `computeBookingWindowWithFallback` throws `ServiceOverrunError` when fallback schedule exceeds service boundary, with tests covering the scenario.
- [ ] Single Luxon-based overlap helper enforces half-open semantics and passes unit + property tests.
- [ ] `confirmHoldAssignment` detects and aborts booking mismatches while emitting telemetry.
- [ ] Telemetry emitted via `emitHoldConfirmed` never substitutes table IDs for zone, with metadata flag if zone missing.
- [ ] `findSuitableTables` resolves restaurant timezone consistently.
- [ ] `isTableAvailableV2` throws on Supabase errors and tests assert conservative behaviour.

## Architecture & Components

- `computeBookingWindowWithFallback`: add service end validation mirroring primary window guard; reuse `serviceEnd` from policy.
- `windowsOverlap`: refactor to accept interval-like inputs (ISO strings or Luxon `DateTime`), parse via Luxon with `setZone: true`, and remove `windowsOverlapMs`.
- `confirmHoldAssignment`: extend Supabase query to select `booking_id`; pre-commit validation triggers `emitRpcConflict` and throws `AssignTablesRpcError`.
- `synchronizeAssignments` → `emitHoldConfirmed`: use `holdContext.zoneId ?? ""`, optionally attach `{ unknownZone: true }`.
- `findSuitableTables`: load timezone from booking (joined restaurant) → fallback to policy; pass into `getVenuePolicy({ timezone })`.
- `isTableAvailableV2`: on Supabase error, throw `AssignTablesRpcError` (or domain error) so callers can handle.

## Data Flow & API Contracts

- Supabase reads: `table_holds` now returns `booking_id`; `booking_table_assignments` call remains but error handling changes (throws).
- Telemetry payload (`emitHoldConfirmed`): `zoneId` string, `metadata` optional JSON with `unknownZone`.
- Errors: `AssignTablesRpcError` (code `HOLD_BOOKING_MISMATCH`) for mismatched holds; `ServiceOverrunError` for fallback; `AssignTablesRpcError` or similar for Supabase failures in availability.

## UI/UX States

- No direct UI impact; ensure any surfaced errors retain actionable messaging upstream (documented for manual tooling).

## Edge Cases

- Fallback start near service boundary (e.g., service ended) causing guard to trigger.
- Overlaps with identical endpoints (ensuring `[a,b)` vs `[b,c)` non-overlap).
- DST transitions and explicit timezone offsets in ISO strings.
- Holds with `booking_id = null` (per schema) and missing `zone_id`.
- Supabase client returning `error` while `data` null; ensure thrown path tested.

## Testing Strategy

- Unit: extend `tests/server/capacity` suites for fallback overrun, hold mismatch, timezone resolution, telemetry field, Supabase error throw path.
- Property: add `fast-check` based test confirming overlap semantics on randomized ISO intervals.
- Integration: adjust existing overlap tests to new helper; verify `isTableAvailableV2` fixture continues to cover buffer collisions.
- Regression: run `pnpm test:ops` (server Vitest) after changes; recommend auto-assign E2E + manual late-slot test per acceptance (note in verification).

## Rollout

- Feature flag: none; changes apply immediately.
- Exposure: deploy via normal release; monitor increase of `ServiceOverrunError` + `capacity.rpc.conflict`.
- Monitoring: rely on existing observability events (`capacity.hold.confirmed`, `capacity.rpc.conflict`); document telemetry audit.
- Kill-switch: revert commit or temporarily relax fallback guard if operational incidents arise (coordinate with scheduling team).
