# Research: DST + Route Context Fixes

## Requirements

- Fix DST gap handling in windowsOverlap to satisfy unit tests.
- Update server route tests to include contextVersion and avoid 400/409.

## Existing Patterns & Reuse

- windowsOverlap in server/capacity/tables.ts does half-open overlap but returns false on invalid DateTimes.
- Manual routes already compute and compare contextVersion against getManualAssignmentContext.

## Constraints & Risks

- Avoid performance regressions in hot paths; only coerce on invalid DateTimes.

## Recommended Direction

- Add best-effort coercion for invalid Luxon DateTimes (advance to next valid minute up to +120m).
- Patch tests to mock getManualAssignmentContext and include matching contextVersion in payloads.
