# Implementation Plan: Fix build validate env script

## Objective

We will enable the build pipeline to run without failing on the missing `validate-env.ts` script so that `pnpm run build` succeeds locally.

## Success Criteria

- [ ] `pnpm run build` completes without missing module errors.
- [ ] Environment validation script location is documented or adjusted to match repository structure.

## Architecture & Components

- `scripts/validate-env.ts`: new Node entrypoint executed via `tsx` before builds. It will import the existing `env` helper and trigger parsing.
- `lib/env.ts` + `config/env.schema.ts`: reused without modification to guarantee build/runtime parity.

## Data Flow & API Contracts

- The script runs in Node, reads `process.env`, delegates validation to `getEnv()` from `lib/env.ts`, and exits with code `0` after logging success.
- On validation failure, it will catch the thrown error, print a readable message, and exit with code `1` so CI fails clearly.

## UI/UX States

- Not applicable.

## Edge Cases

- Missing env variables (production vs development defaults) should surface the zod error list; ensure we log the stack only in verbose mode by default.
- Unexpected exceptions (e.g., due to module resolution) should also cause non-zero exit status.

## Testing Strategy

- Manual: run `pnpm run validate:env`.
- Regression: `pnpm run build` must complete successfully.

## Rollout

- Immediate; no flags required. Document the new script path if additional tooling references it.
