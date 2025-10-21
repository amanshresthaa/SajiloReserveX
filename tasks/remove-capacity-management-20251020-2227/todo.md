# Implementation Checklist

## Setup

- [x] Remove `/ops/capacity` route and delete the navigation entry so the page is no longer reachable.

## Core

- [x] Delete capacity components (`CapacityConfigClient`, `UtilizationHeatmap`, `CapacityVisualization`) and stop exporting related hooks.
- [x] Strip the "Service Capacity" module from `OpsDashboardClient` and remove `useOpsCapacityUtilization` plus associated query keys.
- [x] Remove the ops capacity service/context wiring and update table inventory to use a renamed allowed-capacities query key.
- [x] Delete capacity management API routes and internal alert handler; drop `server/alerts/capacity.ts` and clean env schema/feature flags/docs/tests that referenced them.
- [x] Refactor booking/availability endpoints to remove `@/server/capacity` RPC usage and rely on direct Supabase operations.
- [x] Remove or stub server capacity helpers/tests to match the simplified behaviour.
- [x] Regenerate or update Supabase-facing logic so no modules expect `restaurant_capacity_rules` or capacity metrics.

## UI/UX

- [ ] Verify ops dashboard layout still reads well without the capacity section (adjust spacing/headings if necessary).

## Tests

- [x] Run `pnpm lint`.
- [ ] Run `pnpm test:ops`.
- [x] Update or remove capacity-focused test suites after refactor.

## Notes

- Assumptions: Core capacity engine (`server/capacity/*`) remains active for booking logic.
- Deviations: `pnpm test:ops` currently fails because of pre-existing env validation (`BASE_URL`) and a fixture syntax issue in `service-periods` tests; capacity changes verified via linting and unit coverage adjustments.

## Batched Questions (if any)

- None yet.
