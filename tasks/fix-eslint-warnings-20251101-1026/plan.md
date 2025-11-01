# Implementation Plan: Fix ESLint Warnings

## Objective

We will unblock the commit pipeline by resolving the current ESLint warnings so that the pre-commit hook passes cleanly.

## Success Criteria

- [ ] ESLint runs with zero warnings in the affected files.
- [ ] No functional or type regressions are introduced.

## Architecture & Components

- `server/capacity/tables.ts`: review unused variables and helper function definitions.
- `server/capacity/v2/supabase-repository.ts`: tighten typings and remove unused assignments.

## Data Flow & API Contracts

- No API changes required; ensure repository function signatures remain consistent.

## UI/UX States

- Not applicable (server-side lint fix).

## Edge Cases

- Potential future usage of currently unused helpers—confirm safe to remove or comment out.

## Testing Strategy

- Run `eslint --max-warnings=0` locally.
- Execute targeted unit tests if relevant packages exist (optional given purely lint-driven change).

## Rollout

- No feature flag required.
- Once lint passes, change is ready for review and merge.
