# Implementation Plan: Fix Loyalty Module ESLint Any Warnings

## Objective

Tighten the Supabase client typing in `server/loyalty.ts` to comply with the zero-warning lint policy while keeping logic unchanged.

## Success Criteria

- [ ] `pnpm eslint server/loyalty.ts --max-warnings=0` succeeds.
- [ ] Relevant unit tests touching loyalty logic continue to pass (`pnpm vitest tests/server/capacity/manualConfirm.test.ts` covers loyalty side effects).

## Architecture & Components

- Update the `DbClient` type alias to leverage the generated Supabase schema generics.
- No runtime changes; only TypeScript typedef adjustments.

## Data Flow & API Contracts

- Supabase interactions remain the same; stronger typing ensures compile-time safety.

## UI/UX States

- Not applicable.

## Edge Cases

- Ensure the alias continues to accept the existing Supabase client instance used across the server code.

## Testing Strategy

- Unit: run targeted ESLint, then execute the related Vitest suite.
- Integration/E2E: not needed.
- Accessibility: not applicable.

## Rollout

- No feature flag; commit as part of standard lint-fix changes.
- Monitoring via CI lint/test passes.
