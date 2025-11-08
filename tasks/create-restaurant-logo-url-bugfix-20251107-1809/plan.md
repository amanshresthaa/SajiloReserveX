# Implementation Plan: Create Restaurant Logo URL Bugfix

## Objective

Ensure the ops create-restaurant dialog sends a schema-compliant payload so TypeScript/Next.js builds succeed without modifying the user-facing form.

## Success Criteria

- [ ] `pnpm run build` progresses past the previously failing TypeScript step (the dialog provides `logoUrl`).
- [ ] No UI or API regressions; dialog behavior remains unchanged for operators.

## Architecture & Components

- `components/ops/restaurants/CreateRestaurantDialog.tsx`: extend the `input` object prepared in `handleSubmit` to explicitly set `logoUrl` (null placeholder until uploads exist).

## Data Flow & API Contracts

- API: `POST /api/ops/restaurants` consumes `CreateRestaurantInput` from `src/app/api/ops/restaurants/schema.ts`. The schema now always produces `logoUrl`, so the client must provide the key (null when not set).

## UI/UX States

- Loading, validation, and success flows remain unchanged because we only alter the payload structure.

## Edge Cases

- When users omit optional contact fields the payload should still include `logoUrl: null`; ensure slug auto-generation remains unaffected.

## Testing Strategy

- Run `pnpm run lint` to cover TypeScript + ESLint validations.
- Optionally spot-check `pnpm run build` if time permits (build previously failed at type-check step, so lint should capture the same issue).

## Rollout

- No feature flags; change is safe to merge immediately once lint/build succeed.
