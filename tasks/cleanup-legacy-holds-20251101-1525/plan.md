# Implementation Plan: Cleanup legacy holds code

## Objective

Remove unused legacy confirm path from holds module with zero behavior change for current APIs.

## Success Criteria

- [ ] Repo typechecks successfully
- [ ] No references to `confirmTableHold` remain

## Architecture & Components

- Edit `server/capacity/holds.ts`: remove `confirmTableHold`, related types and mappers.
- Keep `AssignTablesRpcError`, hold utilities, and conflict evaluation.

## Testing Strategy

- Typecheck via `pnpm typecheck`

## Rollout

- No runtime behavior change; internal clean‑up only.
