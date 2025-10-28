# Research: Enable Allocator V2 By Default

## Existing Patterns & Reuse

- `lib/env.ts` consolidates runtime feature-flag defaults. `featureFlags.allocatorV2.enabled` currently falls back to `false` when the env var is absent.
- `server/feature-flags.ts` exposes `isAllocatorV2Enabled`, `isAllocatorV2ForceLegacy`, and `isAllocatorV2ShadowMode` that gate the orchestrator-only flows shipped in `server/capacity/tables.ts` (all legacy fallbacks already removed per previous task).
- Unit suites under `tests/server/capacity/` rely on explicit env overrides (`process.env.FEATURE_ALLOCATOR_V2_ENABLED = 'true'`) but otherwise consume the same feature flag helpers.

## External Resources

- Prior task notes in `tasks/allocator-rebuild-20251028-0446/` detail the orchestrator rollout strategy and confirm tests already target v2 behaviour.
- Supabase RPCs have been removed from the hot path; no external migration docs are needed for this toggle.

## Constraints & Risks

- Need to preserve the `forceLegacy` escape hatch: enabling by default must still allow operators to opt out via env var.
- Changing the default may affect environments (tests, tooling) that assumed the flag was off unless toggled; ensure there are no negative assumptions (e.g., fixtures expecting legacy behaviour).
- Runtime config caches env values (`lib/env.ts` caches `Env`). Changes must occur before env is first read; tests that mutate `process.env` mid-run may need resetting.

## Open Questions (and answers if resolved)

- Q: Do any tests enforce a default-off expectation for allocator v2?
  A: `rg` only shows suites explicitly opting in via env or spies, so a default `true` should not break expectations; will run unit tests to confirm.

## Recommended Direction (with rationale)

- Update the default for `allocatorV2.enabled` within `lib/env.ts` to `true` (while keeping `shadow` and `forceLegacy` defaults untouched), so the system enables v2 unless explicitly disabled.
- Leave `server/feature-flags` logic intact to keep `forceLegacy` override functional.
- Document behavioural change in the task plan/todo and rely on existing coverage; extend verification with targeted API tests if regressions surface.
