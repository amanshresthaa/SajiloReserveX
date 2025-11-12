# Implementation Checklist

## Setup

- [ ] Create GuestLandingPage component file
- [ ] Create page.tsx at (guest-public) route

## Core Implementation

### Component Structure

- [ ] Implement HeroSection component
- [ ] Implement FeaturesSection component
- [ ] Implement HowItWorksSection component
- [ ] Implement TestimonialsSection component
- [ ] Implement FAQSection component
- [ ] Implement FinalCTASection component
- [ ] Compose GuestLandingPage from all sections

### Page Integration

- [ ] Create src/app/(guest-public)/page.tsx
- [ ] Add proper metadata (title, description, OG tags)
- [ ] Import and render GuestLandingPage

## UI/UX Polish

### Responsive Layout

- [ ] Test mobile layout (375px, 414px)
- [ ] Test tablet layout (768px, 1024px)
- [ ] Test desktop layout (1280px, 1920px)
- [ ] Ensure no horizontal scroll on any breakpoint

### Visual Design

- [ ] Apply consistent spacing between sections
- [ ] Ensure typography hierarchy is clear
- [ ] Verify color contrast meets WCAG AA
- [ ] Add hover states to interactive elements
- [ ] Ensure focus states are visible

### Loading/Empty/Error States

- [ ] N/A - Static content (no dynamic states)

## Accessibility (A11y)

- [ ] Semantic HTML structure (proper headings, sections, lists)
- [ ] All interactive elements keyboard accessible
- [ ] Focus management (no keyboard traps)
- [ ] Visible focus indicators (`:focus-visible`)
- [ ] ARIA labels where semantic HTML insufficient
- [ ] Touch targets ≥ 44px on mobile
- [ ] Test accordion keyboard navigation
- [ ] Verify heading hierarchy (h1 → h2 → h3, no skips)
- [ ] Test with keyboard only (no mouse)

## Content

- [ ] Hero: Headline, description, stats content
- [ ] Features: 4 feature cards with icons, titles, descriptions, bullets
- [ ] How It Works: 4 numbered steps
- [ ] Testimonials: 3 testimonial cards with quotes and attribution
- [ ] FAQ: 6 Q&A pairs in accordion
- [ ] Final CTA: Headline, description, CTAs
- [ ] Verify all content is diner-focused (not restaurant-operator focused)

## Technical

- [ ] Use React Server Components where possible
- [ ] Client components only for MarketingSessionActions
- [ ] Import Lucide icons efficiently
- [ ] Ensure proper TypeScript types
- [ ] No console errors or warnings
- [ ] Verify proper Next.js metadata export

## Testing

### Manual QA

- [ ] Page loads at `/` route
- [ ] All CTAs navigate to correct destinations
- [ ] MarketingSessionActions shows correct CTAs (signed in vs. signed out)
- [ ] No broken links
- [ ] No visual bugs or layout issues

### Performance

- [ ] Run Lighthouse audit (target: ≥85)
- [ ] Verify FCP < 1.5s
- [ ] Verify LCP < 2.5s
- [ ] Verify CLS < 0.1
- [ ] Check bundle size impact (use Next.js bundle analyzer if needed)

### Accessibility

- [ ] Run Lighthouse accessibility audit (target: ≥90)
- [ ] Use axe DevTools for automated checks
- [ ] Manual keyboard navigation test
- [ ] Screen reader spot check (VoiceOver or NVDA)

### Cross-Browser

- [ ] Test in Chrome
- [ ] Test in Safari
- [ ] Test in Firefox
- [ ] Mobile: Test in iOS Safari, Chrome Android

## Notes

### Assumptions

- Using placeholder content for MVP (stats, testimonials)
- No external images; relying on gradients and icons
- English-only content
- No analytics tracking code (can be added later)

### Deviations from Plan

- None so far

## Batched Questions (if any)

None at this time.
