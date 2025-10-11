# Implementation Plan: Ops UI Visual Polish

## Objective

Deliver a cohesive, accessible visual refresh across the `/ops` surfaces (dashboard, bookings, walk-in booking, manage restaurant, team) while preserving existing functionality and data flows.

## Success Criteria

- Dashboard hero (`TodayBookingsCard`) clearly communicates priority metrics (values emphasized, spacing refined) and skip links behave correctly within the Ops shell.
- Sidebar, header, and global actions share consistent spacing, contrast, and focus styling.
- Bookings and walk-in screens use design-system selects and balanced layouts on mobile and desktop.
- Manage restaurant forms are easier to scan, with clear section hierarchy and aligned form controls.
- Team management view adopts design tokens (no hard-coded slate colors) and communicates permission states with consistent alerts.
- No regressions in shared components (e.g., `BookingsTable`, `BookingFlowPage`) when used outside Ops.

## Architecture & Component Touchpoints

### Ops Shell (`components/ops/OpsAppShell.tsx`, `components/ops/AppSidebar.tsx`)

- Tweak header spacing, CTA alignment, and skip-link styling (shared CSS in `app/globals.css` if needed).
- Ensure sidebar icons use semantic tokens for better contrast.

### Dashboard (`components/ops/dashboard/TodayBookingsCard.tsx`, related UI helpers)

- Adjust typography hierarchy for headline, metrics, and filters.
- Review badge/heatmap palettes for accessibility—limit changes to card-scoped classes.
- Empty states should reuse shared alert/card patterns with subtle icons.

### Manage Bookings (`components/ops/bookings/OpsBookingsClient.tsx`)

- Replace native `<select>` with shadcn `Select`.
- Group filters (status, restaurant selector) with responsive flex utilities; maintain shared `BookingsTable` API.

### Walk-in Booking (`components/ops/bookings/OpsWalkInBookingClient.tsx`, `components/reserve/booking-flow`)

- Mirror booking selector changes; add header alignment tweaks without altering guest flow variant.

### Manage Restaurant (`components/ops/manage/ManageRestaurantShell.tsx` and nested form helpers)

- Introduce clearer section headers/dividers, align form grids, and consolidate action button placement.
- Maintain dirty-state logic and TanStack query integrations.

### Team Management (`components/ops/team/TeamManagementClient.tsx`, `TeamInviteForm`, `TeamInvitesTable`)

- Swap slate color utilities for semantic tokens.
- Refine layout spacing and select styling to match the rest of Ops.

## Data Flow & State Considerations

- No new API calls. All adjustments must respect existing React Query caches and supabase fetches.
- When swapping components (e.g., native select → shadcn Select), ensure controlled state persists and remains SSR compatible.

## UI/UX Considerations

- Mobile-first: verify each screen stacks gracefully at <640px and large desktops (>1440px).
- Maintain or improve keyboard navigation (focus rings, logical tab order).
- Preserve timezone/date accessibility (ARIA labels on buttons, popovers).
- Avoid widening cards in a way that introduces horizontal scroll within `SidebarInset`.

## Edge Cases & Risks

- Multi-restaurant users: ensure new selector patterns still allow switching quickly on all screens.
- Shared components (BookingsTable, BookingFlowPage) are used outside Ops—scope styling updates via container classes or props.
- Ops shell skip link shares `#main-content` with global layout; confirm ID uniqueness after changes.
- Manage restaurant long forms: ensure sticky elements or layout changes don’t break beforeunload warnings or validation message positioning.

## Implementation Steps

1. **Foundation**
   - Update global/ops-specific CSS tokens for skip link and sidebar icon contrast.
   - Adjust Ops header spacing and responsive behaviour.
2. **Dashboard polish**
   - Rework metric cards, filter row spacing, and empty-state visuals within `TodayBookingsCard`.
3. **Bookings + Walk-in**
   - Introduce design-system select, align filter/toolbars, validate table responsiveness.
4. **Manage restaurant**
   - Add sectional structure, refine form grids, standardize action bars.
5. **Team view**
   - Replace slate tokens, tune alerts/selects, verify permission messaging.
6. **Validation**
   - Pass lint/TypeScript, smoke-test each Ops route at mobile & desktop widths, and note follow-up Lighthouse checks.

## Testing Strategy

- `pnpm lint` + TypeScript (already part of lint script) post-change.
- Manual QA on the following breakpoints: 390px, 768px, 1280px, 1440px for `/ops`, `/ops/bookings`, `/ops/bookings/new`, `/ops/manage-restaurant`, `/ops/team`.
- Keyboard-only walkthrough of skip links, selectors, dialogs.
- (Optional follow-up) Lighthouse spot-check on `/ops` and `/ops/manage-restaurant` once visual changes land.

## Rollout Plan

- No feature gating; deploy as part of the existing Ops bundle.
- Communicate with design stakeholders for color/spacing sign-off.
- Monitor production logs for React warnings related to controlled selects or form dirty-state changes.
