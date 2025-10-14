# Research: Ops Console Mobile-First Redesign

**Task**: ops-mobile-first-redesign-20251013-2341
**Date**: 2025-10-13 23:41 UTC
**Target URL**: http://localhost:3001/ops

## Objective

Revamp the ops console interface with a mobile-first approach, ensuring optimal user experience across all device sizes (mobile → tablet → desktop) using React, Next.js, and shadcn/ui components.

## Current Implementation Analysis

### Route Structure

The ops console is structured under `app/(ops)/ops/(app)/`:

- `/ops` - Main dashboard (OpsDashboardClient)
- `/ops/bookings` - Bookings management (OpsBookingsClient)
- `/ops/bookings/new` - Walk-in booking creation (OpsWalkInBookingClient)
- `/ops/restaurant-settings` - Restaurant settings (OpsRestaurantSettingsClient)
- `/ops/customer-details` - Customer details
- `/ops/team` - Team management

### Layout & Shell

**OpsShell** (`src/components/features/ops-shell/OpsShell.tsx`):

- Uses shadcn's `SidebarProvider` with collapsible sidebar
- Responsive padding: `px-4 py-6 sm:px-6 lg:px-8` ✓
- Max-width: `max-w-6xl`
- Skip-to-content link for accessibility ✓

**OpsSidebar** (`src/components/features/ops-shell/OpsSidebar.tsx`):

- Collapsible sidebar with `collapsible='icon'`
- Touch-friendly class `touch-manipulation` ✓
- Uses semantic nav structure ✓
- Sign out functionality with loading state ✓

### Dashboard Components

**OpsDashboardClient** (`src/components/features/dashboard/OpsDashboardClient.tsx`):

```tsx
// Current layout
<div className="space-y-8">
  <section className="space-y-2">
    <h2 className="text-2xl font-semibold">...</h2>
  </section>

  <div className="grid gap-6 lg:grid-cols-3">
    <div className="lg:col-span-2">
      <CapacityVisualization />
    </div>
    <div>
      <VIPGuestsModule />
    </div>
  </div>

  <DashboardSummaryCard />
  <BookingChangeFeed />
</div>
```

**Issues**:

- No mobile-specific breakpoints before `lg` (1024px)
- Large vertical spacing (`space-y-8`) on mobile
- Dashboard wrapper has `max-w-5xl` constraint from page.tsx

**CapacityVisualization** (`src/components/features/dashboard/CapacityVisualization.tsx`):

- Grid: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Good**: Progressive enhancement approach ✓
- **Issue**: Period cards might be too small on mobile
- Uses semantic HTML and ARIA labels ✓

**VIPGuestsModule** (`src/components/features/dashboard/VIPGuestsModule.tsx`):

- Fixed `max-h-[400px]` could be problematic on small screens
- Card layout with avatar/badge works reasonably well
- **Issue**: Might need better overflow handling on mobile

**BookingsList** (`src/components/features/dashboard/BookingsList.tsx`):

```tsx
<CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
```

- **Good**: Mobile-first flex direction ✓
- **Good**: Wrapping items with gaps ✓
- **Issue**: Action buttons might be too small for touch (no explicit min-height)
- **Issue**: Multiple badges/icons could overflow on small screens

**BookingsFilterBar** (`src/components/features/dashboard/BookingsFilterBar.tsx`):

- Uses `ToggleGroup` with `w-full max-w-sm`
- Pills style with `rounded-full`
- **Good**: Full-width approach ✓
- **Issue**: No explicit touch target sizing

**DashboardSummaryCard** (`src/components/features/dashboard/DashboardSummaryCard.tsx`):

- Standard card layout
- Responsive metrics grid in SummaryMetrics
- **Issue**: Heatmap calendar responsiveness unclear

### Bookings Page

**OpsBookingsClient** (`src/components/features/bookings/OpsBookingsClient.tsx`):

- Uses `BookingsTable` component
- Search and filter functionality
- **Issue**: Table layout on mobile needs investigation
- Dialogs for edit/cancel actions ✓

### Walk-in Booking

