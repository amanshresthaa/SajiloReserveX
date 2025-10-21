# Implementation Plan: Remove Observability Events Metrics Dependency

## Objective

We will remove the unused observability events metrics flow so that Ops no longer calls a failing Supabase table and the selector diagnostics stay stable without 500s.

## Success Criteria

- [ ] `/api/ops/metrics/selector` and related client code are removed or return a static “disabled” response without Supabase queries.
- [ ] Ops dashboard renders without the Assignment Insights panel and no 500s appear in logs.
- [ ] Tests/documentation updated to reflect the removal.

## Architecture & Components

- `src/app/api/ops/metrics/selector/route.ts`: delete the route or convert it into a static 404 responder.
- `src/services/ops/selectorMetrics.ts` and React Query wiring in `OpsDashboardClient` must be removed.
- Remove `tests/ops/dashboard.metrics.test.tsx` and API tests targeting the old behavior.

## Data Flow & API Contracts

- Endpoint: GET `/api/ops/metrics/selector` is retired; callers should stop issuing requests.
- The Ops dashboard no longer surfaces selector metrics; no replacement data flow required.

## UI/UX States

- Remove “Assignment Insights” panel and error alert logic tied to selector metrics.
- Remaining dashboard sections remain untouched.

## Edge Cases

- Clients expecting an array should still receive an array (possibly empty) to avoid runtime errors.
- Feature flag toggles should not resurrect removed code paths.

## Testing Strategy

- Unit: delete or update tests covering selector metrics API/service.
- Integration: run `pnpm vitest run tests/ops/dashboard.metrics.test.tsx` equivalent suites to ensure clean removal.
- E2E: smoke Ops dashboard manually (MCP) to confirm no errors.
- Accessibility: review layout after panel removal.

## Rollout

- No feature flag; removal is immediate.
- Monitor logs for residual requests hitting the removed endpoint.
