# Implementation Checklist

## Layout Changes

- [x] Relocate service date card from sidebar into main column in `OpsDashboardClient`.
- [x] Introduce responsive grid to place service date card and KPI metrics horizontally on `md+` screens.
- [x] Ensure spacing/borders remain consistent with existing cards.
- [x] Move the service capacity module into the same main grid so all three blocks share the column, with capacity spanning full width beneath the first row.

## Verification

- [ ] Manual responsive QA (mobile, tablet, desktop) confirming layout order and interactions.
- [ ] Sanity-check URL param updates when selecting new dates.
- [ ] Run relevant lint/tests if required by repo workflow.

## Notes

- Assumptions: No additional design tweaks to calendar internals beyond layout placement.
- Deviations: Removed descriptive copy and heatmap legend per follow-up request to keep only the inline service date label/button.

## Batched Questions

- None.