**OpsWalkInBookingClient** (`src/components/features/walk-in/OpsWalkInBookingClient.tsx`):

- Uses `BookingFlowPage` component
- Responsive padding: `px-4 py-6 sm:px-6 lg:px-8` ✓
- Header with action button
- **Issue**: Header flex layout might wrap awkwardly on mobile

## Existing Patterns & Components to Reuse

### shadcn/ui Components in Use

✓ Currently implemented:

- `Button` - with variants and sizes
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Badge` - with color variants
- `Alert`, `AlertTitle`, `AlertDescription`
- `Sidebar`, `SidebarProvider`, `SidebarContent`, etc.
- `Dialog` components
- `ToggleGroup`, `ToggleGroupItem`
- `Progress`
- `Skeleton`

### Responsive Patterns Already Present

✓ Good patterns:

1. **Mobile-first flex layouts**: `flex-col` → `md:flex-row`
2. **Progressive grids**: Base → `sm:` → `md:` → `lg:` → `xl:`
3. **Responsive spacing**: `px-4 sm:px-6 lg:px-8`
4. **Touch-friendly class**: `touch-manipulation` on interactive elements
5. **Max-width constraints**: `max-w-*` for readability
6. **Accessible skip links**: Screen reader and keyboard nav support

## Mobile Responsiveness Issues Identified

### Critical Issues

1. **Touch Target Sizing**
   - Buttons and interactive elements lack explicit min-height/min-width
   - iOS/Android guidelines: 44px minimum touch target
   - Current: No guarantees on touch target size

2. **Dashboard Grid Layout**
   - Jumps from single column to `lg:grid-cols-3` at 1024px
   - Missing `md:` breakpoint treatment (768px)
   - VIP module and Capacity visualization stack poorly on tablets

3. **Typography on Mobile**
   - Headers might be too large on small screens
   - No font-size scaling for mobile (`text-2xl` is ~24px everywhere)

4. **Booking Cards**
   - Horizontal scrolling risk with multiple badges/chips
   - Action buttons could be cramped on small screens
   - Guest details overflow handling unclear

5. **Table Components**
   - `BookingsTable` responsiveness unknown
   - Traditional tables don't work well on mobile (typically need card view)

6. **Fixed Heights**
   - VIP module: `max-h-[400px]` might not suit small screens
   - Need viewport-relative heights

7. **Modal/Dialog Behavior**
   - Need to verify dialog responsive behavior on mobile
   - Full-screen modals might be needed on small devices

### Medium Priority Issues

1. **Spacing Optimization**
   - `space-y-8` (32px) might be excessive on mobile
   - Could use `space-y-4 md:space-y-6 lg:space-y-8`

2. **Card Padding**
   - Standard padding might be too generous on mobile
   - Consider `p-4 md:p-6` patterns

3. **Navigation**
   - Sidebar collapsible behavior needs testing
   - Hamburger menu interaction on mobile unclear

4. **Form Inputs**
   - Need to verify input font size (iOS requirement: ≥16px to prevent zoom)
   - `inputmode` attributes for better mobile keyboards

## External Resources & Best Practices

### Tailwind Breakpoints (Reference)

- Base: Mobile (< 640px)
- `sm:` 640px+ (small tablets/large phones)
- `md:` 768px+ (tablets)
- `lg:` 1024px+ (laptops)
- `xl:` 1280px+ (desktops)
- `2xl:` 1536px+ (large screens)

### Mobile-First Design Principles

1. Design for smallest screen first
2. Add complexity as viewport grows
3. Touch-first interactions (44px minimum)
4. Readable font sizes (16px+ for body text)
5. Adequate spacing for thumbs
6. Avoid hover-dependent interactions

### WAI-ARIA Best Practices

- Already well-implemented in current code
- Continue using semantic HTML
- Maintain keyboard navigation
- Keep focus management in dialogs/modals

### Performance Considerations

- Keep initial mobile payload small
- Progressive enhancement with breakpoints
- Avoid layout shifts (CLS)
- Optimize images and lazy-load where appropriate

## Constraints & Risks

### Technical Constraints

1. Must use existing shadcn/ui component library
2. Must maintain TypeScript type safety
3. Must preserve existing accessibility features
4. Cannot break existing functionality
5. Server components vs client components distinction (Next.js App Router)

### Product Constraints

1. Ops users are primarily on desktop during service
2. Mobile access needed for floor managers during service
3. Must maintain feature parity across devices
4. No loss of information density on larger screens

### Performance Constraints

1. Target: Sub-500ms interactions for critical paths
2. Must pass Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
3. No JavaScript required for core content display (progressive enhancement)

### Browser Support

- Modern browsers (last 2 versions)
- iOS Safari (touch interactions critical)
- Chrome Mobile (Android)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

### Risks

1. **Breaking existing layouts**: Need comprehensive testing
2. **Performance regression**: More breakpoints = more CSS
3. **Accessibility regression**: Changes could affect keyboard/SR users
4. **Development time**: Thorough testing across breakpoints takes time

## Open Questions

### Q1: Should the sidebar be drawer-style on mobile?

**A**: Current implementation uses collapsible sidebar. Should investigate if a drawer (slide-out) is better for mobile. Check shadcn/ui drawer component.

### Q2: Should bookings table become cards on mobile?

**A**: Likely YES. Tables are difficult on mobile. Need card-based view below `md:` breakpoint.

### Q3: What's the priority order for mobile dashboard modules?

**A**: Suggested order:

1. Summary metrics (most critical)
2. Bookings list (primary workflow)
3. Capacity visualization
4. VIP guests
5. Booking changes feed
6. Heatmap calendar

This allows progressive disclosure on mobile.

### Q4: Should we implement a mobile-specific navigation?

**A**: Current sidebar should work with collapsible mode. Verify and potentially add bottom navigation for mobile if sidebar isn't optimal.

### Q5: How to handle the heatmap calendar on mobile?

**A**: Likely needs a simplified view or horizontal scroll with proper touch handling.

### Q6: Should modals be full-screen on mobile?

**A**: YES for complex dialogs (edit booking, settings). Simple confirmations can remain modal.

## Recommended Direction

### Phase 1: Foundation (High Priority)

1. **Audit and fix touch targets**
   - All buttons/links: min-h-11 (44px) on mobile
   - Use `h-11 md:h-9` pattern for size scaling

2. **Optimize dashboard grid**
   - Add `md:` breakpoint treatment
   - Implement: base (stack) → `md:` (2 cols) → `lg:` (3 cols)

3. **Responsive typography**
   - Headers: `text-xl md:text-2xl lg:text-3xl`
   - Body: Ensure 16px minimum

4. **Spacing optimization**
   - Reduce space-y values on mobile
   - Pattern: `space-y-4 md:space-y-6 lg:space-y-8`

### Phase 2: Component Redesign (Medium Priority)

1. **Bookings list → Card view on mobile**
   - Keep table for `md:` and up
   - Create responsive BookingsListMobile component

2. **Dashboard module reordering**
   - Stack all modules on mobile
   - Allow horizontal scroll for capacity periods if needed

3. **Sidebar/Navigation optimization**
   - Test collapsible sidebar on mobile
   - Consider drawer component if needed

4. **Dialog improvements**
   - Full-screen dialogs on mobile for complex forms
   - Sheet component for slide-up panels

### Phase 3: Polish (Lower Priority)

1. **Advanced interactions**
   - Swipe actions on booking cards (mobile)
   - Pull-to-refresh on lists

2. **Performance optimization**
   - Lazy load non-critical modules
   - Optimize images

3. **Enhanced accessibility**
   - Test with mobile screen readers
   - Improve touch focus indicators

## Success Metrics

1. **Usability**: All interactive elements ≥44px on mobile
2. **Responsive**: Breakpoint coverage (base, sm, md, lg, xl)
3. **Performance**: No CLS, fast interactions
4. **Accessibility**: WCAG AA compliance maintained
5. **Feature parity**: No functionality lost on mobile

## References

- [Tailwind CSS Breakpoints](https://tailwindcss.com/docs/responsive-design)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [iOS Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Material Design - Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
