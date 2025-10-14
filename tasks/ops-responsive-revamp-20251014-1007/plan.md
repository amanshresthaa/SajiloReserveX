# Implementation Plan: Ops Dashboard Responsive Revamp

## Objective

Transform the `/ops` dashboard into a fully responsive, mobile-first experience that works seamlessly across all device sizes (320px to 1920px+) while maintaining feature parity and improving touch interactions.

## Success Criteria

- [ ] Dashboard renders correctly at 320px (iPhone SE)
- [ ] Layout adapts appropriately at breakpoints: 480px, 768px, 1024px, 1280px
- [ ] All touch targets meet minimum 44px on mobile
- [ ] No horizontal scrolling at any breakpoint
- [ ] Typography remains readable (min 16px for inputs, proper line heights)
- [ ] Stat cards stack appropriately on smaller screens
- [ ] Bookings list is fully functional and readable on mobile
- [ ] All interactive elements work with touch (no hover-only interactions)
- [ ] Performance: No layout shifts, fast initial paint
- [ ] Accessibility: Keyboard navigation, focus management, screen reader support maintained

## Architecture & Components

### Component Hierarchy (existing, to be enhanced)

```
OpsDashboardClient (main container)
├── Header section (title + restaurant name)
├── Service Date section (date picker + navigation)
├── Stat Cards section (grid of 4 metrics)
├── Service Capacity section (period cards)
├── Reservations section
│   ├── BookingsFilterBar
│   ├── BookingsList
│   └── BookingDetailsDialog (modal)
├── VIP Guests section
└── Recent Changes section
```

### Responsive Strategy by Component

#### 1. Container & Layout (`OpsDashboardClient`)

**Current:**

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-white">
  <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
```

**Enhanced:**

- Add responsive padding: `px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-10`
- Reduce space-y on mobile: `space-y-4 sm:space-y-6`
- Ensure max-width doesn't constrain on mobile

#### 2. Header Section

**Current:**

```tsx
<h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
```

**Enhanced:**

- Font sizes: `text-xl sm:text-2xl lg:text-3xl`
- Add responsive line height: `leading-tight sm:leading-normal`

#### 3. Service Date Section

**Current:** Already good with flex-col on mobile
**Enhanced:**

- Ensure date navigation buttons are 44px: `h-11 w-11` (remove md:h-10)
- Add touch-action: `touch-action: manipulation` in Tailwind config

#### 4. Stat Cards Grid

**Current:**

```tsx
<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
```

**Enhanced:**

```tsx
// Mobile: 1 column for better readability
// Tablet: 2 columns
// Desktop/Large: 4 columns
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
```

**Individual Card:**

- Ensure proper padding on mobile: `p-4 sm:p-5`
- Icon size appropriate: `h-10 w-10` works well
- Value text: `text-2xl sm:text-3xl`

#### 5. Service Capacity Cards

**Current:** `grid gap-3 sm:grid-cols-2`
**Enhanced:** Already good, verify spacing

#### 6. Reservations Section

**FilterBar:**

- Current button height `h-11 md:h-10` should be `h-11` (44px on all sizes)
- Ensure toggle buttons wrap on very small screens
- Add `gap-2` between filters

**BookingsList:**

- Cards already flex-col, enhance metadata stacking
- Ensure action buttons are 44px on mobile: `h-11`
- Stack guest info vertically on mobile:

```tsx
// Mobile: vertical stack
// Desktop: horizontal with separators
<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
```

**Export Button:**

- Keep visible on all sizes (critical functionality)
- Ensure 44px touch target on mobile

#### 7. VIP Guests Module

**Enhanced:**

- VIP badges wrap properly
- Stack cards vertically on mobile
- Proper touch targets for any interactive elements

#### 8. Recent Changes Feed

**Enhanced:**

- Similar to bookings list treatment
- Ensure timestamps are readable
- Stack change details vertically on mobile

## Data Flow & API Contracts

**No changes required** - all data fetching remains unchanged:

- `useOpsTodaySummary` - fetches summary data
- `useOpsCapacityUtilization` - fetches capacity
- `useOpsTodayVIPs` - fetches VIP guests
- `useOpsBookingChanges` - fetches recent changes
- `useOpsBookingStatusActions` - mutation for status changes

State management remains client-side with useState/useTransition.

## UI/UX States

All existing states preserved:

- **Loading**: DashboardSkeleton (already responsive)
- **Error**: DashboardErrorState (verify mobile layout)
- **Empty**: Various empty states per section (verify mobile)
- **Success**: Main dashboard view (enhanced for responsive)

## Responsive Breakpoint Strategy

### Mobile First Approach (320px base)

```css
/* Base styles: 320px - 640px (Mobile) */
.stat-card {
  padding: 1rem; /* 16px */
  font-size: 1.5rem; /* 24px */
}

/* Small tablets: 640px+ */
@media (min-width: 640px) {
  .stat-card {
    padding: 1.25rem; /* 20px */
  }
}

/* Tablets: 768px+ */
@media (min-width: 768px) {
  .sidebar {
    display: block;
  }
}

/* Laptops: 1024px+ */
@media (min-width: 1024px) {
  .container {
    padding: 2rem;
  }
}

