# Implementation Plan: Log Available Tables After Assignment

## Objective

Expose remaining table availability inside selector telemetry so ops analysts can trace inventory consumption across automatic assignments.

## Success Criteria

- [ ] `SelectorDecisionEvent` / persisted snapshots include `availabilitySnapshot` with counts (total candidates, remaining after selection) whenever a booking is assigned.
- [ ] Assigned decisions in `logs/auto-assign/...` show the new field populated; skipped decisions keep it `null`.
- [ ] Vitest suites touching selector telemetry (`autoAssignTables`, `manualConfirm`, `telemetry.sanitization`) pass with updated expectations.

## Architecture & Components

- `server/capacity/tables.ts`: compute availability snapshot from `availableTables` and the selected plan, pass into `recordDecision`.
- `server/capacity/telemetry.ts`: extend `SelectorDecisionEvent` / `SelectorDecisionCapture`, update `buildSelectorDecisionPayload` sanitisation pipeline.
- Unit tests under `tests/server/capacity/*` that assert on telemetry payloads.

## Data Flow & API Contracts

- New optional field `availabilitySnapshot` `{ totalCandidates: number; remainingAfterSelection: number; remainingTables: Array<{ id: string; tableNumber: string }> }`.
- Populated only when `selected` candidate exists and `availableTables` was computed; otherwise `null`.
- Propagated through `emitSelectorDecision`, JSON logging, and persisted snapshots.

## UI/UX States

- Not applicable (backend telemetry change only).

## Edge Cases

- Assignments that fail (overlap, RPC error) must still emit `availabilitySnapshot: null`.
- Ensure we gracefully handle planners returning zero tables (skip events) without trying to compute snapshot.
- Avoid double-counting if multiple tables assigned; filter remaining tables using a `Set` of selected IDs.

## Testing Strategy

- Update & run `pnpm vitest tests/server/capacity/autoAssignTables.test.ts`.
- Update & run `pnpm vitest tests/server/capacity/manualConfirm.test.ts`.
- Update `pnpm vitest tests/server/capacity/telemetry.sanitization.test.ts`.
- Spot-check generated log payload via unit test assertions rather than manual file writes.

## Rollout

- Pure telemetry change; no feature flag needed. Mention in task notes; no additional rollout steps.
