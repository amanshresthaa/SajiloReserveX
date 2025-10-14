# Implementation Plan: Fix Ops Hooks HTTP Import

## Objective

We will restore the Ops dashboard hooks by pointing their HTTP helper import at the existing `fetchJson` module so that production builds succeed again.

## Success Criteria

- [x] Next.js build completes without `@/lib/http/client` module errors.
- [x] Updated hooks continue to compile and type-check.

## Architecture & Components

- `src/hooks/ops/useOpsBookingChanges.ts`: imports `fetchJson` helper for data fetching.
- `src/hooks/ops/useOpsCapacityUtilization.ts`: same pattern.
- `src/hooks/ops/useOpsTodayVIPs.ts`: same pattern.
  State: these hooks expose SWR-style data to Ops components.

## Data Flow & API Contracts

- No API contract changes; hooks still call existing endpoints via `fetchJson`.

## UI/UX States

- No UI changes; hooks power data for `OpsBookingsClient`.

## Edge Cases

- Ensure no remaining imports reference the removed `client` path.
- Address any additional type errors surfaced by the build within the affected feature.

## Testing Strategy

- Run `pnpm run build` to confirm the production build succeeds.
- Spot-check TypeScript compilation through the build step.

## Rollout

- No flags required; change is safe to merge as a hotfix.
