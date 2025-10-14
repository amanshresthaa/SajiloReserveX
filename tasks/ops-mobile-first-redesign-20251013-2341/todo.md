# Implementation Checklist: Ops Mobile-First Redesign

**Task**: ops-mobile-first-redesign-20251013-2341
**Started**: 2025-10-13 23:41 UTC

## Setup

- [x] Create task directory
- [x] Document research findings
- [x] Create implementation plan
- [ ] Create feature branch
- [ ] Review plan with stakeholders

## Phase 1: Touch Targets & Spacing

### Touch Target Sizing (44px minimum on mobile)

- [ ] `BookingsFilterBar.tsx`: Update ToggleGroupItem height
- [ ] `BookingsList.tsx` (dashboard): Update action button heights
- [ ] `CapacityVisualization.tsx`: Verify interactive element sizing
- [ ] `VIPGuestsModule.tsx`: Verify card touch targets
- [ ] `BookingChangeFeed.tsx`: Update any interactive elements
- [ ] `OpsSidebar.tsx`: Verify navigation item heights (already has touch-manipulation)

### Vertical Spacing Optimization

- [ ] `OpsDashboardClient.tsx`: Update main container spacing
  - Change: `space-y-8` → `space-y-4 md:space-y-6 lg:space-y-8`
- [ ] `DashboardSummaryCard.tsx`: Update internal spacing
- [ ] `OpsBookingsClient.tsx`: Update section spacing
- [ ] `OpsWalkInBookingClient.tsx`: Update layout spacing

## Phase 2: Dashboard Layout Optimization

### Dashboard Grid Enhancement

- [ ] `OpsDashboardClient.tsx`: Update main grid layout
  - Current: `grid gap-6 lg:grid-cols-3`
  - New: `grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3`
  - Update Capacity column span: `lg:col-span-2` → `md:col-span-2`
  - Update VIP column span: Add `md:col-span-2 lg:col-span-1`

### SummaryMetrics Grid

