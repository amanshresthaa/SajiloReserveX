# Implementation Plan: Lint Warning Cleanup

## Objective

Ensure `server/ops/table-timeline.ts` is free of ESLint warnings so git hooks succeed without altering business logic.

## Success Criteria

- [ ] All lint warnings in the file resolved (no `no-explicit-any`, no unused identifiers).
- [ ] Pre-commit lint task passes locally.

## Architecture & Components

- Target file: `server/ops/table-timeline.ts`.
- Update type definitions and helper utilities to use concrete interfaces where `any` is used.

## Data Flow & API Contracts

- No API changes. Only TypeScript typings and dead code removal, ensuring compatibility with existing exports.

## UI/UX States

- Not applicable (server utility module).

## Edge Cases

- Ensure inferred types cover optional properties to avoid regressions.
- Maintain compatibility with callers expecting current shapes.

## Testing Strategy

- Run ESLint to confirm warnings resolved.
- Run targeted unit tests if available for `table-timeline` (e.g., `tests/server`).

## Rollout

- No feature flag required. Change is immediate once merged.
