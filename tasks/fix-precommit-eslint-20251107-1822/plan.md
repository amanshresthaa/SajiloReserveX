# Implementation Plan: Fix ESLint any warnings in restaurant details tests

## Objective

Ensure the restaurant details module and its tests use concrete Supabase types so ESLint no longer reports `no-explicit-any` warnings during pre-commit checks.

## Success Criteria

- [ ] `tests/server/restaurants/details.test.ts` contains no `any` usages and passes lint.
- [ ] Shared Supabase client typing remains accurate and compile-clean.
- [ ] `pnpm lint` succeeds locally.

## Architecture & Components

- `server/restaurants/details.ts`: tighten `DbClient` alias to rely on the generated schema defaults.
- `tests/server/restaurants/details.test.ts`: depend on existing types (`DbClient` or `Database` table rows) to describe mock helpers.

## Data Flow & API Contracts

No runtime behavior changes—only TypeScript type annotations. Ensure inferred shapes still match Supabase rows.

## UI/UX States

Not applicable (backend unit tests only).

## Edge Cases

- Mock client helper should still allow partial restaurant data (tests only pass specific props) without forcing callers to provide the entire row.

## Testing Strategy

- Run `pnpm lint` to ensure ESLint coverage per project policy.

## Rollout

- No feature flags required; change lands via standard merge.