- [ ] `SummaryMetrics.tsx`: Update grid layout
  - Current: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`
  - New: `grid gap-3 grid-cols-2 md:grid-cols-4`

### CapacityVisualization Grid

- [ ] `CapacityVisualization.tsx`: Update period cards grid
  - Current: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  - New: `grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4`

## Phase 3: Typography & Readability

### Page Headers (H1)

- [ ] `OpsDashboardClient.tsx`: Update page title
  - Current: `text-2xl`
  - New: `text-xl sm:text-2xl lg:text-3xl`
- [ ] `OpsBookingsClient.tsx`: Update page title
- [ ] `OpsWalkInBookingClient.tsx`: Update page title

### Section Headers (H2)

- [ ] `OpsDashboardClient.tsx`: Update section heading
  - Current: `text-2xl`
  - New: `text-lg md:text-xl lg:text-2xl`
- [ ] `OpsBookingsClient.tsx`: Update section heading
- [ ] `DashboardSummaryCard.tsx`: Update card title sizing

### Card Titles (H3)

- [ ] `CapacityVisualization.tsx`: Update card title
  - Current: `text-lg`
  - New: `text-base md:text-lg`
- [ ] `VIPGuestsModule.tsx`: Update card title
- [ ] `DashboardSummaryCard.tsx`: Update internal card titles

### Body Text & Inputs

- [ ] Verify all inputs have minimum 16px font size
- [ ] Check line-heights for mobile readability

## Phase 4: Card & Module Refinement

### VIPGuestsModule

- [ ] Update max-height to be responsive
  - Current: `max-h-[400px]`
  - New: `max-h-[300px] sm:max-h-[400px] lg:max-h-[500px]`
- [ ] Consider adding scroll snap: `snap-y snap-mandatory`
- [ ] Optimize card spacing

### BookingsList (Dashboard)

- [ ] Optimize card padding
  - Update CardContent: `gap-3 py-3 md:gap-4 md:py-4`
- [ ] Ensure badge wrapping works on small screens
- [ ] Verify action button layout on mobile

### BookingChangeFeed

- [ ] Review mobile layout
- [ ] Ensure card-based scrollable list
- [ ] Add responsive spacing

### DashboardSummaryCard

- [ ] Optimize internal padding
  - CardHeader: `p-4 md:p-6`
  - CardContent: `p-4 md:p-6`
- [ ] Update internal spacing: `space-y-4 md:space-y-6`

## Phase 5: Navigation & Sidebar

### Sidebar Behavior

- [ ] Test sidebar on mobile (collapsible behavior)
- [ ] Verify drawer-style works correctly
- [ ] Test restaurant switcher on mobile

### Navigation Items

- [ ] Verify navigation item heights ≥ 44px
- [ ] Test touch interactions
- [ ] Verify focus states on mobile

### Skip to Content

- [ ] Verify skip link works on mobile
- [ ] Test focus visibility

## Phase 6: Forms & Inputs

### Input Enhancements

- [ ] `BookingsHeader.tsx`: Add inputmode="search" to search input
- [ ] Ensure search input height: `h-11`
- [ ] Verify email inputs have inputmode="email"
- [ ] Verify numeric inputs have inputmode="numeric"

### Form Layout

- [ ] Walk-in booking form: Test on mobile
- [ ] Verify form validation visibility on mobile
- [ ] Test keyboard interactions

## Phase 7: Modals & Dialogs

### Dialog Sizing

- [ ] `BookingDetailsDialog.tsx`: Add responsive max-width
  - Add: `sm:max-w-md md:max-w-lg max-h-[90vh] overflow-auto`
- [ ] `EditBookingDialog`: Verify mobile behavior
- [ ] `CancelBookingDialog`: Verify mobile behavior

### Dialog Content

- [ ] Test scrolling on mobile
- [ ] Verify button placement and sizing
- [ ] Test keyboard navigation

## Phase 8: Performance & Polish

### Loading States

- [ ] Verify skeleton loaders at all breakpoints
- [ ] Test loading transitions on mobile

### Error States

- [ ] Test alert messages on mobile
- [ ] Verify error readability
- [ ] Test retry functionality on touch devices

### Animations

- [ ] Add prefers-reduced-motion support where needed
- [ ] Verify animations are performant (transform/opacity only)
- [ ] Test animation interruption

### Images & Media

- [ ] Reserve space for images (prevent CLS)
- [ ] Add aspect ratios where applicable
- [ ] Optimize image sizes

## Testing

### Manual Testing - Breakpoints

- [ ] Test at 375px (iPhone SE)
- [ ] Test at 390px (iPhone 12/13)
- [ ] Test at 414px (iPhone Pro Max)
- [ ] Test at 640px (sm breakpoint)
- [ ] Test at 768px (md breakpoint - iPad portrait)
- [ ] Test at 1024px (lg breakpoint - iPad landscape)
- [ ] Test at 1280px (xl breakpoint - laptop)
- [ ] Test at 1920px (desktop)

### Touch Target Verification

- [ ] All buttons ≥ 44px on mobile
- [ ] Adequate spacing between elements
- [ ] No accidental taps
- [ ] Touch feedback visible

### Accessibility Testing

- [ ] Keyboard navigation works across all breakpoints
- [ ] Focus visible on all interactive elements
- [ ] Screen reader testing (VoiceOver iOS)
- [ ] Screen reader testing (TalkBack Android)
- [ ] Semantic HTML maintained
- [ ] ARIA labels correct and contextual

### Performance Testing

- [ ] Run Lighthouse (mobile mode)
- [ ] Verify LCP < 2.5s
- [ ] Verify FID < 100ms
- [ ] Verify CLS < 0.1
- [ ] Test on 3G network throttling
- [ ] Check bundle size impact

### Cross-Browser Testing

- [ ] iOS Safari (iPhone)
- [ ] Chrome Mobile (Android)
- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop

### Critical User Flows

- [ ] View dashboard on mobile
- [ ] Switch restaurants on mobile
- [ ] Filter bookings on mobile
- [ ] View booking details on mobile
- [ ] Edit booking on mobile
- [ ] Cancel booking on mobile
- [ ] Create walk-in booking on mobile
- [ ] Navigate between pages on mobile
- [ ] Sign out on mobile

### Edge Cases

- [ ] Test on very small screen (< 360px)
- [ ] Test on very large screen (> 1920px)
- [ ] Test in landscape orientation (mobile)
- [ ] Test with slow network
- [ ] Test with long restaurant names
- [ ] Test with long customer names
- [ ] Test with many bookings
- [ ] Test with no bookings (empty states)

## Documentation

- [ ] Update component comments if needed
- [ ] Document any new patterns introduced
- [ ] Update verification.md with test results

## Pre-Commit

- [ ] Run linter
- [ ] Run type checker
- [ ] Run unit tests
- [ ] Review git diff for unintended changes
- [ ] Check for console.log statements
- [ ] Verify no secrets or tokens

## Commit & PR

- [ ] Commit with descriptive message
- [ ] Create pull request
- [ ] Add screenshots (mobile, tablet, desktop)
- [ ] Reference task directory in PR description
- [ ] Request reviews

## Notes

**Assumptions**:

- shadcn/ui components handle base accessibility ✓
- Existing functionality will be preserved ✓
- No breaking changes to data structures ✓

**Deviations**:

- (None so far)

**Blockers**:

- (None currently)

## Batched Questions

- (None at this time - ready to proceed pending approval)
