# Implementation Plan: Edge Cases — Invalid Inputs and DST Handling

## Objective

Ensure predictable demand-profile time windows and robust, simple overlap checks across DST boundaries.

## Success Criteria

- [ ] `normalizeWindow` semantics documented and tested for invalid/edge inputs.
- [ ] `windowsOverlap` free of fragile DST-specific heuristics; tests pass across DST transitions.

## Architecture & Components

- `server/capacity/demand-profiles.ts`:
  - Refine `normalizeWindow` logic and JSDoc.
  - Log a warning when `end <= start` and both provided; treat as remainder-of-day.
- `server/capacity/tables.ts`:
  - Remove incorrect hard-coded DST hour mapping.
  - Remove boundary-touch DST overlap exception; rely on half-open intersection.

## Data Flow & API Contracts

- No external API changes. Internal behavior documented in code comments/JSDoc.

## UI/UX States

- N/A

## Edge Cases

- Missing/invalid `start`/`end` values.
- `end <= start` with both provided.
- Non-existent local times during DST spring-forward; repeated times during fall-back.

## Testing Strategy

- Unit tests in `tests/server/capacity`:
  - `normalizeWindow` cases (missing/invalid/wrap/bounds).
  - `windowsOverlap` around DST transitions (America/New_York, Europe/Berlin).

## Rollout

- No flags. Monitor logs for `[demand-profiles] normalizeWindow adjusted` warnings after release.
