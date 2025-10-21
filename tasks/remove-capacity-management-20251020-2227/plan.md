# Implementation Plan: Remove Capacity Management

## Objective

We will retire the legacy Ops "Capacity Management" experience (UI page, dashboard widget, and supporting APIs) so the operations surface no longer references capacity rules or overrides while keeping the core booking engine intact.

## Success Criteria

- [x] `/ops/capacity` route and navigation entry are removed; attempting to load the page results in the standard 404 layout.
- [x] Ops dashboard compiles without calling capacity-specific hooks or APIs, and no TypeScript references to `CapacityConfigClient`, `useOpsCapacityUtilization`, or `queryKeys.opsCapacity` remain.
- [x] Capacity management APIs/services (`/api/ops/capacity-*`, internal alerts) and associated feature flags/env schema entries are deleted, with docs/tests reflecting the new surface area.
- [ ] Repository passes TypeScript/lint checks (`pnpm lint`) and targeted Vitest suites impacted by the change (ops dashboard / table inventory) without errors.
- [x] Supabase schema no longer defines capacity-specific tables/functions/types, and booking flows no longer depend on the removed RPCs.

## Architecture & Components

- Remove `src/app/(ops)/ops/(app)/capacity/page.tsx`, `src/components/features/capacity/*`, and strip the "Service Capacity" section from `OpsDashboardClient` so it relies only on bookings data.
- Delete `src/hooks/ops/useOpsCapacityUtilization.ts` and stop exporting it from `src/hooks/index.ts`; adjust `queryKeys` to drop the `opsCapacity` namespace while introducing a table-specific key for allowed capacities.
- Remove the ops capacity service/context wiring (`useCapacityService`, `src/services/ops/capacity.ts`) and update `OpsServicesProvider` consumers accordingly.
- Delete backend handlers under `src/app/api/ops/capacity-*`, `src/app/api/ops/dashboard/capacity`, and `src/app/api/internal/capacity/check-alerts`; drop `server/alerts/capacity.ts` while keeping the core `server/capacity/*` engine untouched.
- Prune feature flags and environment schema entries for capacity admin/config, plus docs referencing the retired workflow.
- Rework booking and availability services so they no longer import `@/server/capacity` RPC helpers and instead rely on direct inserts/heuristics compatible with the simplified schema.
- Add a Supabase migration to drop `restaurant_capacity_rules`, `capacity_metrics_hourly`, the `capacity_override_type` enum, and the `create_booking_with_capacity_check`/`increment_capacity_metrics` functions.

## Data Flow & API Contracts

Removed endpoints:

- DELETE `/api/ops/capacity-rules/[id]`
- GET/POST `/api/ops/capacity-rules`
- GET `/api/ops/capacity-overrides`
- GET `/api/ops/capacity/overbooking-export`
- GET `/api/ops/dashboard/capacity`
- POST `/api/internal/capacity/check-alerts`

No replacement contracts are introduced; table inventory continues to call `/api/ops/allowed-capacities` with an updated query key.

## UI/UX States

- Navigation no longer lists Capacity under Restaurant management.
- Ops dashboard omits the capacity module entirely, relying on remaining sections (heatmap, KPIs, assignments, etc.).
- Table inventory maintains existing loading/error states when fetching allowed capacities.

## Edge Cases

- Ensure table inventory still revalidates allowed capacities after mutation.
- Confirm removing capacity feature flags does not break tests that stub `env.featureFlags` objects (all consumers updated to new shape).
- Verify that removing docs/tests does not leave broken references in READMEs or task artefacts.

## Testing Strategy

- Run `pnpm lint` to cover TypeScript type-checking and ESLint.
- Run focused Vitest suites covering ops dashboard/table inventory if available (`pnpm test --filter ops-dashboard` or nearest equivalent); adjust once we inspect scripts.
- Manual smoke via existing dashboard components is non-UI (no new QA), but note removal in `verification.md`.

## Rollout

- No feature flag gating; change goes live immediately once merged.
- Communicate via changelog/task artefact that capacity management is deprecated so downstream documentation can be archived.
