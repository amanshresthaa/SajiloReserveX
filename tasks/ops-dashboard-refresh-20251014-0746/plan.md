# Implementation Plan: Ops Dashboard Refresh

## Objective

We will re-style the Ops dashboard client to match the new modern layout while preserving all existing booking management functionality so that operators get a clearer, more polished view of daily performance.

## Success Criteria

- [ ] Dashboard renders with gradient background, refreshed header, stat cards, simplified capacity cards, and updated reservations section per mock.
- [ ] Date navigation (prev/next buttons) updates the selected date and URL param, triggering data reload without errors.
- [ ] All existing modules (bookings list/filter, export button, VIP list, booking change feed) continue to work as before.

## Architecture & Components

- `OpsDashboardClient`: keep existing data hooks/state; replace JSX layout with new structure.
- Inline helper components:
  - `StatCard` for the colored metrics.
  - `ServicePeriodCard` (wrapper around current capacity data; reuse simplified info).
  - `FilterTab` not needed because we still rely on `BookingsFilterBar`; style container differently.
- Preserve `BookingsFilterBar`, `BookingsList`, `ExportBookingsButton`, `VIPGuestsModule`, `BookingChangeFeed`.

## Data Flow & API Contracts

- No API changes. Continue using:
  - `useOpsTodaySummary({ restaurantId, targetDate })`
  - `useOpsBookingHeatmap` not needed in UI, so drop it from render (but consider removing query to avoid unused fetch).
  - `useOpsCapacityUtilization`, `useOpsTodayVIPs`, `useOpsBookingChanges`.
- `handleSelectDate` still writes `date` to URL; new navigation buttons call this with computed ISO date strings.

## UI/UX States

- Loading: continue showing `DashboardSkeleton`.
- Error: continue showing `DashboardErrorState`.
- Success: new layout with:
  - Header + date selector with arrows.
  - Stat cards mapping `summary.totals`.
  - Service capacity cards (if data available) or empty copy.
  - Reservations card with export button, filter bar, bookings list (existing empty state handles no data).
  - VIP list and booking change feed displayed in dedicated sections when data present.
- No data states rely on existing components (e.g., `BookingsList` empty fallback).

## Edge Cases

- Ensure date parsing handles invalid summary date gracefully before generating prev/next.
- When capacity periods empty, show a friendly empty state instead of blank container.
- `summary.totals` may lack some metrics; guard for `undefined`.

## Testing Strategy

- Unit: not adding new tests (component heavy).
- Integration: exercise UI manually in dev environment.
- E2E: n/a.
- Accessibility: verify button labels, focus order, color contrast when QA-ing.

## Rollout

- No feature flag required; immediate replacement.
- Validate manually in dev; monitor for runtime errors in console.
