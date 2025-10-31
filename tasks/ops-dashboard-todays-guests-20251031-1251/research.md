# Research: Ops Dashboard Today's Guest Count

## Requirements

- Functional:
  - Surface the total number of guests scheduled for the currently selected service date on the /ops dashboard.
  - Ensure the count reflects the same data source used for other dashboard statistics (reacts to date changes and live updates).
- Non-functional (a11y, perf, security, privacy, i18n):
  - Present the value in an accessible way (readable label, semantic placement).
  - Preserve dashboard performance (reuse existing queries, no additional network calls).
  - Respect existing localization/formatting conventions (plain numeric display).

## Existing Patterns & Reuse

- `src/components/features/dashboard/OpsDashboardClient.tsx` already builds a `statCards` array rendered as KPI cards.
- `OpsTodayBookingsSummary` fetched via `useOpsTodaySummary` exposes `totals.covers`, representing guest counts (a.k.a. covers).
- `StatCard` component handles display styling for dashboard KPIs; adding to its config array extends UI consistently.

## External Resources

- N/A – existing code paths already provide required data.

## Constraints & Risks

- Need to avoid double-importing conflicting icons (lucide-react) and maintain consistent visual hierarchy.
- Ensure the guest card only renders when `summary.totals` is available to avoid undefined values.
- Verify that covers metric aligns with stakeholder expectation of "guest count".

## Open Questions (owner, due)

- Q: Do we need to distinguish between adult/child guests or just total covers?
  A: Not specified; assume total covers for now and confirm if requirements evolve.

## Recommended Direction (with rationale)

- Extend the existing `statCards` memoised array to include a “Guests” entry sourced from `summary.totals.covers`; reuse the `StatCard` component for UI consistency.
- Choose an icon/accent palette aligned with current cards, ensuring the new card slots into the existing responsive grid without layout changes.
