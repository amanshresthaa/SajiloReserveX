# Implementation Plan: Enable Allocator V2 By Default

## Objective

We will enable allocator v2 for all flows so that staff tooling uses the orchestrator by default.

## Success Criteria

- [x] `env.featureFlags.allocatorV2.enabled` resolves to `true` without env overrides.
- [x] `isAllocatorV2Enabled()` reflects the new default while still honoring `forceLegacy` and explicit disables.
- [ ] Unit suite for capacity/assignment continues to pass, confirming no regressions.

## Architecture & Components

- `lib/env.ts`: change the default fallback for `allocatorV2.enabled` to `true`; leave shadow/forceLegacy logic unchanged.
- `server/feature-flags.ts`: verify that no additional changes are required; rely on sanity check to ensure helper keeps respecting `forceLegacy`.
- Task docs (`todo.md`, `verification.md`) will capture execution and testing notes.

## Data Flow & API Contracts

Endpoint: N/A (configuration change only)
Request: N/A
Response: Feature-flag helpers now report v2 enabled by default.
Errors: No changes to error shapes; orchestrator already surfaces structured conflicts.

## UI/UX States

- Loading: unaffected (Pure server-side toggle).
- Empty: unaffected.
- Error: existing 409 conflict surfaces remain the same; will monitor during verification.
- Success: manual and auto assignment APIs should continue to behave identically with orchestrator enabled.

## Edge Cases

- Deployments that explicitly set `FEATURE_ALLOCATOR_V2_ENABLED=false` should still disable v2.
- `forceLegacy` should override the new default; confirm via unit-level assertion/spies if necessary.

## Testing Strategy

- Unit: run capacity-related Vitest suites (`pnpm test --filter capacity`) or full `pnpm test`.
- Integration: rely on existing orchestrator integration tests (already in repo).
- E2E: not required for this toggle; defer unless manual QA reveals issues.
- Accessibility: N/A (no UI changes).

## Rollout

- Feature flag: `FEATURE_ALLOCATOR_V2_ENABLED` (default now `true`; disable via env as needed).
- Exposure: immediate; communicate to ops that `forceLegacy` remains available as emergency backstop.
- Monitoring: watch assignment 409 rate (manual/auto) in Ops dashboard logs post-deploy.
