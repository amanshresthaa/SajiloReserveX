# Implementation Checklist

## Setup & Alignment

- [x] Confirm token update scope in `app/globals.css`.
- [x] Ensure skip-link target exists within Ops shell.
- [ ] Capture current screenshots of key Ops routes for before/after comparison.

## Foundation (Ops Shell & Shared Styles)

- [x] Restyle skip-link pill (usable colors, constrained width, consistent focus ring).
- [x] Rebalance Ops header spacing / CTA alignment across breakpoints.
- [x] Increase sidebar icon contrast using semantic tokens.

## Dashboard (`/ops`)

- [x] Elevate metric hierarchy in `TodayBookingsCard` (value typography, label contrast).
- [x] Refine spacing between heading, filters, and cards (mobile + desktop).
- [x] Improve empty/zero states with clearer visuals.
- [ ] Audit heatmap palette for accessibility (optional tweak if needed).

## Manage Bookings (`/ops/bookings`)

- [ ] Swap native restaurant selector for shadcn `Select`.
- [ ] Group filters/toolbars for responsive balance.
- [ ] Verify `BookingsTable` state + actions still function after layout adjustments.

## Walk-in Booking (`/ops/bookings/new`)

- [ ] Mirror selector updates and align header/back button placement.
- [ ] Ensure `BookingFlowPage` ops mode renders correctly at mobile & desktop.

## Manage Restaurant (`/ops/manage-restaurant`)

- [ ] Introduce clearer section headers / grouping for hours, overrides, service periods, details.
- [ ] Align form controls in responsive grid and standardize button bars.
- [ ] Validate dirty/unsaved state messaging remains intact.

## Team Management (`/ops/team`)

- [ ] Replace slate utility colors with semantic tokens.
- [ ] Update select styling to match design system.
- [ ] Polish permission alerts and empty states for consistency.

## Testing & Verification

- [x] `pnpm lint`
- [ ] Manual QA across `/ops` routes at 390px, 768px, 1280px, 1440px.
- [ ] Keyboard navigation pass (skip links, selectors, dialogs).
- [ ] Document follow-up Lighthouse re-run needs in `verification.md`.
