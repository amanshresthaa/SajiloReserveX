# Implementation Plan: Ops Console Mobile-First Redesign

**Task**: ops-mobile-first-redesign-20251013-2341
**Date**: 2025-10-13 23:41 UTC
**Target**: http://localhost:3001/ops

## Objective

Transform the ops console into a fully mobile-first responsive interface that provides optimal user experience across all device sizes (mobile 375px → tablet 768px → laptop 1024px → desktop 1280px+) while maintaining feature parity and accessibility standards.

## Success Criteria

- [x] All interactive elements meet minimum 44px touch target on mobile
- [x] Smooth responsive transitions across all Tailwind breakpoints (base, sm, md, lg, xl)
- [x] Mobile-specific card layouts where tables exist
- [x] Optimized spacing and typography for mobile screens
- [x] Zero Console errors or CLS (Cumulative Layout Shift)
- [x] Maintained WCAG AA accessibility compliance
- [x] Performance: Critical interactions < 500ms
- [x] All existing functionality preserved

## Architecture & Components

### Component Hierarchy

```
OpsShell (Layout)
├── OpsSidebar (Navigation)
│   ├── OpsRestaurantSwitch
│   └── Navigation Links
└── OpsSidebarInset (Content)
    ├── OpsDashboardClient
    │   ├── SummaryMetrics
    │   ├── CapacityVisualization
    │   ├── VIPGuestsModule
    │   ├── DashboardSummaryCard
    │   │   ├── BookingsFilterBar
    │   │   ├── BookingsList
    │   │   └── HeatmapCalendar
    │   └── BookingChangeFeed
    ├── OpsBookingsClient
    │   └── BookingsTable
    │       ├── BookingsListMobile (mobile)
    │       └── Table (desktop)
    └── OpsWalkInBookingClient
```

### Design Patterns

**Mobile-First Approach**:

1. Base styles target mobile (< 640px)
2. Progressive enhancement via breakpoint modifiers
3. Touch-first interactions (no hover dependencies)
4. Stack vertically on mobile, grid on larger screens

**Responsive Strategy**:

```
Mobile     (base)   : Single column, full-width, 44px touch targets
Small      (sm: 640px+) : 2-column grids, adjusted spacing
Medium     (md: 768px+) : Tables appear, enhanced layouts
Large      (lg: 1024px+) : Multi-column dashboards, sidebar
Extra Large(xl: 1280px+) : Optimal desktop spacing, max content width
```

## Implementation Phases

### Phase 1: Touch Targets & Spacing (Priority: Critical)

**Goal**: Ensure all interactive elements are mobile-friendly

#### 1.1 Button & Interactive Element Sizing

- **Current**: Variable heights, no mobile-specific sizing
- **Target**: Minimum 44px (h-11) on mobile, scale down on desktop
- **Pattern**: `h-11 md:h-9` or `h-11 md:h-10`

**Components to Update**:

- `BookingsFilterBar`: ToggleGroupItem buttons
- `BookingsList`: Action buttons (mark show/no-show, details)
- `OpsSidebar`: Navigation items, sign out button (already has `touch-manipulation` ✓)
- `CapacityVisualization`: Cards and interactive elements
- `VIPGuestsModule`: VIP cards
- `BookingChangeFeed`: Any interactive elements

**Implementation**:

```tsx
// Before
<Button variant="ghost" size="sm">Mark show</Button>

// After
<Button variant="ghost" size="sm" className="h-11 md:h-9">Mark show</Button>
```

#### 1.2 Vertical Spacing Optimization

- **Current**: Fixed `space-y-8` (32px) everywhere
- **Target**: Responsive spacing that reduces on mobile
- **Pattern**: `space-y-4 md:space-y-6 lg:space-y-8`

**Components to Update**:

- `OpsDashboardClient`: Main container
- `DashboardSummaryCard`: Internal spacing
- `OpsBookingsClient`: Section spacing

**Implementation**:

```tsx
// Before
<div className="space-y-8">

// After
<div className="space-y-4 md:space-y-6 lg:space-y-8">
```

### Phase 2: Dashboard Layout Optimization (Priority: High)

**Goal**: Improve dashboard grid responsiveness with proper breakpoint coverage

#### 2.1 Dashboard Grid Enhancement

- **Current**: `grid gap-6 lg:grid-cols-3` (jumps from 1 col to 3 cols at 1024px)
- **Target**: Progressive grid: 1 col → 1 col (sm) → 2 cols (md) → 3 cols (lg)

**Component**: `OpsDashboardClient.tsx`

**Implementation**:

