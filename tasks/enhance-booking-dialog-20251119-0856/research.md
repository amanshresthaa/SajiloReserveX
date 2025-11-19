---
task: enhance-booking-dialog
timestamp_utc: 2025-11-19T08:56:37Z
owner: github:@amanshresthaa
reviewers: []
risk: low
flags: []
related_tickets: []
---

# Research: Enhanced Booking Details Dialog

## Requirements

### Functional:

- Add time intelligence with relative timestamps and countdown timers
- Implement quick copy/call/email actions for contact information
- Enhance quick actions card with icons and better visual hierarchy
- Add status badge animations and context
- Implement micro-interactions and visual feedback
- Add guest profile enhancements (VIP indicators, visit count)

### Non-functional:

- **Accessibility**: Maintain WCAG compliance, add keyboard shortcuts
- **Performance**: Ensure animations are performant (60fps), use CSS transforms
- **UX**: All interactions should feel smooth and responsive
- **i18n**: Time formatting should respect timezone and locale

## Existing Patterns & Reuse

Reviewed existing codebase:

- ✅ `BookingDetailsDialog.tsx` - Base dialog structure in place (recently enhanced)
- ✅ `BookingActionButton` - Action button component exists
- ✅ `formatTimeRange` utility - Time formatting available in `@/lib/utils/datetime`
- ✅ `DateTime` from luxon - Already used for timezone handling
- ✅ Badge and Button components from Shadcn UI
- ✅ Lucide icons library available

**Reusable patterns:**

- Use existing `DetailCard` and `ProfileCard` components (just created)
- Leverage luxon's `DateTime.diff()` for relative time calculations
- Use existing animation utilities from Tailwind (`animate-pulse`, `transition-all`)
- Follow established color system and spacing patterns

## External Resources

- [Luxon Documentation](https://moment.github.io/luxon/#/) - For relative time formatting
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) - For copy-to-clipboard functionality
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - For accessible interactions

## Constraints & Risks

**Constraints:**

- Must maintain existing functionality - no breaking changes
- Animations must be optional/respectful of `prefers-reduced-motion`
- Clipboard API requires HTTPS (works on localhost)
- All time calculations must respect the restaurant's timezone

**Risks:**

- Low risk: Adding features to existing dialog
- Performance: Multiple timers/intervals could affect performance if not managed properly
- Browser compatibility: Clipboard API not available in all browsers (need fallback)

## Open Questions

- Q: Should countdown timers update every second or every minute?
  A: Every minute to balance UX and performance (decided)

- Q: What's the threshold for "imminent" bookings?
  A: Already defined as 15 minutes in existing code (reuse)

- Q: Should we track visit count in the database?
  A: Use existing loyalty points and tier as proxy for now; visit count can be added later if needed

## Recommended Direction

Implement improvements in phases:

**Phase 1: Time Intelligence** (Highest value, low risk)

- Add relative time displays ("2 hours from now")
- Add countdown for imminent bookings
- Add time context badges

**Phase 2: Contact Quick Actions** (High value, low risk)

- Add copy buttons for email/phone
- Add direct call/email links
- Add visual feedback on copy

**Phase 3: Enhanced Quick Actions** (Medium value, low effort)

- Add icons to action buttons
- Improve button styling and hierarchy
- Add keyboard shortcut hints

**Phase 4: Visual Polish** (Medium value, micro-interactions)

- Add status badge animations for urgent states
- Add success feedback for actions
- Add hover states and transitions

**Phase 5: Guest Intelligence** (Nice to have)

- Add VIP/tier badges
- Add visit frequency indicators
- Add booking history context

Implementation will use existing components and utilities, minimizing new dependencies and maintaining consistency with current design patterns.
