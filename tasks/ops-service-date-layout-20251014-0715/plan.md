# Implementation Plan: Ops Dashboard Service Date Layout

## Objective

We will surface the service-date selection card at the top of the main dashboard column so ops users immediately see and adjust the active day without looking to the sidebar, align it horizontally with the KPI block on larger screens, and bring the service-capacity insight into the same primary column for a cohesive reading order.

## Success Criteria

- [ ] The service date card renders inside the main (two-thirds) column as the first section before reservations.
- [ ] On `md` screens and above, the service date card and KPI metrics sit side by side in a horizontal layout while stacking vertically on smaller viewports.
- [ ] The service capacity module appears directly beneath the service date + KPI block inside the same column, spanning the full width of the grid without regressions to conditional rendering.
- [ ] Existing interactions (date selection popover, heatmap legend, bookings list) remain functional with no console errors.

## Architecture & Components

- `src/components/features/dashboard/OpsDashboardClient.tsx`
  - Move the service date `<section>` from the sidebar `<aside>` into the primary column.
  - Wrap the service date card and `SummaryMetrics` component in a responsive grid to achieve horizontal alignment on wider screens, adding the `CapacityVisualization` section as a third block that spans the grid.
  - Ensure spacing and border classes follow the existing card style.
- No changes anticipated to `HeatmapCalendar` or other feature components; rely on current composition.

## Data Flow & API Contracts

- No API or data changes required; all queries already scoped via `selectedDate`.

## UI/UX States

- Mobile (< `md`): blocks stack vertically in order Service Date → KPIs → Service Capacity → Reservations.
- Desktop (≥ `md`): Service Date card and KPI grid share a row with consistent gaps, Service Capacity spans the grid width beneath them, and reservations section remains below.
- Loading/error states for the calendar continue to render identically inside the relocated card.

## Edge Cases

- If the heatmap query errors, the destructive `Alert` still displays inside the moved card without layout breakage.
- When there are no VIPs or capacity data, ensure the spacer grid collapses without leaving awkward gaps and the sidebar now starts with its optional modules.

## Testing Strategy

- Manual responsive check in browser/DevTools focusing on `sm`, `md`, and `lg` widths.
- Smoke verify date selection updates URL/search params and refreshes dependent queries.
- Confirm no TypeScript errors on build (implicit via existing tooling) after refactor.

## Rollout

- Pure UI adjustment—no flags required.
- Release immediately once manual QA and lint/tests pass.