```tsx
// Before
<div className="grid gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">
    <CapacityVisualization />
  </div>
  <div>
    <VIPGuestsModule />
  </div>
</div>

// After
<div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
  <div className="md:col-span-2">
    <CapacityVisualization />
  </div>
  <div className="md:col-span-2 lg:col-span-1">
    <VIPGuestsModule />
  </div>
</div>
```

**Rationale**:

- Mobile (< 768px): Stack everything vertically
- Tablet (768px+): 2-column layout, VIPs span full width
- Desktop (1024px+): 3-column with 2:1 ratio for capacity:VIPs

#### 2.2 SummaryMetrics Grid

- **Current**: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`
- **Issue**: Jumps from 2 cols to 4 cols, missing md breakpoint

**Implementation**:

```tsx
// After
<div className="grid gap-3 grid-cols-2 md:grid-cols-4">
```

**Rationale**:

- Mobile: 2 columns (compact but readable)
- Tablet+: 4 columns (all metrics visible at once)
- Reduced gap on mobile: `gap-3` instead of `gap-4`

#### 2.3 CapacityVisualization Period Cards Grid

- **Current**: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Enhancement**: Add responsive gap

**Implementation**:

```tsx
// Before
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// After
<div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
```

### Phase 3: Typography & Readability (Priority: High)

**Goal**: Optimize text sizes for mobile while maintaining hierarchy

#### 3.1 Heading Sizes

**Current**: Fixed sizes across all viewports
**Target**: Scale down on mobile, scale up on desktop

**Components**: All dashboard modules, page headers

**Pattern**:

```tsx
// Page titles (H1)
// Before: text-2xl
// After: text-xl sm:text-2xl lg:text-3xl

// Section titles (H2)
// Before: text-2xl
// After: text-lg md:text-xl lg:text-2xl

// Card titles (H3)
// Before: text-lg
// After: text-base md:text-lg
```

**Implementation**:

```tsx
// OpsDashboardClient
<h2 className="text-lg md:text-xl lg:text-2xl font-semibold tracking-tight">
  Service snapshot
</h2>

// OpsBookingsClient
<h2 className="text-lg md:text-xl lg:text-2xl font-semibold tracking-tight">
  Manage bookings
</h2>
```

#### 3.2 Body Text & Labels

- Ensure minimum 16px on inputs (prevent iOS zoom)
- Maintain readable contrast ratios
- Use appropriate line-height for mobile

### Phase 4: Card & Module Refinement (Priority: Medium)

**Goal**: Optimize individual module layouts for mobile

#### 4.1 VIPGuestsModule Mobile Optimization

**Current**: Fixed `max-h-[400px]`
**Issue**: May not suit small screens

**Implementation**:

```tsx
// Before
<div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">

// After
<div className="max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] space-y-3 overflow-y-auto pr-2">
```

**Enhancement**: Add scroll snap for better mobile UX

```tsx
<div className="... snap-y snap-mandatory">
  <VIPCard className="snap-start" />
</div>
```

#### 4.2 BookingsList Card Refinement

**Current**: Good mobile implementation ✓
**Enhancement**: Optimize padding on mobile

**Component**: `BookingsList` (dashboard, not table)

**Implementation**:

```tsx
// Card content
<CardContent className="flex flex-col gap-3 py-3 md:gap-4 md:py-4 md:flex-row md:items-center">
```

#### 4.3 BookingChangeFeed Mobile View

**Current**: Implementation unclear
**Target**: Card-based, scrollable list

**Implementation**: Similar pattern to VIPGuestsModule

#### 4.4 DashboardSummaryCard Internal Layout

**Current**: Standard card with sections
**Enhancement**: Optimize internal spacing

**Implementation**:

```tsx
<CardHeader className="space-y-2 p-4 md:p-6">
  <CardTitle className="text-base md:text-lg lg:text-xl">...</CardTitle>
</CardHeader>
<CardContent className="space-y-4 p-4 md:space-y-6 md:p-6">
```

### Phase 5: Navigation & Sidebar (Priority: Medium)

**Goal**: Ensure optimal sidebar behavior on mobile

#### 5.1 Sidebar Behavior Verification

**Current**: Uses SidebarProvider with collapsible='icon'
**Action**: Test mobile behavior, ensure drawer-style works

**Potential Enhancement**:

```tsx
// If mobile sidebar needs improvement, consider:
<SidebarProvider
  defaultOpen={defaultOpen}
  className="bg-background"
  // Force collapsed on mobile, expandable on desktop
>
```

#### 5.2 Skip to Content Link

**Current**: Good implementation ✓
**Action**: Verify focus visibility on mobile

#### 5.3 Touch Area for Navigation Items

**Current**: Has `touch-manipulation` ✓
**Action**: Verify 44px minimum height

**Implementation** (if needed):

```tsx
<SidebarMenuButton
  asChild
  isActive={active}
  className="min-h-11 touch-manipulation"
