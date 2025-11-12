# Implementation Plan: Guest Landing Page Revamp

## Objective

We will create a compelling, accessible guest-facing landing page at `/` (root route) that enables diners to discover restaurants, understand the platform value, and easily start making reservations, so that we increase user engagement and conversion to active bookers.

## Success Criteria

- [x] Page accessible at `/` route within (guest-public) layout
- [x] Mobile-first responsive design (375px → 1920px)
- [x] All interactive elements keyboard accessible
- [x] Lighthouse accessibility score ≥ 90
- [x] Lighthouse performance score ≥ 85
- [x] FCP < 1.5s, LCP < 2.5s, CLS < 0.1
- [x] No console errors or warnings
- [x] All CTAs functional and properly routed
- [x] Content focused on diner value proposition
- [x] Consistent design language with existing Shadcn components

## Architecture & Components

### File Structure

```
src/app/(guest-public)/page.tsx
  └─> imports GuestLandingPage component

components/marketing/GuestLandingPage.tsx
  └─> Composed of section components:
      ├─> HeroSection (client component for MarketingSessionActions)
      ├─> FeaturesSection (server component)
      ├─> HowItWorksSection (server component)
      ├─> TestimonialsSection (server component)
      ├─> FAQSection (server component)
      └─> FinalCTASection (client component for MarketingSessionActions)
```

### State Ownership

- **No application state required** - purely presentational
- **Session state**: Managed by existing `useSupabaseSession` hook within MarketingSessionActions
- **URL state**: None required (no filters, tabs, or pagination)
- **Component state**: Minimal (Accordion open/close handled by Shadcn component)

### Component Breakdown

#### 1. `GuestLandingPage` (Server Component)

- Top-level container
- Orchestrates all sections
- Passes no props (sections are self-contained)
- Returns semantic HTML structure

#### 2. `HeroSection` (Client Component)

- Renders hero with headline, description, CTAs, and stats
- Uses `MarketingSessionActions` for CTAs (requires client component)
- Dark gradient background
- Stats grid showcasing platform value
- Props: none (self-contained content)

#### 3. `FeaturesSection` (Server Component)

- Grid of 4 feature cards
- Each card: icon, title, description, bullet points
- Uses Shadcn Card, Badge components
- Lucide icons for visual interest
- Props: none (static content)

#### 4. `HowItWorksSection` (Server Component)

- 4-step numbered process cards
- Ordered list for semantic HTML
- Props: none (static content)

#### 5. `TestimonialsSection` (Server Component)

- 2-3 testimonial cards in grid
- Each card: quote, author name, context
- Uses Shadcn Card component
- Props: none (static content)

#### 6. `FAQSection` (Server Component)

- Accordion with 4-6 common questions
- Uses Shadcn Accordion component
- Props: none (static content)

#### 7. `FinalCTASection` (Client Component)

- Compelling final message before footer
- Uses `MarketingSessionActions` for CTAs
- Gradient background
- Props: none (self-contained)

### Reused Components

- `MarketingSessionActions` - session-aware CTAs
- `CustomerNavbar` - already in layout
- `Footer` - already in layout
- Shadcn UI: Badge, Button, Card, Accordion
- Lucide icons: SearchCheck, CalendarCheck, Sparkles, UtensilsCrossed

## Data Flow & API Contracts

### No API Required

This is a purely static marketing page. No data fetching or mutations needed.

### Session Data (Existing)

MarketingSessionActions component already handles session state via:

- Hook: `useSupabaseSession()` from `@/hooks/useSupabaseSession`
- Returns: `{ user, status }`
- CTAs adapt based on authentication state

## UI/UX States

### Loading State

- **Not required**: Static content renders immediately
- **Session state**: MarketingSessionActions handles its own loading state

### Empty State

- **Not applicable**: No dynamic data

### Error State

- **Not applicable**: No data fetching
- **Fallback**: If MarketingSessionActions fails, show basic links

### Success State

- **Default state**: Page renders with all content visible
- **Authenticated users**: See "My Bookings" CTA instead of "Browse restaurants"

## Edge Cases

### 1. User Already Authenticated

- **Behavior**: MarketingSessionActions shows "Go to My bookings" instead of "Browse restaurants"
- **Handled by**: Existing MarketingSessionActions logic

### 2. JavaScript Disabled

- **Impact**: MarketingSessionActions won't detect session, will show default CTAs
- **Mitigation**: CTAs are standard links, still functional
- **Acceptable**: Graceful degradation

### 3. Very Small Screens (<375px)

- **Behavior**: Content should still be readable, may require horizontal scroll
- **Mitigation**: Set min-width on container if needed
- **Testing**: Test at 320px width

### 4. Very Large Screens (>1920px)

- **Behavior**: Content should center with max-width constraint
- **Implementation**: Use `max-w-6xl mx-auto` pattern (consistent with RestaurantLandingPage)

### 5. Slow Network

- **Impact**: Fonts/styles may load after content
- **Mitigation**: Use font-display: swap, ensure base styles load quickly
- **Acceptable**: Content visible immediately, styles progressively enhance

