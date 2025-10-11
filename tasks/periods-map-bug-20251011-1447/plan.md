# Implementation Plan: Service Periods Hydration Bug

## Objective

Ensure the Ops “Restaurant Settings” page loads service periods without crashing by fixing the React Query hydration mismatch and hardening the client against malformed cache data.

## Success Criteria

- [ ] Initial render of `/ops/restaurant-settings` no longer throws `periods.map is not a function`.
- [ ] React Query cache for `ownerRestaurants.servicePeriods` contains a `ServicePeriod[]` both during SSR hydration and after mutations.
- [ ] Manual regression testing confirms service periods can be viewed, added, updated, and reset without refresh-related crashes.

## Architecture

- **Data Hydration**: `RestaurantSettingsPage` pre-populates React Query via `queryClient.setQueryData`. We will change this to seed only the `ServicePeriod[]` array, mirroring what the client query expects.
- **Client Resilience**: `ServicePeriodsSection` will defensively normalize the query data before mapping to guard against future mismatches.

## Component Breakdown

- `app/(ops)/ops/(app)/restaurant-settings/page.tsx`: Adjust the server-preloaded cache shape.
- `components/ops/restaurant-settings/ServicePeriodsSection.tsx`: Normalize incoming query data and log unexpected shapes.

## Data Flow

1. Server loads operating hours and service periods, then stores them in a temporary `QueryClient`.
2. Hydrated client queries read the cached data. After the fix, both SSR cache and runtime updates serve the raw arrays expected by `useServicePeriods`.
3. Client component maps the array into editable rows; normalization prevents runtime failures if the cache ever deviates.

## API Contracts

- No changes to `/api/owner/restaurants/[id]/service-periods`. Payloads remain an array of service period objects.

## UI/UX Considerations

- Preserve existing layout and interactions.
- Show existing toast/error flows if API requests fail; added normalization should surface a toast/log rather than crash if data is malformed.

## Testing Strategy

- Manual QA in Ops dashboard:
  - Load `/ops/restaurant-settings` while authenticated.
  - Switch between restaurants (if available) to ensure the table populates correctly.
  - Add/edit/remove a period and save; confirm toast success and table updates.
  - Reset form and verify rows restore.
- Automated:
  - Run `pnpm test --filter service-periods` (or closest) if available; otherwise run targeted component/route tests if they exist.
  - `pnpm lint` if not covered by build step.

## Edge Cases

- Restaurant without service periods should show empty state without errors.
- Malformed cache data should no longer crash the component, even though it logs an unexpected shape.

## Rollout Plan

- No feature flag required. Deploy once manual verification passes.
