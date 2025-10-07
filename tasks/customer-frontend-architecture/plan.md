# Implementation Plan: Customer-Facing Frontend Architecture Specification

**Task ID**: `customer-frontend-architecture`  
**Date**: 2024-10-07  
**Status**: In Progress

## Objective

Produce a comprehensive, production-ready frontend architecture specification for SajiloReserveX that serves as the single source of truth for all customer-facing frontend development. The deliverable will follow the prescribed 12-step structure, providing both human-readable rationale and machine-readable artifacts (JSON/TypeScript/Markdown).

## Scope

**In Scope**:

- Complete information architecture with sitemap and navigation model
- All page content (headings, microcopy, CTAs, SEO metadata)
- Routing configuration for Next.js App Router
- State management patterns and query strategies
- UI component specifications with accessibility
- Design system tokens (CSS + JSON)
- Edge cases, error states, empty states
- Performance budgets and SEO strategy
- Analytics tracking plan
- Acceptance criteria and test scenarios

**Out of Scope**:

- Backend API implementation details (server functions)
- Database schema design
- Deployment/infrastructure configuration
- Third-party integrations beyond analytics tooling

## Deliverables (12-Step Structure)

### 1. Requirements Analysis (≤12 bullets)

- Audience mapping → key customer journeys
- Value proposition & differentiators
- Assumptions & risks
- Non-functional requirements (performance, a11y, SEO, i18n)

### 2. Information Architecture (IA)

- JSON sitemap with hierarchy (max depth 3)
- Node metadata: purpose, key messages, URL pattern, TTL
- Navigation model: primary, secondary, footer, utility

### 3. Content Finalization

- Per-page Markdown files with front-matter
- H1-H3 headings, microcopy, CTAs, empty state text
- SEO: title (≤60 chars), meta description (≤155 chars), schema.org
- Tone guidelines & localization notes

### 4. Routing & Navigation

- Next.js App Router file structure
- TypeScript route configuration
- Active link logic, 404/500 handling
- Auth guards and middleware rules

### 5. State Management & Data Flow

- React Query patterns (keys, invalidation, optimistic updates)
- Auth flows (public/protected routes, token refresh)
- Cache strategies, retry/backoff policies
- Offline/loading/skeleton strategies

### 6. UI Components & Logic

- Component inventory with props contracts (TypeScript interfaces)
- Responsibilities, interaction logic, keyboard support
- Accessibility notes (ARIA, focus management)
- Error/loading/empty visual states

### 7. Design System (Tokens & Primitives)

- CSS variables export (colors, spacing, typography, shadows, z-index, motion)
- JSON token file for tooling integration
- Usage guidelines and examples

### 8. Edge Cases, Errors, Empty States

- Failure mode matrix per page/component
- User-facing copy, recovery actions, telemetry events
- Network errors, permission errors, validation errors

### 9. Performance, Accessibility, SEO

- Core Web Vitals budgets (LCP, CLS, INP, TTI)
- Code-splitting plan, image policy, font loading
- A11y checklist (WCAG 2.2 AA compliance)
- SEO: sitemaps, robots.txt, canonical URLs, structured data

### 10. Analytics & Events

- Tracking plan: pageviews + interaction events + errors
- Event spec with names, properties, PII policy
- Integration with Plausible (existing) + extensibility

### 11. Acceptance Criteria & Test Plan

- Gherkin scenarios for critical flows
- Unit/Visual Regression/E2E test matrix
- Tools: Vitest, Playwright, axe-core

### 12. Final Output Package

- Consolidated deliverables in strict order
- Copy-pastable code snippets (TypeScript, JSON, Markdown)
- Diagrammer-friendly formats (Mermaid for IA)

## Approach

### Phase 1: Variables & Assumptions (5 minutes)

**Tasks**:

- Define business/brand, audience, goals, metrics, constraints
- Document all assumptions clearly (no questions allowed per task spec)

**Output**: Variables section filled with SajiloReserveX context

### Phase 2: Requirements & IA (10 minutes)

**Tasks**:

- Synthesize research into concise requirements analysis
- Build full sitemap from existing routes + planned additions
- Define navigation model (header, footer, mobile, utility)

**Output**:

- Deliverable 1: `requirements-analysis.md` (≤12 bullets)
- Deliverable 2: `information-architecture.json` + Mermaid diagram

