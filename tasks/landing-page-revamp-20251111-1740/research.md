# Research: Guest Landing Page Revamp

## Requirements

### Functional

- Create a compelling guest-facing landing page at `/` (root path)
- Showcase SajiloReserveX as a restaurant reservation platform for diners
- Include clear call-to-action for browsing restaurants and signing in
- Highlight key platform features and benefits for diners
- Display social proof (testimonials or stats)
- Include FAQ section for common guest questions
- Responsive design working on mobile, tablet, and desktop
- Accessible navigation and content

### Non-functional

- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support, ARIA labels
- **Performance**: FCP < 1.5s, LCP < 2.5s, minimal CLS
- **SEO**: Proper metadata, semantic HTML, heading hierarchy
- **Privacy**: No tracking without consent, GDPR-friendly
- **i18n**: Structure should support future internationalization
- **Mobile-first**: Design for 375px+ screens, enhance for larger viewports

## Existing Patterns & Reuse

### Available Components (Shadcn UI)

The project already has extensive Shadcn UI components installed:

- `Badge`, `Button`, `Card`, `Accordion` - for feature showcases
- `Sheet`, `Dialog` - for modals and mobile menus
- `Avatar`, `Skeleton` - for loading states
- `Separator`, `Tabs` - for content organization
- All components follow "new-york" style with CSS variables for theming

### Existing Layout Components

- **CustomerNavbar** (`components/customer/navigation/CustomerNavbar.tsx`):
  - Already implements responsive navigation with mobile sheet
  - Session-aware (shows user avatar when authenticated)
  - Brand mark, primary links, dropdown menu
  - Accessible with skip-to-content link
  - Can be reused as-is

- **Footer** (`components/Footer.tsx`):
  - Contains links, legal pages, branding
  - Can be reused as-is

- **MarketingSessionActions** (`components/marketing/MarketingSessionActions.tsx`):
  - Session-aware CTA buttons
  - Supports multiple modes: "booking", "account", "restaurant"
  - Configurable button variants and sizes
  - Perfect for hero and CTA sections

### Inspiration from RestaurantLandingPage

The restaurant partners landing page (`components/restaurant-partners/RestaurantLandingPage.tsx`) provides excellent patterns:

- Clean section-based architecture (Hero, Features, Workflow, Testimonials, Pricing, FAQ, Final CTA)
- Consistent spacing and typography
- Dark hero section with gradient background
- Stats cards in hero
- Feature grid with icons
- Numbered workflow steps
- Two-column testimonial layout
- Pricing cards with CTAs
- Accordion-based FAQ
- Final CTA with gradient background

We can adapt this structure for the guest-facing landing page with diner-focused content.

### Layout Structure

- Main layout: `src/app/(guest-public)/layout.tsx` - includes CustomerNavbar and Footer
- Missing: `src/app/(guest-public)/page.tsx` (deleted in recent changes)

## External Resources

### Design Best Practices

- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) - for accessibility patterns
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - accessibility requirements
- [Core Web Vitals](https://web.dev/vitals/) - performance metrics

### Competitive Analysis Patterns (General Best Practices)

- Hero with clear value proposition and primary CTA
- Feature highlights with icons/illustrations
- Social proof (testimonials, partner logos, stats)
- How it works section (3-4 steps)
- FAQ to address objections
- Final CTA before footer

## Constraints & Risks

### Technical Constraints

- Must work within Next.js 14+ app router architecture
- Must integrate with existing Supabase authentication
- Must follow existing design system (Shadcn "new-york" style)
- Must not introduce new dependencies (use existing Shadcn components)
- Must respect existing CustomerNavbar and Footer
- Mobile-first required (per agents.md)

### Performance Constraints

- Keep bundle size minimal (leverage existing components)
- Avoid heavy images (use optimized Next.js Image component)
- Reserve space for images to prevent CLS
- Target < 500ms for interactive elements

### Accessibility Constraints

- Full keyboard navigation required
- Focus management (visible :focus-visible)
- Semantic HTML preferred over ARIA
- Touch targets ≥ 44px on mobile
- Respect prefers-reduced-motion

### Business Constraints

- Content must differentiate from restaurant partner page
- Target audience is diners/guests, not restaurant operators
- Must drive users to browse restaurants and create accounts
- Messaging should emphasize ease, selection, and experience

### Risk: Content Availability

- Don't have final copy/messaging yet - will use placeholder content
- Don't have actual restaurant stats - will use reasonable estimates
- Don't have real testimonials - will create representative examples

### Risk: Image Assets

- No specific hero images or feature illustrations available
- Will rely on gradients, Lucide icons, and CSS styling
- Can add images later without structural changes

## Open Questions

### Q1: What is the primary user journey we want to optimize for?

**Owner**: Product/Design
**Status**: Assumed - Drive users to browse restaurants → make reservations → create accounts
**Rationale**: Based on MarketingSessionActions "booking" mode and existing flows

### Q2: Should we include restaurant partner signup CTA on guest landing?

**Owner**: Product
**Status**: Assumed - No, keep focused on diners. Restaurant partners have dedicated `/partners` page
**Rationale**: Clear separation of concerns already exists in codebase

### Q3: What are the actual platform metrics/stats we can showcase?

**Owner**: Data/Analytics team
**Status**: Deferred - Will use placeholder stats that can be updated later
**Rationale**: Don't block on this; structure supports easy updates

### Q4: Do we need A/B testing infrastructure for CTAs?

**Owner**: Growth team
**Status**: Out of scope for MVP
**Rationale**: Focus on solid foundation first; can add experimentation later

## Recommended Direction

### Approach: Adapt RestaurantLandingPage Pattern for Guest Audience

**Rationale**:

1. The RestaurantLandingPage is well-structured, accessible, and performant
2. Re-using the same component architecture ensures consistency
3. All required Shadcn components are already installed
4. Pattern is proven and follows agents.md guidelines

### Proposed Structure

Create `src/app/(guest-public)/page.tsx` that imports a new `components/marketing/GuestLandingPage.tsx` component with these sections:

1. **Hero Section**
   - Compelling headline for diners
   - Value proposition
   - Primary CTA: Browse restaurants
   - Secondary CTA: Sign in
   - Stats cards showcasing platform value
   - Dark gradient background (consistent with restaurant page)

2. **Feature Highlights**
   - 3-4 key features for diners:
     - Easy reservation management
     - Instant confirmations
     - Discover great restaurants
     - Manage dietary preferences/allergies
   - Grid layout with icons
   - Use Lucide icons

3. **How It Works**
   - 3-4 step process:
     1. Browse restaurants
     2. Choose date & time
     3. Confirm reservation
     4. Enjoy your meal
   - Numbered cards in grid

4. **Social Proof**
   - Guest testimonials (2-3)
   - Focus on experience, ease of use
   - Two-column card layout

5. **FAQ Section**
   - Common diner questions:
     - How do cancellations work?
     - Is it free for diners?
     - What if I need to modify my reservation?
     - How do I manage dietary restrictions?
   - Accordion component

6. **Final CTA**
   - Encouraging message
   - CTAs: Browse restaurants + Sign in
   - Gradient background

### Technology Stack

- Next.js App Router
- React Server Components where possible
- Shadcn UI components
- Lucide icons
- Tailwind CSS
- TypeScript

### Content Strategy

- Diner-focused language (vs. operator language on restaurant page)
- Emphasize convenience, choice, and experience
- Keep messaging simple and benefit-driven
- Use active voice

### Accessibility Strategy

- Semantic HTML structure
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels only where semantic HTML insufficient
- Keyboard navigation tested
- Focus visible indicators
- Touch targets ≥ 44px mobile
- Color contrast 4.5:1 minimum

### Performance Strategy

- Minimize client components (use RSC where possible)
- No external images initially (CSS gradients + icons)
- Lazy load below-fold content if needed
- Leverage Next.js optimizations

## Success Criteria

- [ ] Page renders at `/` route for guest-public
- [ ] All sections present and responsive (mobile, tablet, desktop)
- [ ] CTAs functional and route to correct pages
- [ ] Keyboard navigation works throughout
- [ ] No console errors
- [ ] Lighthouse accessibility score ≥ 90
- [ ] Performance metrics: FCP < 1.5s, LCP < 2.5s
- [ ] Visual design consistent with restaurant landing page
- [ ] Content is diner-focused and compelling

## Next Steps

Proceed to Phase 2: Design & Planning (plan.md)
