# Implementation Plan: Fix Service Periods ESLint

## Objective

We will adjust the service period unit test regex and the Supabase client typing so that `eslint --fix --max-warnings=0` no longer fails on these files, keeping code semantics unchanged.

## Success Criteria

- [ ] `eslint --max-warnings=0 tests/server/restaurants/servicePeriods.test.ts` reports zero issues.
- [ ] `eslint --max-warnings=0 server/restaurants/servicePeriods.ts` reports zero issues or warnings.

## Architecture & Components

- `tests/server/restaurants/servicePeriods.test.ts`: update the `toThrowError` regex literal to remove redundant escaping while keeping the same textual expectation.
- `server/restaurants/servicePeriods.ts`: tighten the `DbClient` alias by replacing `any` with `Database['public']` so the Supabase client remains typed.

## Data Flow & API Contracts

- No API or runtime flow changes. Only lint-related code style adjustments.

## UI/UX States

- Not applicable; server logic and tests only.

## Edge Cases

- Ensure the regex still matches the overlap error message text (quotes must remain literal).
- Confirm the stricter Supabase generic does not introduce type errors (typing already uses the same schema elsewhere).

## Testing Strategy

- Run `pnpm exec eslint tests/server/restaurants/servicePeriods.test.ts server/restaurants/servicePeriods.ts --max-warnings=0`.

## Rollout

- No feature flag or rollout required; merge once lint passes.