### Phase 3: Content Strategy (15 minutes)

**Tasks**:

- Write content for each page (H1-H3, microcopy, CTAs)
- Generate SEO metadata (title, description, schema type)
- Define tone guidelines, trust signals, localization notes

**Output**:

- Deliverable 3: Individual Markdown files per page with front-matter
  - `content/home.md`
  - `content/reserve.md`
  - `content/signin.md`
  - `content/dashboard.md`
  - `content/booking-flow.md`
  - `content/profile.md`
  - `content/blog.md`
  - `content/legal.md` (terms, privacy)

### Phase 4: Routing & State (10 minutes)

**Tasks**:

- Document Next.js App Router file structure
- Create TypeScript route configuration
- Define React Query patterns, cache keys, mutations
- Auth flow documentation (middleware, guards, redirects)

**Output**:

- Deliverable 4: `routing-config.ts` + `file-structure.md`
- Deliverable 5: `state-management.ts` + cache rules doc

### Phase 5: Components & Design System (15 minutes)

**Tasks**:

- Inventory all components with TypeScript interfaces
- Document props, accessibility, keyboard support, states
- Export design tokens (CSS + JSON)
- Document token usage patterns

**Output**:

- Deliverable 6: `components-api.ts` + accessibility notes
- Deliverable 7: `design-tokens.css` + `design-tokens.json`

### Phase 6: Edge Cases & Quality (10 minutes)

**Tasks**:

- Matrix of failure modes per page/component
- Define error copy, recovery actions, telemetry events
- Document empty states, loading states, offline behavior

**Output**:

- Deliverable 8: `edge-cases.md` (table format)

### Phase 7: Performance & SEO (10 minutes)

**Tasks**:

- Define Core Web Vitals budgets
- Code-splitting strategy (route-based + component-based)
- Image optimization policy (responsive, AVIF/WebP)
- Font loading strategy (preload, font-display)
- A11y checklist (contrast, focus, ARIA, keyboard)
- SEO: sitemap generation, robots.txt, canonical, schema.org

**Output**:

- Deliverable 9: `performance-seo.md`

### Phase 8: Analytics & Testing (10 minutes)

**Tasks**:

- Expand analytics event taxonomy
- Define event properties, PII exclusions
- Write Gherkin scenarios for critical flows
- Define unit/VR/E2E test coverage matrix

**Output**:

- Deliverable 10: `analytics-spec.json`
- Deliverable 11: `acceptance-criteria.feature` + test matrix

### Phase 9: Final Assembly (10 minutes)

**Tasks**:

- Review all deliverables for consistency
- Assemble into final package in strict order
- Add cross-references and navigation
- Validate JSON/TypeScript syntax

**Output**:

- Deliverable 12: `frontend-architecture-spec.md` (master document)

## Assumptions

Since the task specifies "ask no questions; make sensible assumptions", here are documented assumptions:

### Business Context

- **Business Name**: SajiloReserveX
- **Elevator Pitch**: "Simple, transparent restaurant reservations. Book tables at partner restaurants in moments, manage bookings effortlessly."
- **Domain**: Restaurant/hospitality SaaS
- **Business Model**: B2B2C (restaurants pay, consumers use free + optional paid features)

### Audience & Goals

- **Primary Audience**:
  - Consumer diners (25-55, mobile-first, time-constrained)
  - Restaurant staff (managing bookings via separate interface - out of scope)
- **Jobs to Be Done** (JTBD):
  - "I need to book a table quickly without phone calls"
  - "I want to manage my reservations in one place"
  - "I need to see availability in real-time"
- **Primary Goals**: Conversion (booking completion), activation (repeat bookings)
- **Secondary Goals**: SEO (organic discovery), education (how it works), onboarding

### Success Metrics

- **Conversion Rate**: >25% (restaurant selection → booking confirmation)
- **Time to Book**: <2 minutes (median)
- **Repeat Booking Rate**: >40% within 30 days
- **Core Web Vitals**: LCP <2.5s, CLS <0.1, INP <200ms
- **Accessibility**: WCAG 2.2 AA (100% compliance)

### Product Scope

**Pages/Modules**:

- Home (restaurant listing)
- Booking flow (4 steps)
- Dashboard (view/edit/cancel bookings)
- Profile management
- Authentication (sign in/up)
- Reserve landing (how it works, FAQs)
- Blog (content marketing)
- Legal (terms, privacy)

### Constraints

- **Timeline**: N/A (architectural spec, not implementation)
- **Budget**: Existing infrastructure (Next.js, Supabase, Plausible)
- **Team**: Full-stack developers familiar with React/TypeScript
- **Tech Stack**: Next.js 15 App Router, React 19, Supabase, Shadcn/ui
- **Browser Support**: Modern evergreen (last 2 versions Chrome/Firefox/Safari/Edge)
- **Device Support**: Mobile-first (iOS 15+, Android 10+), desktop (1280px+)

### Framework & Tools

- **Framework**: Next.js 15 App Router
- **Design System**: Shadcn/ui (new-york style) + custom tokens
- **Data/APIs**:
  - Supabase (REST via @supabase/supabase-js)
  - Custom Next.js route handlers (/app/api/\*)
  - Shapes: TypeScript types from `types/supabase.ts`
  - Auth: Supabase Auth (OAuth + email/password)
- **Content Source**: Static (Markdown) for marketing, Supabase for dynamic (bookings)
- **Locales**: en-GB (default), no RTL support initially
- **Analytics**: Plausible (privacy-first, no cookies)
- **Compliance**: WCAG 2.2 AA, GDPR-ready (Plausible), cookie consent (future)

### Design System Assumptions

- **Base Unit**: 4px spacing scale
- **Type Scale**: 1.250 (Major Third)
- **Color Model**: HSL for theme flexibility
- **Animation Duration**: 150ms (micro), 300ms (macro)
- **Touch Target**: 44px minimum (WCAG AAA)

### Content Assumptions

- **Tone**: Professional yet approachable, benefit-first, action-oriented
- **Voice**: Second person ("You can book…"), active voice, present tense
- **Terminology**: "Booking" (not "reservation"), "Restaurant" (not "venue")
- **Trust Signals**: Real-time availability, instant confirmation, easy cancellation

### Technical Assumptions

- **Session Management**: Supabase Auth with SSR (cookies)
- **State Management**: React Query (server state), React Context (UI state only)
- **Form Validation**: Zod schemas with React Hook Form
- **Error Tracking**: Console logs (production APM recommended but not implemented)
- **Caching**: React Query default (5min stale time) + Next.js route cache
- **Image CDN**: Next.js built-in optimization (no external CDN)

## Risk Mitigation

### Risk: Incomplete Information

**Mitigation**: Make informed assumptions based on research, clearly label them

### Risk: Over-Engineering

**Mitigation**: Focus on immediate needs (MVP), document extensibility points

### Risk: Accessibility Gaps

**Mitigation**: Follow WCAG 2.2 AA rigorously, leverage Radix primitives, add a11y tests

### Risk: Performance Degradation

**Mitigation**: Define budgets upfront, use lighthouse-ci (recommended), monitor Core Web Vitals

### Risk: Poor SEO

**Mitigation**: Structured data (schema.org), semantic HTML, meta tags, sitemap

## Success Criteria

The architecture specification will be considered complete when:

1. ✅ All 12 deliverables produced in prescribed format
2. ✅ Every page has finalized content with SEO metadata
3. ✅ All components have TypeScript interfaces and accessibility notes
4. ✅ Design tokens exported in CSS + JSON
5. ✅ Analytics tracking plan covers all critical events
6. ✅ Edge cases documented with recovery actions
7. ✅ Performance budgets and a11y targets defined
8. ✅ Acceptance criteria written for critical flows
9. ✅ All outputs are copy-pastable (valid syntax)
10. ✅ Assumptions clearly labeled throughout

## Implementation Sequence

1. ✅ Research complete (`research.md`)
2. ✅ Plan complete (`plan.md`)
3. → Fill variables section
4. → Generate deliverables 1-3 (Requirements, IA, Content)
5. → Generate deliverables 4-6 (Routing, State, Components)
6. → Generate deliverables 7-9 (Tokens, Edge Cases, Performance)
7. → Generate deliverables 10-12 (Analytics, Tests, Final Package)
8. → Cross-verify and deliver

---

**Next Step**: Begin generating deliverables following this plan.
