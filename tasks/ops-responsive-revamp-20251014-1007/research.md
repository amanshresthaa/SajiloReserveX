# Research: Ops Dashboard Responsive Revamp

## Existing Patterns & Reuse

### Current Implementation Structure

**Main Components:**

- `/src/app/(ops)/ops/(app)/page.tsx` - Server component, renders OpsDashboardClient
- `/src/components/features/dashboard/OpsDashboardClient.tsx` - Main dashboard UI (450+ lines)
- `/src/components/features/ops-shell/OpsShell.tsx` - Layout wrapper with sidebar
- `/src/components/features/ops-shell/OpsSidebar.tsx` - Navigation sidebar

**Child Components:**

- `BookingsList.tsx` - Reservation list view
- `BookingsFilterBar.tsx` - Filter toggles for bookings
- `BookingDetailsDialog.tsx` - Booking details modal
- `VIPGuestsModule.tsx` - VIP guests display
- `BookingChangeFeed.tsx` - Recent changes feed
- `HeatmapCalendar.tsx` - Date selection calendar
- `ExportBookingsButton.tsx` - Export functionality
- `DashboardSkeleton.tsx` - Loading state

### Existing Responsive Patterns

**1. useIsMobile Hook (`/hooks/use-mobile.ts`)**

```typescript
const MOBILE_BREAKPOINT = 768;
// Returns true if window width < 768px
```

**2. Tailwind Breakpoints (from `tailwind.config.js`)**

- Default Tailwind breakpoints:
  - `sm:` - 640px
  - `md:` - 768px
  - `lg:` - 1024px
  - `xl:` - 1280px
  - `2xl:` - 1536px

**3. Sidebar Component (`components/ui/sidebar.tsx`)**

- Already implements responsive behavior:
  - Mobile: Sheet/drawer overlay (< 768px)
  - Desktop: Collapsible sidebar (≥ 768px)
  - Keyboard shortcut: Cmd/Ctrl + B
  - Touch-optimized with `after:absolute after:-inset-2` for larger tap areas

**4. Current Responsive Utilities in Dashboard:**

- Grid layouts: `grid-cols-2 md:grid-cols-4` for stat cards
- Flex direction: `flex-col sm:flex-row` for layout switching
- Padding: `p-4 sm:p-6` for adaptive spacing
- Text sizes: `text-2xl md:text-3xl` for headings
- Button heights: `h-11 md:h-9` for touch targets

### SHADCN UI Components Available

The project uses SHADCN UI with these components already available:

- `Button`, `Card`, `Badge`, `Skeleton`
- `Sheet` (mobile drawer)
- `Dialog` (modals)
- `Sidebar` (with built-in responsive behavior)
- `Toggle` (used in filters)
- All components support Tailwind responsive classes

## External Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [WCAG 2.1 Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) - 44x44px minimum
- [Mobile-First CSS](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

## Constraints & Risks

### Technical Constraints

1. **Next.js App Router**: Server/client component split requires careful state management
2. **Existing data hooks**: All data fetching uses existing hooks (useOpsTodaySummary, etc.) - DO NOT modify
3. **Supabase auth**: Session management already handled, auth flow should not be changed
4. **TypeScript strict mode**: All changes must be type-safe

### Performance Risks

1. **Mobile network**: Dashboard loads multiple data sources - ensure progressive loading
2. **Image/media**: No images currently, but ensure any future additions are optimized
3. **Re-renders**: Dashboard has complex state - avoid unnecessary re-renders on resize

### UX Risks

1. **Information density**: Dashboard shows lot of data - needs careful prioritization on mobile
2. **Touch targets**: Current buttons sometimes use `h-9` (36px) - below 44px minimum
3. **Navigation**: Need to ensure sidebar doesn't obscure content on tablets
4. **Horizontal scroll**: Wide tables/content could cause horizontal scroll on mobile

### Browser Support

- Modern browsers (Chrome, Safari, Firefox, Edge)
- Must support touch events
- Must respect `prefers-reduced-motion`

## Open Questions (and answers)

**Q: Should we hide any features on mobile or just reflow?**
A: Reflow all features - keep functionality consistent. Use progressive disclosure (e.g., details behind tap/dialog) rather than hiding.

**Q: What's the minimum supported screen width?**
A: 320px (iPhone SE) as per requirements.

**Q: Should we add a mobile app header/nav bar?**
A: No - sidebar already converts to Sheet on mobile. Just ensure trigger is visible.

**Q: Do we need to modify the data fetching/hooks?**
A: No - all data hooks work correctly. Only modify presentation layer.

**Q: Should stat cards be scrollable horizontally on mobile?**
A: No - stack vertically using grid with responsive columns.

## Recommended Direction

### Mobile-First Approach Strategy

**Phase 1: Foundation (Core Responsive Infrastructure)**

1. Audit all touch targets - ensure 44px minimum on mobile
2. Fix button heights: `h-11` (44px) on mobile, `md:h-9` (36px) on desktop
3. Enhance grid layouts for proper stacking
4. Add proper spacing for touch interactions

**Phase 2: Layout Enhancements**

1. **Service Date Section**: Already good, minor tweaks for spacing
2. **Stat Cards**: Change from `xl:grid-cols-4` to `sm:grid-cols-2 xl:grid-cols-4`
3. **Service Capacity**: Already responsive, verify on mobile
4. **Bookings List**: Enhance card layout for mobile vertical stacking
5. **VIP Module**: Ensure proper wrapping and spacing
6. **Change Feed**: Similar to bookings list treatment

**Phase 3: Component-Level Refinements**

1. **BookingsFilterBar**: Ensure toggles are touch-friendly
2. **BookingsList cards**: Stack guest info vertically on mobile
3. **Export button**: Consider moving to action menu on mobile
4. **HeatmapCalendar**: Already in popover - ensure popover is mobile-friendly

**Phase 4: Typography & Spacing**

1. Implement responsive typography scale
2. Add proper spacing using Tailwind's spacing scale
3. Ensure text remains readable on small screens (min 16px for inputs)

### Recommended Breakpoints

- **320px - 480px (Mobile)**: Single column, vertical stacking, touch-optimized
- **481px - 768px (Tablet)**: 2-column grids where appropriate, larger touch targets
- **769px - 1024px (Laptop)**: 2-3 columns, transition to desktop patterns
- **1025px+ (Desktop)**: Full 4-column layouts, optimal spacing

### Key Principles

1. **Content Priority**: Most important info first (bookings, stats, actions)
2. **Touch Targets**: Minimum 44px on mobile, 36px on desktop
3. **No Horizontal Scroll**: All content must fit viewport width
4. **Progressive Enhancement**: Start mobile, enhance for desktop
5. **Consistent Patterns**: Reuse SHADCN components, maintain design system
6. **Performance**: No layout shifts, fast paint times

### What NOT to Change

- Data fetching hooks and logic
- Authentication flow
- API contracts
- State management patterns
- Routing structure
- Server/client component boundaries
