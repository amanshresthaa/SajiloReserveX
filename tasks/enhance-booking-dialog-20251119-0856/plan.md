---
task: enhance-booking-dialog
timestamp_utc: 2025-11-19T08:56:37Z
owner: github:@amanshresthaa
reviewers: []
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Enhanced Booking Details Dialog

## Objective

Enhance the BookingDetailsDialog with intelligent time displays, quick contact actions, improved visual hierarchy, and micro-interactions to create a more efficient and delightful operations experience.

## Success Criteria

- [ ] Relative time displays show "2 hours from now" instead of static times
- [ ] Countdown timer visible for bookings starting within 60 minutes
- [ ] Copy-to-clipboard working for email and phone with visual feedback
- [ ] Quick action buttons include icons and keyboard shortcuts
- [ ] Status badges animate for urgent/imminent states
- [ ] VIP/loyalty indicators visible in guest profile
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Zero performance regressions (no dropped frames)

## Architecture & Components

### New Components to Create:

1. **`RelativeTime`** - Displays relative time with automatic updates
2. **`CopyButton`** - Copy-to-clipboard button with feedback
3. **`CountdownTimer`** - Live countdown for imminent bookings

### Modified Components:

1. **`DetailCard`** - Add copy button support and enhanced hover states
2. **`ProfileCard`** - Add VIP badge support
3. **`BookingDetailsDialog`** - Integrate new components and features

### New Utilities:

1. **`formatRelativeTime()`** - Format DateTime to relative string
2. **`useCountdown()`** - Custom hook for countdown timer
3. **`useCopyToClipboard()`** - Custom hook for clipboard operations

## Data Flow & API Contracts

**No API changes needed** - All features use existing booking data.

### State Management:

```typescript
// New local state in BookingDetailsDialog
const [countdown, setCountdown] = useState<string | null>(null);
const [copiedField, setCopiedField] = useState<string | null>(null);
```

## UI/UX States

### Copy Button States:

- **Default**: Copy icon visible
- **Hover**: Slight icon scale + tooltip
- **Clicked**: Success checkmark + "Copied!" toast
- **Timeout**: Revert to copy icon after 2 seconds

### Countdown Timer States:

- **>60 min**: Not shown
- **15-60 min**: Orange badge "Starts in X min"
- **<15 min**: Red pulsing badge "Starts in X min"
- **Started**: Green badge "Started X min ago"

### Status Badge States:

- **Urgent (imminent)**: Pulsing animation
- **Normal**: Static
- **Completed**: Static with checkmark

## Edge Cases

1. **Booking time in past**: Show "Started X min/hours ago" instead of countdown
2. **Clipboard API unavailable**: Show fallback "select to copy" behavior
3. **Very long customer names**: Truncate with ellipsis + tooltip
4. **Missing email/phone**: Show "Not provided" without copy button
5. **Timezone differences**: Always use restaurant timezone
6. **Rapid status changes**: Debounce animations to prevent flicker

## Testing Strategy

### Unit Tests:

- `formatRelativeTime()` with various time differences
- `useCountdown()` hook updates correctly
- `useCopyToClipboard()` success and error paths

### Integration Tests:

- Copy button integration with toast notifications
- Countdown timer updates every minute
- Status badges show correct animations

### Manual QA:

- Test across Chrome, Firefox, Safari
- Verify animations with `prefers-reduced-motion`
- Test keyboard navigation and shortcuts
- Verify touch targets on mobile (48x48px minimum)

## Rollout

**No feature flags needed** - UI enhancements only, backward compatible.

### Deployment Steps:

1. Deploy to staging/dev environment
2. Manual QA by ops team
3. Deploy to production
4. Monitor for performance issues (Core Web Vitals)

### Monitoring:

- Watch for increased error rates in browser console
- Monitor dialog open/close performance metrics
- Track clipboard API errors

## Implementation Checklist

### Phase 1: Time Intelligence

- [ ] Create `formatRelativeTime()` utility
- [ ] Create `useCountdown()` hook
- [ ] Create `RelativeTime` component
- [ ] Add countdown timer to dialog header
- [ ] Update DetailCard to show relative times
- [ ] Add time context badges

### Phase 2: Contact Quick Actions

- [ ] Create `useCopyToClipboard()` hook
- [ ] Create `CopyButton` component
- [ ] Add copy buttons to email/phone DetailCards
- [ ] Add toast notifications for copy feedback
- [ ] Add tel: and mailto: links

### Phase 3: Enhanced Quick Actions

- [ ] Add icons to BookingActionButton
- [ ] Improve button sizing and colors
- [ ] Add keyboard shortcut badges
- [ ] Update Quick Actions card styling

### Phase 4: Visual Polish

- [ ] Add pulse animation to imminent status badges
- [ ] Add hover states to all interactive elements
- [ ] Add success animations for actions
- [ ] Add loading states

### Phase 5: Guest Intelligence

- [ ] Add VIP badge to high-tier loyalty members
- [ ] Add loyalty points display enhancements
- [ ] Add contextual guest information

## Performance Considerations

- ✅ Use CSS animations (GPU-accelerated)
- ✅ Debounce timer updates to every 60 seconds
- ✅ Clean up intervals on component unmount
- ✅ Use `will-change` sparingly for animations
- ✅ Lazy load heavy components if needed

## Accessibility

- ✅ All buttons have aria-labels
- ✅ Copy feedback announced via aria-live regions
- ✅ Countdown timer has aria-live="polite"
- ✅ Animations disabled if `prefers-reduced-motion`
- ✅ Keyboard shortcuts documented and accessible
- ✅ Color contrast meets WCAG AA (4.5:1)

## Database Changes

**None required** - All features use existing data.