/* Desktops: 1280px+ */
@media (min-width: 1280px) {
  .grid-stats {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Touch Target Specifications

```typescript
// Minimum touch targets (following WCAG 2.1 AAA)
const TOUCH_TARGETS = {
  mobile: {
    minimum: '44px', // height: h-11
    comfortable: '48px', // height: h-12
  },
  desktop: {
    standard: '36px', // height: h-9
    small: '32px', // height: h-8
  },
};
```

## Implementation Details

### 1. Global Responsive Utilities (Tailwind Config)

Add custom utilities:

```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        'touch-target': '44px',
        'touch-target-comfortable': '48px',
      },
      minHeight: {
        touch: '44px',
      },
      fontSize: {
        // Mobile-optimized scale
        'mobile-xs': ['0.75rem', { lineHeight: '1rem' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.5rem' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.75rem' }],
      },
    },
  },
};
```

### 2. Component-Specific Changes

#### OpsDashboardClient.tsx

**Changes needed:**

1. Container padding and spacing adjustments
2. Header text scaling
3. Stat cards grid responsive columns
4. Section card padding adjustments
5. Touch target fixes on navigation buttons

#### BookingsList.tsx

**Changes needed:**

1. Card content layout stacking
2. Action button touch targets
3. Badge and metadata wrapping
4. Guest info display on mobile

#### BookingsFilterBar.tsx

**Changes needed:**

1. Touch target height consistency
2. Filter button wrapping
3. Proper spacing between toggles

#### BookingDetailsDialog.tsx

**Changes needed:**

1. Verify modal works on mobile
2. Ensure proper scrolling if content overflows
3. Close button is easily tappable

### 3. CSS Classes to Add/Modify

**Touch optimization:**

```tsx
// Add to interactive elements
className = 'touch-manipulation select-none';
```

**Responsive spacing:**

```tsx
// Replace fixed spacing with responsive
'px-4 py-6 sm:px-6 lg:px-8';
'space-y-4 sm:space-y-6';
'gap-3 sm:gap-4 lg:gap-6';
```

**Typography scale:**

```tsx
// Headings
'text-lg sm:text-xl lg:text-2xl';
// Body text - keep at 16px minimum
'text-base';
// Labels
'text-sm';
```

## Edge Cases

1. **Very small screens (320px - 375px)**
   - Stat cards single column
   - Reduce padding to minimum
   - Ensure no text truncation
   - Allow vertical scrolling

2. **Landscape mobile (phone rotated)**
   - Maintain mobile layout (based on width)
   - Utilize horizontal space for cards

3. **Tablet portrait (768px)**
   - Show 2-column layouts
   - Sidebar still as sheet/drawer
   - Comfortable spacing

4. **Large desktop (1920px+)**
   - Max width constraint (max-w-7xl)
   - Don't stretch content too wide
   - Maintain readability

5. **Touch + mouse hybrid devices**
   - Support both interaction methods
   - Hover states optional, not required
   - Focus states always visible

## Testing Strategy

### Manual Testing (Chrome DevTools MCP)

1. **Device emulation tests:**
   - iPhone SE (375px)
   - iPhone 14 Pro (393px)
   - Pixel 7 (412px)
   - iPad Mini (768px)
   - iPad Pro (1024px)
   - Desktop (1280px, 1920px)

2. **Interaction tests:**
   - Tap all buttons (verify 44px targets)
   - Scroll through bookings list
   - Open/close sidebar on mobile
   - Filter bookings
   - Open booking details dialog
   - Navigate dates
   - Export bookings

3. **Layout verification:**
   - No horizontal scroll at any breakpoint
   - All text readable
   - Images/icons not distorted
   - Proper spacing maintained
   - No content cutoff

### Performance Testing

- Lighthouse mobile score > 90
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- No unnecessary re-renders on resize

### Accessibility Testing

- [ ] Keyboard navigation works at all sizes
- [ ] Focus indicators visible
- [ ] Screen reader announcements correct
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets meet WCAG AAA (44x44px)
- [ ] Text can be zoomed to 200% without breaking layout

## Rollout

### Phase 1: Core Responsive Framework (Day 1)

- Update container and global spacing
- Fix all touch targets to 44px minimum
- Enhance stat cards grid
- Test on mobile/tablet/desktop

### Phase 2: Component Refinements (Day 1-2)

- Enhance BookingsList mobile layout
- Improve BookingsFilterBar wrapping
- Refine typography scale
- Test interactions

### Phase 3: Polish & Edge Cases (Day 2)

- Test on actual devices if possible
- Fix any edge cases discovered
- Performance optimization
- Accessibility audit

### Phase 4: Verification (Day 2)

- Manual QA with Chrome DevTools MCP
- Document all test results
- Get sign-off from stakeholder

## Notes

- **No feature flag needed** - purely visual changes, no breaking functionality
- **Backward compatible** - desktop experience should improve, not regress
- **Performance neutral** - no additional JS/CSS bundle size
- **Accessibility improved** - better touch targets and responsive text

## Risks & Mitigations

| Risk                              | Impact | Mitigation                                    |
| --------------------------------- | ------ | --------------------------------------------- |
| Layout breaks on specific device  | High   | Test on wide range of devices/sizes           |
| Touch targets still too small     | Medium | Audit all interactive elements systematically |
| Text becomes unreadable on mobile | High   | Maintain 16px minimum, test with real content |
| Performance regression            | Medium | Measure before/after with Lighthouse          |
| Accessibility regression          | High   | Run axe DevTools before/after                 |

## Dependencies

- No new dependencies required
- Uses existing Tailwind configuration
- Uses existing SHADCN UI components
- Uses existing hooks and utilities