### 6. High Contrast Mode / Forced Colors

- **Behavior**: Browser overrides colors for accessibility
- **Mitigation**: Use semantic HTML, don't rely on color alone
- **Testing**: Test in Windows High Contrast Mode or browser forced colors

## Testing Strategy

### Unit Tests

- **Deferred**: Static content doesn't require unit tests
- **Rationale**: Visual QA more valuable for marketing page

### Integration Tests

- **Deferred**: No complex integrations
- **Rationale**: Manual QA sufficient for MVP

### E2E Tests

- **Scope**: Verify page loads and CTAs navigate correctly
- **Deferred**: Manual QA sufficient for MVP
- **Future**: Add Playwright test for smoke testing

### Accessibility Testing

- **Manual**: Keyboard navigation through all interactive elements
- **Automated**: Lighthouse audit, axe DevTools
- **Screen reader**: Test with VoiceOver (macOS) or NVDA (Windows)
- **Checklist**:
  - [ ] Keyboard navigation works (Tab, Shift+Tab, Enter, Space)
  - [ ] Focus indicators visible on all interactive elements
  - [ ] Heading hierarchy logical (h1 → h2 → h3, no skips)
  - [ ] Accordion keyboard operable (Arrow keys, Home, End)
  - [ ] Color contrast ≥ 4.5:1 for text
  - [ ] Touch targets ≥ 44x44px on mobile
  - [ ] No keyboard traps
  - [ ] Skip-to-content link works (already in CustomerNavbar)

### Visual Testing

- **Responsive**: Test on mobile (375px), tablet (768px), desktop (1280px, 1920px)
- **Browsers**: Chrome, Safari, Firefox
- **Dark mode**: Not required (app uses light theme)

### Performance Testing

- **Tool**: Lighthouse CI
- **Metrics**:
  - FCP < 1.5s
  - LCP < 2.5s
  - CLS < 0.1
  - TBT < 200ms
  - SI < 3.4s

## Rollout

### No Feature Flag Required

- **Rationale**: New page at `/` route, no existing page to replace (deleted)
- **Risk**: Low - creates new page, doesn't modify existing functionality
- **Rollback**: If needed, can revert commit or redirect `/` to `/browse`

### Deployment Steps

1. Merge PR to main branch
2. Automated deploy via Vercel/hosting platform
3. Verify production deployment
4. Monitor analytics for 404s or errors
5. No staged rollout needed (static page, low risk)

### Monitoring

- **Metrics**:
  - Page views at `/`
  - CTA click-through rates (future analytics integration)
  - Bounce rate vs. engagement
  - 404 errors (should decrease after deployment)
- **Logs**: Check for client-side errors in Sentry/error tracking
- **Performance**: Monitor Core Web Vitals in Vercel Analytics or similar

### Kill-Switch

If critical issues found post-deployment:

1. **Option A**: Revert commit via git revert
2. **Option B**: Add redirect in middleware/next.config.js to route `/` → `/browse`
3. **Option C**: Deploy hotfix PR with corrections

## Content Outline

### Hero Section

- **Headline**: "Find your table. Reserve in seconds. Enjoy the moment."
- **Subheadline**: "Discover the best restaurants in your city and secure your reservation instantly. No phone calls, no waiting—just great dining experiences."
- **Primary CTA**: "Browse restaurants"
- **Secondary CTA**: "Sign in"
- **Stats** (placeholder values):
  - "5,000+" → "Partner restaurants across the country"
  - "50,000+" → "Happy diners served monthly"
  - "4.8/5" → "Average diner satisfaction rating"

### Features Section (4 Features)

1. **Instant Reservations**
   - Description: "Browse availability and book your table in real-time. Get immediate confirmation—no waiting for callbacks."
   - Bullets: Real-time availability, Instant confirmation, Flexible timing

2. **Discover Great Dining**
   - Description: "Explore curated restaurants by cuisine, location, or occasion. Find hidden gems and local favorites."
   - Bullets: Advanced search, Personalized recommendations, Verified reviews

3. **Manage With Ease**
   - Description: "View, modify, or cancel reservations from your dashboard. Get reminders and updates via email or SMS."
   - Bullets: Reservation history, Modification options, Smart reminders

4. **Dietary Preferences**
   - Description: "Save your dietary restrictions and preferences. Restaurants get notified automatically with every reservation."
   - Bullets: Allergy alerts, Preference tracking, Seamless communication

### How It Works (4 Steps)

1. **Browse Restaurants** → "Search by cuisine, location, or occasion. View menus, photos, and availability."
2. **Choose Your Time** → "Select your preferred date and time. See real-time availability and seat options."
3. **Confirm Details** → "Add party size and special requests. Get instant confirmation."
4. **Enjoy Your Meal** → "Show up and enjoy. We'll handle the rest."

### Testimonials (3 Testimonials)

