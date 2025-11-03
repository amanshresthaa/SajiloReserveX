# Implementation Plan: DST + Context Version

## Objective

- Make windowsOverlap robust to DST forward gaps.
- Ensure route tests include contextVersion and continue validating error mapping.

## Success Criteria

- [ ] tests/server/capacity/windowsOverlap.edgecases.test.ts passes.
- [ ] tests/server/ops/manualAssignmentRoutes.test.ts passes (no 400/409 due to missing contextVersion).

## Architecture & Components

- server/capacity/tables.ts: enhance intervalPointToMillis for Luxon invalid DateTimes.
- tests/server/ops/manualAssignmentRoutes.test.ts: add contextVersion and mock getManualAssignmentContext.

## Rollout

- No flags.
