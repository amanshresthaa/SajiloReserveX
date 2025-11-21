---
task: pnpm-workspace-packages-fix
timestamp_utc: 2025-11-21T10:08:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Fix pnpm workspace packages field

## Objective

We will add a `packages` field to `pnpm-workspace.yaml` so the workspace configuration matches the single root package and stops pnpm errors about missing package definitions.

## Success Criteria

- [ ] `pnpm-workspace.yaml` declares `packages` covering the current workspace (root).
- [ ] pnpm no longer reports “packages field missing or empty”.
- [ ] Existing `patchedDependencies` entries remain unchanged.

## Architecture & Components

- pnpm workspace config: add `packages` array with the root package (`.`); no application/runtime code changes.

## Data Flow & API Contracts

- N/A (config-only change).

## UI/UX States

- N/A (no UI surface).

## Edge Cases

- YAML indentation must be valid so pnpm parses both `packages` and `patchedDependencies`.
- Avoid adding globs that could capture non-package folders.

## Testing Strategy

- After updating the config, run a lightweight pnpm workspace command (e.g., `pnpm -w list --depth 0`) to confirm the workspace parses without the missing-packages error.
- No UI QA required for this non-UI configuration change.

## Rollout

- Direct apply; no feature flags needed.

## DB Change Plan (if applicable)

- Not applicable (no database changes).
