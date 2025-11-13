---
task: feature-selector-env-limits
timestamp_utc: 2025-11-12T17:58:36Z
owner: github:@codex-ai
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Feature Selector Env Limits

## Objective

Keep the feature selector tuning knobs within the allowed runtime validation range so Next.js builds can collect page data without crashing.

## Success Criteria

- [ ] `.env.local` values for the three feature selector variables sit within the schema limits and are tightened for dev (`200` / `2000` / `5000`).
- [ ] `FEATURE_ALLOCATOR_REQUIRE_ADJACENCY` is `true` whenever merges are enabled to prevent unsafe permutations.
- [ ] `pnpm run build` completes successfully.

## Architecture & Components

- `.env.local`: configure runtime knob limits consumed via env schema in `config` / server runtime.
- No code changes required beyond env updates.

## Data Flow & API Contracts

- Runtime schema (likely Zod) pulls these env vars via `process.env`; we ensure the provided numbers satisfy the schema so API routes such as `/api/config/service-policy` can load.

## UI/UX States

- N/A (env-only change).

## Edge Cases

- Ensure there are no duplicate definitions in other env files overriding `.env.local` (e.g., `.env` or `.env.production`).
- Confirm `pnpm run build` uses `.env.local` and surfaces no other validation errors.
- Verify merges + adjacency requirement combo still allows multi-table plans; if disabled, document rationale in verification.

## Testing Strategy

- Run `pnpm run build` after editing to exercise both `scripts/validate-env.ts` and Next runtime validation.

## Rollout

- Local `.env.local` change; communicate value adjustments if other devs rely on higher thresholds.
- No feature flags or remote env updates required for this task.
