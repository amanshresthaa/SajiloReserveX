# Implementation Plan: Ops Dashboard Today's Guest Count

## Objective

We will enable ops team members to view today's total guest count on the dashboard so that they can make staffing decisions quickly.

## Success Criteria

- [ ] Guest count for today's bookings visible on /ops dashboard summary.
- [ ] Count updates correctly based on actual bookings data.
- [ ] Automated test covers presence of the guest metric in dashboard render.

## Architecture & Components

- `OpsDashboardClient` already renders KPI stat cards based on a memoised `statCards` array – extend this array with a “Guests” entry.
- Continue using `StatCard` UI for consistent presentation; no new components required.
- Reuse `summary.totals.covers` (covers == number of guests) from the existing `useOpsTodaySummary` hook.

## Data Flow & API Contracts

- No new endpoints. Continue leveraging `bookingService.getTodaySummary` response.
- New KPI reads `summary.totals.covers` once the query resolves.

## UI/UX States

- Loading: No change; skeleton covers KPI grid already.
- Empty: Stat card should show `0` when `totals.covers` is falsy.
- Error: Existing error handling (DashboardErrorState) remains.
- Success: Card displays label “Guests” (or similar) and numeric total.

## Edge Cases

- Null/undefined `summary` during fetch → rely on existing guards (returns empty array until data ready).
- Zero covers should render as `0` (ensure default to 0).
- Ensure addition doesn’t break responsive grid (grid already auto-wraps).

## Testing Strategy

- Unit: Update `tests/ops/clients.test.tsx` to assert the guest metric appears when summary loads.
- Integration: Covered by existing render test; no separate integration planned.
- E2E: Not required for scope (would rely on existing dashboard coverage).
- Accessibility: Rely on semantic text (no additional work beyond verifying label).

## Rollout

- Feature flag: Not needed; minor UI enhancement piggybacking on existing data.
- Exposure: Immediate once deployed.
- Monitoring: Observe logs/analytics for dashboard usage (no new metrics).
- Kill-switch: Revert commit if issues arise; limited blast radius.
