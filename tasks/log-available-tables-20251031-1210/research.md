# Research: Log Available Tables After Assignment

## Requirements

- Functional:
  - When auto-assignment succeeds for a booking, the telemetry/log payload should record the remaining supply of tables considered by the selector. Specifically capture how many tables stayed unassigned (and optionally which ones) after removing the tables chosen for the booking.
  - Ensure the persisted auto-assign snapshots (`logs/auto-assign/log/*/*.json`) include the new availability context so downstream analytics can trace supply depletion across the decision sequence.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Telemetry payloads must stay JSON-serialisable and continue to pass sanitisation (`server/capacity/telemetry.ts`).
  - Avoid materially increasing payload size; reuse existing table summaries instead of dumping whole rows.
  - Maintain compatibility with tests that stub `emitSelectorDecision` (see `tests/server/capacity/autoAssignTables.test.ts` and `manualConfirm.test.ts`).

## Existing Patterns & Reuse

- `autoAssignTablesForDate` (`server/capacity/tables.ts:3244-3655`) orchestrates booking iteration, holds planner output in `availableTables`, and calls `recordDecision` after each attempt.
- `recordDecision` (`server/capacity/tables.ts:3181-3187`) wraps `emitSelectorDecision`, which in turn sanitises payloads (JSON redaction) before logging or storing.
- `SelectorDecisionEvent` / `SelectorDecisionCapture` definitions live in `server/capacity/telemetry.ts:70-154`, providing a structured payload already persisted via `persistDecisionSnapshots`.
- Candidate summaries already expose `tableIds`, `tableNumbers`, `totalCapacity`, etc. (`summarizeCandidate` in `server/capacity/telemetry.ts:223-264`), so we can follow the same shape for remaining tables if needed.

## External Resources

- None required; all data and helper utilities exist within the capacity module.

## Constraints & Risks

- Need to ensure the additional field is optional when no assignment occurs (skip paths still invoke `recordDecision`).
- Updating type definitions will ripple into tests that assert specific payload shapes; these must be refreshed.
- Miscounting remaining tables (e.g., ignoring planner pruning or holds) could mislead analytics; safest approach is to derive directly from `filterAvailableTables` output used during selection.

## Open Questions (owner, due)

- Q: Should we record availability for skipped decisions?  
  A: Default to `null` unless requirements expand—user emphasised “when bookings are assigned,” so scope to successful assignments.

## Recommended Direction (with rationale)

- Extend `SelectorDecisionEvent` with an `availabilitySnapshot` capturing `totalCandidates` (length of `availableTables` before assignment) and `remainingAfterSelection` (count after removing assigned table IDs). For transparency, include an array of `remainingTables` with `id` and `tableNumber`, mirroring candidate summaries but lighter.
- Populate the snapshot inside `autoAssignTablesForDate` right before invoking `recordDecision` on successful assignments; reuse the locally scoped `availableTables` and the `topPlan` tables to guarantee consistency with planner logic.
- Propagate the new field through `buildSelectorDecisionPayload`, sanitisation, and JSON persistence so logs and live telemetry stay aligned without duplicating computation.
