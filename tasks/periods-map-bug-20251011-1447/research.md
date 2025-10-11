# Research: Periods Map Runtime Error

## Initial Requirements

- Investigate the runtime failure showing “Something went wrong 🥲 periods.map is not a function”.
- Determine which code path produces a non-array `periods` value and document findings.
- Capture any related build-time warnings that may illustrate edge/runtime constraints to respect.

## Success Criteria

- Diagnose the root cause and required remediation steps for the `periods.map` failure.
- Identify reusable patterns or utilities in the codebase that will guide the eventual fix.
- Provide enough context for a concrete implementation plan that mitigates regressions.

## Existing Patterns

- React Query queries under `hooks/owner` typically hydrate server-prefetched data via `queryClient.setQueryData` using the exact shape returned by the corresponding hook (e.g., `useOperatingHours` expects the full response object and receives that from `RestaurantSettingsPage`).
- `useServicePeriods` specifically expects a `ServicePeriod[]` array; mutations also cache the raw array.
- `RestaurantSettingsPage` prefetches both operating hours and service periods inside a `QueryClient` prior to hydration.

## External Resources

- [TanStack Query Hydration Docs](https://tanstack.com/query/latest/docs/framework/react/guides/ssr) — confirms prefetched data must match the client query shape.

## Technical Constraints

- The service-period prefetch currently seeds React Query with `{ restaurantId, periods }` (object) even though the consumer hook expects an array, so the hydrated `data` value is an object on first render.
- `ServicePeriodsSection` immediately calls `mapFromResponse(data)` where `data` is assumed to be an array, leading to the `periods.map is not a function` runtime when the hydrated shape is incorrect.

## Recommendations

- Align the prefetch cache shape with `useServicePeriods` expectations by storing just the `periods` array.
- Consider adding a defensive guard (e.g., `Array.isArray`) within the component to prevent similar crashes and surface a friendlier error state if hydration ever gets out of sync.