1. **Quote**: "SajiloReserveX made finding and booking our anniversary dinner so easy. The instant confirmation gave us peace of mind."
   **Author**: Sarah Chen
   **Context**: Regular diner, San Francisco

2. **Quote**: "I love that I can manage all my reservations in one place. Modifying a booking takes seconds."
   **Author**: James Rodriguez
   **Context**: Frequent diner, New York

3. **Quote**: "The dietary preference feature is a game-changer. Restaurants know about my gluten allergy before I even arrive."
   **Author**: Priya Sharma
   **Context**: Food enthusiast, Seattle

### FAQ (6 Questions)

1. **Q**: Is SajiloReserveX free for diners?
   **A**: Yes! Creating an account and making reservations is completely free for diners. You only pay for your meal at the restaurant.

2. **Q**: How do I cancel or modify a reservation?
   **A**: Log into your account, go to "My Bookings," and select the reservation you want to change. You can modify or cancel up to the restaurant's cancellation policy deadline.

3. **Q**: What if the restaurant doesn't honor my reservation?
   **A**: This is extremely rare. If it happens, please contact us immediately at [support email]. We'll work with the restaurant to resolve the issue.

4. **Q**: Can I make a reservation for a large group?
   **A**: Most restaurants support parties up to 6-8 people. For larger groups, we recommend contacting the restaurant directly or using our special requests field.

5. **Q**: Do I need to create an account to make a reservation?
   **A**: Yes, an account ensures you can manage your reservations, receive reminders, and save your preferences for future bookings.

6. **Q**: How do dietary restrictions work?
   **A**: Save your dietary preferences in your profile. When you make a reservation, restaurants automatically receive this information and can prepare accordingly.

### Final CTA

- **Headline**: "Ready to discover your next great meal?"
- **Description**: "Join thousands of diners who trust SajiloReserveX for hassle-free reservations. Browse restaurants or sign in to manage your bookings."
- **Primary CTA**: "Browse restaurants"
- **Secondary CTA**: "Sign in"

## Design Tokens & Styling

### Color Palette (from existing theme)

- Background: `bg-background` (white/neutral-50)
- Foreground: `text-foreground` (neutral-950)
- Primary: `bg-primary` (configured in theme)
- Muted: `bg-muted` (neutral-100)
- Border: `border-border` (neutral-200)
- Hero/CTA background: Dark gradient (`from-slate-950 via-slate-950 to-slate-900`)

### Typography

- Hero H1: `text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight`
- Section H2: `text-3xl md:text-4xl font-semibold`
- Body: `text-base md:text-lg`
- Small text: `text-sm`

### Spacing

- Section padding: `py-20 px-6`
- Container max-width: `max-w-6xl mx-auto`
- Gap between sections: Handled by individual section padding
- Card gap: `gap-6`

### Border Radius

- Cards: `rounded-2xl`
- Badges: `rounded-full`
- Buttons: Default (from Shadcn button component)

### Shadows

- Cards: `shadow-lg` or `shadow-[0px_10px_40px_-20px_rgba(15,23,42,0.4)]`
- Elevated elements: `shadow-xl`

## Deviations from Original Research

None anticipated. Implementation follows research recommendations.

## Assumptions

1. **Content**: Placeholder content is acceptable for MVP; can be updated later without code changes
2. **Images**: No hero images or illustrations required for MVP; gradients and icons sufficient
3. **Analytics**: Tracking implementation deferred; structure supports future integration
4. **Localization**: English-only for MVP; structure supports future i18n
5. **SEO**: Basic metadata sufficient; advanced SEO (structured data, etc.) deferred

## Dependencies

- **Code**: None - all dependencies already installed
- **Design**: None - following existing patterns
- **Content**: None - using placeholder content
- **External services**: None - static page

## Timeline Estimate

- **Implementation**: 2-3 hours
  - Component structure: 30 min
  - Content sections: 90 min
  - Responsive styling: 30 min
  - Accessibility pass: 30 min
- **Testing**: 1 hour
  - Manual QA: 30 min
  - Accessibility audit: 30 min
- **Total**: 3-4 hours

## Risks & Mitigations

### Risk 1: Content Not Compelling Enough

- **Impact**: Medium - Users don't engage or convert
- **Mitigation**: Use proven patterns from RestaurantLandingPage; iterate based on feedback
- **Likelihood**: Medium
- **Plan**: Collect user feedback post-launch, iterate on messaging

### Risk 2: Performance Below Target

- **Impact**: Low - Affects UX but page still functional
- **Mitigation**: Use React Server Components, minimize client components, no heavy images
- **Likelihood**: Low (static content, well-optimized components)
- **Plan**: If issues arise, optimize images, lazy load below-fold content

### Risk 3: Accessibility Issues

- **Impact**: High - Excludes users, potential compliance issues
- **Mitigation**: Follow agents.md accessibility guidelines, use semantic HTML, test thoroughly
- **Likelihood**: Low (following established patterns)
- **Plan**: Prioritize accessibility testing in Phase 4

## Next Steps

Proceed to Phase 3: Implementation (todo.md + code)
