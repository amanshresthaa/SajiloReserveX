# Research: Remove Capacity Management

## Existing Patterns & Reuse

- Dedicated Ops route at `src/app/(ops)/ops/(app)/capacity/page.tsx` renders `CapacityConfigClient` behind the `FEATURE_CAPACITY_ADMIN_DASHBOARD` flag (targeted for removal).
- `src/components/features/capacity/CapacityConfigClient.tsx` drives all capacity management flows (listing/upserting rules, overrides, reports) via React Query and the ops service layer.
- Supporting UI lives alongside it: `UtilizationHeatmap.tsx` and dashboard widget `src/components/features/dashboard/CapacityVisualization.tsx`, plus capacity cards inside `OpsDashboardClient`.
- Hooks/services: `useOpsCapacityUtilization` (`src/hooks/ops/useOpsCapacityUtilization.ts`) pulls `/api/ops/dashboard/capacity`; `src/services/ops/capacity.ts` and `src/services/ops/allowedCapacities.ts` talk to the corresponding REST endpoints.
- Context wiring: `useCapacityService` exported from `src/contexts/ops-services.tsx`; feature flags (`capacityConfig`, `capacityAdminDashboard`) defined in `lib/env.ts`, `server/feature-flags.ts`, `src/types/ops.ts`, and consumed across ops pages/tests.
- Backend endpoints dedicated to capacity mgmt live under `src/app/api/ops/capacity-rules`, `src/app/api/ops/capacity-overrides`, `src/app/api/ops/capacity/overbooking-export`, and `src/app/api/ops/dashboard/capacity`; alerts at `src/app/api/internal/capacity/check-alerts/route.ts` use `server/alerts/capacity.ts`.
- Tests covering these flows: `tests/integration/capacity-api.test.ts`, `tests/server/capacity/policy.test.ts`, and ops dashboard/client tests use capacity flags or data.

## External Resources

- Supabase schema/tables: `restaurant_capacity_rules`, `capacity_metrics_hourly`, RPC `create_booking_with_capacity_check` (not modified but consumers removed).
- Feature flag env vars: `FEATURE_CAPACITY_ADMIN_DASHBOARD`, `FEATURE_CAPACITY_CONFIG` documented in `lib/env.ts` (planned for deprecation alongside the UI).

## Constraints & Risks

- Table inventory UI (`src/components/features/tables/TableInventoryClient.tsx`) relies on `getAllowedCapacities` and the `queryKeys.opsCapacity.allowedCapacities` key; removing capacity mgmt must keep table editing intact or swap to a neutral ops tables namespace.
- Ops dashboard currently renders a "Service Capacity" section backed by `/api/ops/dashboard/capacity`; removing that API requires redesigning the dashboard so hooks/components no longer expect capacity data.
- Feature flag removal touches shared types (`OpsFeatureFlags`), session context, env parsing, and tests that stub these flags.
- Server-side utilities in `server/alerts/capacity.ts` and `server/ops/capacity.ts` are referenced by other modules (booking flows, alert jobs); ensure we only delete entry points exclusively used by the UI we're retiring.
- Integration tests target remote Supabase resources; deleting endpoints/tests should be coordinated to avoid failing CI suites.

## Open Questions (and answers if resolved)

- Q: Do any non-capacity pages rely on `/api/ops/capacity-*` endpoints?
  A: Only `CapacityConfigClient` consumes `capacity-rules`, `capacity-overrides`, and export. `/api/ops/dashboard/capacity` is solely used by `useOpsCapacityUtilization` inside the ops dashboard widget.
- Q: Can `allowed-capacities` remain while removing the management UI?
  A: Yes—Table Inventory still depends on the endpoint/service, so we should keep it and move cache keys under the tables namespace.
- Q: Are `server/alerts/capacity` helpers still needed post-removal?
  A: They back the `internal/capacity/check-alerts` API and alerting; without a capacity dashboard we plan to remove the alert route and helper altogether.

## Recommended Direction (with rationale)

- Retire the capacity management surface by removing the `/ops/capacity` route, `CapacityConfigClient`, `UtilizationHeatmap`, and the dashboard "Service Capacity" widget/hook.
- Remove the dedicated ops capacity service, feature flags, query keys, and API routes that exclusively supported that UI; adjust navigation and session types accordingly.
- Drop capacity-specific Supabase objects (`restaurant_capacity_rules`, `capacity_metrics_hourly`, associated RPCs/enums) via a cleanup migration so no backend code depends on them.
- Preserve shared booking/tables functionality by retaining the core capacity engine (`server/capacity/*`) and the allowed capacities endpoint used by table inventory, updating consumers to a neutral query key namespace.
- Delete or update tests tied to the removed endpoints/components to keep the suite green, noting any follow-up work for monitoring/alerts if those modules are still required.
