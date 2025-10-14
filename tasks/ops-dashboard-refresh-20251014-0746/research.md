# Research: Ops Dashboard Refresh

## Existing Patterns & Reuse

- `src/components/features/dashboard/OpsDashboardClient.tsx` already wires all data hooks and renders submodules like `BookingsList`, `BookingsFilterBar`, `ExportBookingsButton`, `CapacityVisualization`, `VIPGuestsModule`, and `BookingChangeFeed`. We should preserve these data flows while re-skinning the layout.
- `SummaryMetrics` component currently renders the primary stats but layout differs from target design; either adapt it with additional props/styles or render inline cards using the same totals data (`OpsTodayTotals`).
- Shadcn UI primitives (`Card`, `Button`, `ToggleGroup`, etc.) are available and should be leaned on for the new layout/styling.
- Tailwind config already supports the color palette classes (`slate`, `amber`, etc.), so we can use utility classes for gradients and shadows as in the provided mock.

## External Resources

- [Lucide Icons](https://lucide.dev) – already used in project (e.g., `Calendar`, `Users`, `Clock`, `TrendingUp`); match icon usage in new stat cards.
- Tailwind CSS docs for gradient backgrounds and responsive grid utilities to replicate the provided mock.

## Constraints & Risks

- Must retain current functionality: date-driven fetching, filters, bookings list interactions, VIP module, and booking change feed. Replacing layout must not break these behaviours.
- Date navigation currently depends on the heatmap calendar. Removing it means we need a reliable previous/next handler that still updates query params via `handleSelectDate`.
- Need to ensure new design remains responsive (mobile-first) and accessible (aria labels for date navigation buttons, focus states).
- Should avoid regressions in state synchronization with URL (`router.replace` logic).

## Open Questions (and answers if resolved)

- Q: How do we compute previous/next service dates without the calendar?  
  A: Derive from `summary.date` (ISO string) using `Date` helpers, reformat back to `YYYY-MM-DD`, then call existing `handleSelectDate`.
- Q: Do we still show VIP/booking change modules?  
  A: Yes—design doesn’t show them but they’re valuable context; keep them in a complementary layout section.

## Recommended Direction (with rationale)

- Rebuild the render tree inside `OpsDashboardClient` to match the provided visual hierarchy: gradient page background, header, compact date selector with nav arrows, color-coded stat cards, simplified service capacity cards, and refreshed reservations section while reusing existing hooks and child components.
- Create lightweight helper components (e.g., `StatCard`, `ServicePeriodCard`) within the file for styling, leveraging Tailwind/ shadcn classes instead of introducing new shared components.
- Implement prev/next day actions that reuse the existing `handleSelectDate` to keep URL/state sync. Maintain filter bar and bookings list but wrap them in new container styles consistent with design.