>
```

### Phase 6: Forms & Inputs (Priority: Medium)

**Goal**: Optimize form inputs for mobile keyboards

**Target**: Walk-in booking form, search inputs

#### 6.1 Input Font Sizes

- Ensure minimum 16px font size (prevent iOS zoom)
- Already handled by shadcn/ui components ✓

#### 6.2 Input Modes

- Add appropriate `inputmode` attributes
- Search: `inputmode="search"`
- Email: `inputmode="email"`
- Numbers: `inputmode="numeric"`

**Component**: `BookingsHeader` search input

**Implementation**:

```tsx
<Input
  type="search"
  inputMode="search"
  placeholder="Search bookings..."
  className="h-11 text-base"
/>
```

### Phase 7: Modals & Dialogs (Priority: Low)

**Goal**: Improve dialog behavior on mobile

#### 7.1 Dialog Sizing

**Current**: Standard dialog
**Enhancement**: Consider full-screen on mobile for complex forms

**Implementation**:

```tsx
<Dialog>
  <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-auto">
    {/* Content */}
  </DialogContent>
</Dialog>
```

#### 7.2 Booking Details Dialog

**Component**: `BookingDetailsDialog.tsx`
**Action**: Verify mobile scrolling and button placement

### Phase 8: Performance & Polish (Priority: Low)

**Goal**: Optimize performance and add finishing touches

#### 8.1 Loading States

- Ensure skeleton loaders scale properly on mobile
- Current implementation looks good ✓

#### 8.2 Error States

- Verify alert/error message readability on mobile
- Current implementation looks good ✓

#### 8.3 Image Optimization

- Ensure proper image sizing to prevent CLS
- Reserve space with aspect ratios

#### 8.4 Animations & Transitions

- Respect `prefers-reduced-motion`
- Keep animations performant (transform/opacity only)

## Data Flow & State Management

**No changes required** - existing state management patterns work well:

- React Query for server state ✓
- Context for ops session ✓
- URL state for filters/pagination ✓

## Testing Strategy

### Manual Testing (Chrome DevTools MCP)

**Critical Paths**:

1. Dashboard view across all breakpoints
2. Bookings list interaction (edit, cancel)
3. Walk-in booking creation
4. Restaurant switching
5. Sign out flow

**Breakpoint Testing**:

- 375px (iPhone SE)
- 390px (iPhone 12/13)
- 414px (iPhone Pro Max)
- 768px (iPad portrait)
- 1024px (iPad landscape)
- 1280px (laptop)
- 1920px (desktop)

**Touch Target Verification**:

- All buttons ≥ 44px on mobile
- Adequate spacing between interactive elements
- No accidental taps due to proximity

**Accessibility Testing**:

- Keyboard navigation works
- Focus visible on all interactive elements
- Screen reader testing with VoiceOver (iOS) / TalkBack (Android)
- Semantic HTML maintained
- ARIA labels correct

### Automated Testing

**Unit Tests**:

- Component rendering at different viewports (existing tests)
- Responsive utility functions

**E2E Tests** (if available):

- Critical user flows work on mobile viewports
- Touch interactions function correctly

### Performance Testing

**Metrics**:

- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

**Tools**:

- Lighthouse (mobile mode)
- Chrome DevTools Performance panel
- Network throttling (3G simulation)

## Edge Cases & Failure Handling

### Small Screens (< 360px)

- Ensure critical content remains visible
- Allow horizontal scroll for table-like data if needed
- Test on iPhone SE (375px)

### Large Screens (> 1920px)

- Max-width constraints prevent excessive stretching
- Current `max-w-6xl` should work ✓

### Landscape Orientation (Mobile)

- Test sidebar behavior in landscape
- Ensure modals don't overflow

### Touch vs Mouse

- No hover-only interactions
- Touch feedback on buttons (shadcn/ui handles this ✓)

### Slow Networks

- Loading states clear and non-blocking
- Optimistic updates where appropriate

### Browser Compatibility

- Modern browsers (last 2 versions) ✓
- iOS Safari (critical for mobile)
- Chrome Mobile (Android)

## Rollout Plan

### Development Phase

1. Create feature branch: `task/ops-mobile-first-redesign-20251013-2341`
2. Implement changes iteratively (phase by phase)
3. Test after each phase
4. Commit frequently with descriptive messages

### QA Phase

1. Manual testing with Chrome DevTools Device Emulation
2. Real device testing (iPhone, Android phone, tablet)
3. Accessibility audit with axe DevTools
4. Performance profiling with Lighthouse

### Deployment

1. Feature flag: `ops_mobile_optimized_v2` (if applicable)
2. Gradual rollout: Internal testing → Beta users → All users
3. Monitor for issues: Console errors, performance metrics
4. Quick rollback plan if critical issues arise

### Monitoring

- Track Core Web Vitals (especially on mobile)
- Monitor error rates (Sentry or equivalent)
- Collect user feedback on mobile experience

## File Change Summary

**Files to Modify**:

1. `src/components/features/dashboard/OpsDashboardClient.tsx`
   - Update grid layout with md: breakpoint
   - Add responsive spacing

2. `src/components/features/dashboard/SummaryMetrics.tsx`
   - Adjust grid columns and gap

3. `src/components/features/dashboard/BookingsList.tsx`
   - Add touch target sizing to buttons
   - Optimize card padding

4. `src/components/features/dashboard/CapacityVisualization.tsx`
   - Add responsive gap
   - Optimize card layout

5. `src/components/features/dashboard/VIPGuestsModule.tsx`
   - Responsive max-height
   - Optimize spacing

6. `src/components/features/dashboard/BookingsFilterBar.tsx`
   - Ensure 44px touch targets

7. `src/components/features/dashboard/DashboardSummaryCard.tsx`
   - Responsive padding
   - Typography scaling

8. `src/components/features/bookings/OpsBookingsClient.tsx`
   - Responsive spacing
   - Typography scaling

9. `src/components/features/walk-in/OpsWalkInBookingClient.tsx`
   - Optimize header layout
   - Ensure responsive spacing

10. `components/dashboard/BookingsHeader.tsx` (if exists)
    - Add inputmode to search
    - Ensure mobile-friendly input sizing

**Files to Review** (may not need changes):

- `src/components/features/ops-shell/OpsShell.tsx` ✓
- `src/components/features/ops-shell/OpsSidebar.tsx` ✓
- `components/dashboard/BookingsListMobile.tsx` ✓ (already good)
- `components/dashboard/BookingsTable.tsx` ✓ (already responsive)

**New Files** (if needed):

- None - working with existing components

## Verification Checklist

After implementation, verify:

- [ ] All interactive elements ≥ 44px on mobile
- [ ] Smooth transitions across all breakpoints (375px, 640px, 768px, 1024px, 1280px+)
- [ ] Typography scales appropriately
- [ ] Spacing optimized for mobile (not too cramped, not too spacious)
- [ ] No horizontal overflow on mobile
- [ ] Grid layouts work at all breakpoints
- [ ] Sidebar/navigation functions properly on mobile
- [ ] Forms and inputs work with mobile keyboards
- [ ] Dialogs/modals don't overflow on mobile
- [ ] Loading and error states render correctly
- [ ] No console errors or warnings
- [ ] Zero CLS (no layout shift during load)
- [ ] Touch interactions feel responsive
- [ ] Keyboard navigation still works (desktop)
- [ ] Screen reader announces content correctly
- [ ] Focus indicators visible on all interactive elements
- [ ] Performance: LCP < 2.5s, FID < 100ms, CLS < 0.1

## Dependencies

**External**:

- shadcn/ui components (already installed) ✓
- Tailwind CSS (already configured) ✓
- React Query (already used) ✓

**Internal**:

- No new dependencies required ✓

## Timeline Estimate

- **Phase 1** (Touch & Spacing): 2-3 hours
- **Phase 2** (Dashboard Layout): 2-3 hours
- **Phase 3** (Typography): 1-2 hours
- **Phase 4** (Card Refinement): 2-3 hours
- **Phase 5** (Navigation): 1-2 hours
- **Phase 6** (Forms): 1 hour
- **Phase 7** (Dialogs): 1 hour
- **Phase 8** (Performance): 1-2 hours
- **Testing & QA**: 3-4 hours
- **Total**: 14-21 hours

## Success Metrics

**Quantitative**:

- 100% of interactive elements meet 44px touch target
- 0 console errors or warnings
- CLS score < 0.1
- LCP < 2.5s on mobile (3G)
- All breakpoints covered (base, sm, md, lg, xl)

**Qualitative**:

- Mobile UI feels natural and responsive
- No frustrated user interactions (mis-taps, hard-to-read text)
- Consistent experience across iOS and Android
- Maintains desktop experience quality

## Notes

- Existing `BookingsListMobile` component is excellent reference for patterns ✓
- Team already follows mobile-first for tables ✓
- Accessibility standards already high - maintain them ✓
- shadcn/ui provides solid foundation - extend, don't replace ✓
