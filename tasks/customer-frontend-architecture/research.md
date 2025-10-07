# Research: Customer-Facing Frontend Architecture

**Task ID**: `customer-frontend-architecture`  
**Date**: 2024-10-07  
**Status**: Complete

## Executive Summary

SajiloReserveX is a modern restaurant reservation platform built on Next.js 15 App Router with Supabase backend, Shadcn/ui components, and TanStack React Query for state management. The application demonstrates strong accessibility foundations (WCAG compliance, keyboard navigation, touch targets), mobile-first responsive design, and a well-structured design system with HSL-based color tokens supporting light/dark modes.

## 1. Technology Stack

### Core Framework

- **Next.js**: v15.5.4 with App Router (file-system routing)
- **React**: v19.1.1 (with React DOM)
- **TypeScript**: v5.9.2 with strict mode support
- **Node**: >=20.11.0 required

### UI & Styling

- **Shadcn/ui**: "new-york" style variant with RSC support
- **Tailwind CSS**: v4.1.13 with custom design tokens
- **Radix UI**: Accessible primitive components (@radix-ui/react-\*)
- **Lucide React**: v0.544.0 for icons
- **CSS Variables**: HSL-based color system for theme flexibility

### State & Data

- **TanStack React Query**: v5.90.2 for server state
- **Supabase**: v2.58.0 (@supabase/supabase-js, @supabase/ssr)
- **React Hook Form**: v7.63.0 with Zod v4.1.11 validation
- **Query Keys**: Centralized in `lib/query/keys.ts`

### Backend & APIs

- **Supabase Auth**: OAuth + email/password flows
- **REST APIs**: Route handlers in `/app/api/*`
- **Inngest**: v3.44.1 for background jobs
- **Mailgun.js**: v12.1.0 for transactional emails
- **Legacy payments**: Stripe checkout/portal endpoints exist but are paused; future monetization TBD.

### Testing & Quality

- **Playwright**: v1.55.1 (E2E + component tests)
- **Vitest**: v3.2.4 (unit tests)
- **ESLint**: v9.36.0 with TypeScript, import, jsx-a11y, React hooks plugins
- **Husky**: v9.1.7 with lint-staged pre-commit hooks

### Analytics & Monitoring

- **Plausible**: via `next-plausible` v3.12.4
- **Custom tracking**: Event system in `lib/analytics.ts`

### Additional Tools

- **date-fns**: v4.1.0 for date manipulation
- **React Hot Toast**: v2.6.0 for notifications
- **next-sitemap**: v4.2.3 for SEO
- **axios**: v1.12.2 as HTTP client backup

## 2. Current Information Architecture

### Route Structure (Next.js App Router)

```
/app
├── layout.tsx                          # Root layout (SEO, providers, skip link)
├── page.tsx                            # Home: Restaurant listing
├── providers.tsx                       # React Query + context providers
├── globals.css                         # Design system tokens
│
├── (marketing)                         # Marketing pages group
│   ├── reserve/page.tsx                # Reservation explainer
│   ├── blog/                           # Blog system
│   │   ├── page.tsx                    # Blog index
│   │   ├── layout.tsx                  # Blog layout
│   │   ├── [articleId]/page.tsx        # Article detail
│   │   ├── author/[authorId]/page.tsx  # Author archive
│   │   └── category/[categoryId]/page.tsx # Category archive
│   ├── terms/
│   │   ├── venue/page.tsx              # Venue terms
│   │   └── togo/page.tsx               # ToGo terms
│   ├── privacy-policy/page.tsx         # Privacy policy
│   ├── tos/page.tsx                    # Terms of service
│   └── thank-you/page.tsx              # Post-action confirmation
│
├── (public)                            # Public reservation flows
│   ├── signin/                         # Authentication
│   │   ├── page.tsx                    # Sign in form
│   │   └── layout.tsx                  # Auth layout
│   ├── reserve/
│   │   ├── page.tsx                    # Reserve home (deprecated?)
│   │   ├── r/[slug]/page.tsx           # Booking flow per restaurant
│   │   └── [reservationId]/page.tsx    # Booking confirmation
│
└── (authed)                            # Protected routes
    ├── dashboard/                      # User bookings dashboard
    │   ├── page.tsx                    # Bookings table
    │   └── layout.tsx                  # Dashboard layout
    └── profile/                        # User profile
        ├── layout.tsx                  # Profile layout
        └── manage/page.tsx             # Profile management form
```

### API Routes (`/app/api/*`)

```
/api
├── auth/callback/route.ts              # OAuth callback handler
├── bookings/
│   ├── route.ts                        # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts                    # GET, PATCH, DELETE (single booking)
│       └── history/route.ts            # GET booking history/logs
├── profile/
│   ├── route.ts                        # GET, PATCH user profile
│   └── image/route.ts                  # POST/DELETE profile image
├── stripe/
│   ├── create-checkout/route.ts        # (Legacy) Stripe checkout session stub
│   └── create-portal/route.ts          # (Legacy) Stripe customer portal stub
├── webhook/stripe/route.ts             # (Legacy) Stripe webhook handler (disabled)
├── lead/route.ts                       # POST lead capture
├── events/route.ts                     # Analytics/events endpoint
├── inngest/route.ts                    # Inngest webhook
└── test/*                              # Test-only endpoints (Playwright)
```

## 3. Design System Analysis

### Color System (HSL-based, CSS Variables)

**Light Mode**

```css
--background: 0 0% 100% /* Pure white */ --foreground: 222 47% 11% /* Near-black */ --primary: 222
  47% 11% /* Dark navy */ --primary-foreground: 210 40% 98% /* Off-white */ --muted: 210 40% 96.1%
  /* Light gray */ --muted-foreground: 215 16% 47% /* Mid gray */ --destructive: 0 84.2% 60.2%
  /* Red */ --success: 142 76% 36% /* Green */ --warning: 38 92% 50% /* Amber */ --info: 199 89% 48%
  /* Cyan */;
```

**Dark Mode**

- Background inverted to `222 47% 11%`
- Foreground to `210 40% 98%`
- Enhanced shadow opacity (0.4 vs 0.1)
- Chart colors adjusted for contrast

### Typography Scale

```
screen-title:     34px / 40px / 700
section-header:   22px / 28px / 600
card-title:       18px / 22px / 600
body:             16px / 24px / 400
label:            14px / 20px / 400
button:           16px / 20px / 600
```

**Font Stack**: `'SajiloReserveX Cereal App', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`

**Font Features**: `cv02, cv03, cv04, cv11` + `tabular-nums` for numbers

### Spacing Tokens

```
--radius: 0.5rem (8px)
--radius-sm: 0.375rem (6px)
--radius-lg: 0.75rem (12px)
--radius-xl: 1rem (16px)

--shadow-sm, --shadow, --shadow-md, --shadow-lg, --shadow-xl (layered)

--safe-area-inset-*: env(safe-area-inset-*) for mobile notches

Legacy tokens:
--srx-space-card: clamp(1.5rem, 1.25rem + 1vw, 2.5rem)
--srx-space-section: clamp(1.75rem, 1.5rem + 1.4vw, 3rem)
```

### Accessibility Features

1. **Touch Targets**: Min 44px × 44px (enforced in CSS)
2. **Focus Rings**: 2px solid, 2px offset with `--ring` color
3. **Skip Link**: Positioned at top, visible on focus (`.skip-link`)
4. **Screen Reader**: `.sr-only` utility class
5. **Tap Highlight**: `touch-action: manipulation` on interactive elements
6. **Mobile Font Size**: 16px minimum (prevents iOS zoom)
7. **Keyboard Navigation**: Full ARIA support via Radix primitives
8. **Reduced Motion**: `@media (prefers-reduced-motion)` support

### Animation Principles

- **Compositor-friendly**: Only `transform` and `opacity` animated
- **Easing**: `cubic-bezier(0.22, 1, 0.36, 1)` (standard)
- **Durations**: 150ms (fast), 200ms (default), 300ms (complex)
- **Named animations**: fade-in, fade-up, scale-in, slide-up, shimmer, wiggle, popup

## 4. State Management Patterns

### React Query Setup

**Provider**: Wrapped in `AppProviders` component with devtools enabled

**Query Keys** (`lib/query/keys.ts`):

```ts
{
  bookings: {
    all: ['bookings'],
    list: (params) => ['bookings', 'list', params],
    detail: (id) => ['bookings', 'detail', id],
    history: (id, params) => ['bookings', 'history', id, params]
  },
  profile: {
    self: () => ['profile', 'self']
  }
}
```

**Custom Hooks**:

- `useBookings(filters)`: List bookings with pagination, status filtering
- `useProfile()`: Fetch current user profile
- `useCancelBooking()`: Mutation to cancel booking
- `useUpdateBooking()`: Mutation to edit booking
- `useSupabaseSession()`: Real-time auth state sync

**Patterns Observed**:

- Optimistic updates for mutations
- Query invalidation after successful mutations
- Loading/error/fetching states exposed to components
- No global client-side state beyond React Query cache

### Authentication Flow

1. **Middleware** (`middleware.ts`): Checks session for `/dashboard` and `/profile` routes
2. **Protected Routes**: Redirect to `/signin?redirectedFrom=/path` if unauthenticated
3. **Session Management**: Supabase SSR utilities with `@supabase/ssr`
4. **Client Sync**: `useSupabaseSession()` hook subscribes to auth state changes

## 5. Component Architecture

### Shadcn/ui Components (in `/components/ui/`)

Installed primitives:

- `button`, `card`, `dialog`, `input`, `textarea`, `checkbox`, `toggle`, `toggle-group`
- `form`, `label`, `badge`, `separator`, `skeleton`, `calendar`, `alert`, `alert-dialog`
- `accordion`, `popover`, `progress`

All use Radix UI primitives with custom styling via `class-variance-authority` (CVA)

### Custom Components

**Marketing** (`/components/`):

- `Header.tsx`: Responsive navbar with burger menu, dynamic auth state
- `Footer.tsx`: Links, social, copyright
- `Hero.tsx`, `Problem.tsx`, `CTA.tsx`: Landing page sections
- `Pricing.tsx` (legacy): Former pricing plans display, slated for retirement
- `Testimonials*.tsx`, `FeaturesGrid.tsx`, `FAQ.tsx`

**Dashboard** (`/components/dashboard/`):

- `BookingsTable.tsx`: Main table with pagination, status filtering
- `BookingRow.tsx`: Individual row with actions
- `StatusChip.tsx`, `StatusFilterGroup.tsx`: Status UI
- `EditBookingDialog.tsx`, `CancelBookingDialog.tsx`: Mutation dialogs
- `EmptyState.tsx`, `Pagination.tsx`

**Booking Flow** (`/components/reserve/`):

- `booking-flow/index.tsx`: Multi-step wizard container
- `booking-flow/form.tsx`: Form state management
- `steps/PlanStep.tsx`: Date/time/party selection
- `steps/DetailsStep.tsx`: Customer info form
- `steps/ReviewStep.tsx`: Confirmation summary
- `steps/ConfirmationStep.tsx`: Success state

**Profile** (`/components/profile/`):

- `ProfileManageForm.tsx`: User details edit form

**Mobile (Deprecated?)** (`/components/mobile/`):

- `BottomTabs.tsx`, `CategoryTab.tsx`, `SearchBar.tsx`, `ExperienceCard.tsx`
- **Note**: Summary mentions "removal of mobile app pages" — likely legacy

### Component Patterns

1. **Composition**: Small, focused components with clear props contracts
2. **Controlled Forms**: React Hook Form with Zod schemas
3. **Accessibility**: ARIA labels, roles, keyboard handlers via Radix
4. **Error Boundaries**: Not explicitly implemented (opportunity)
5. **Loading States**: Skeleton components, spinners on buttons
6. **Empty States**: Dedicated `EmptyState` component with helpful copy

## 6. Content & SEO Strategy

### Metadata Pattern

Each page exports `Metadata` object:

```ts
export const metadata: Metadata = {
  title: 'Page Title · SajiloReserveX',
  description: 'SEO-friendly description ≤155 chars',
};
```

Root layout uses `getSEOTags()` helper from `libs/seo.tsx` for defaults.

### SEO Utilities

- **Sitemap**: `next-sitemap` v4.2.3 generates sitemap post-build
- **Structured Data**: Partial implementation (opportunity for schema.org enhancement)
- **Canonical URLs**: Not explicitly seen (opportunity)
- **Open Graph**: Likely in `getSEOTags()` helper
- **Viewport Meta**: Configured in root layout with `themeColor`

### Content Tone & Voice

**Observed patterns**:

- Professional yet friendly ("Pick your restaurant and reserve in moments")
- Benefit-first ("keep your preferences synced")
- Concise microcopy ("Book this restaurant", "Start free")
- Helpful error states ("We couldn't load restaurants right now. Please refresh…")
- Action-oriented CTAs with clear outcomes

## 7. Performance Considerations

### Current Optimizations

1. **Dynamic Imports**: Lazy-loaded routes (e.g., `/docs/*`)
2. **Force Dynamic**: `export const dynamic = "force-dynamic"` on data-dependent pages
3. **Image Optimization**: Next.js Image component with `placeholder="blur"`
4. **Font Loading**: Custom font declared in globals.css, preloaded
5. **React 19**: Concurrent features, automatic batching
6. **Bundle Analysis**: Vite analyzer available via `pnpm analyze`

### Gaps Identified

- **No explicit code splitting strategy** beyond routes
- **No performance budgets** defined in code
- **No service worker/offline** support
- **No resource hints** (preconnect, prefetch, preload)
- **No image CDN** integration (just Next.js optimization)

## 8. Analytics & Events

### Current Implementation (`lib/analytics.ts`)

**Provider**: Plausible via `next-plausible`

**Event Types** (TypeScript enum):

```ts
type AnalyticsEvent =
  | 'select_date'
  | 'select_party'
  | 'select_time'
  | 'confirm_open'
  | 'details_submit'
  | 'booking_created';
```

**Track Function**:

```ts
track(event: AnalyticsEvent, props?: Record<string, unknown>)
```

**Sanitization**: Filters out `undefined`/`null` values  
**Debug Mode**: Console logs in non-production  
**Privacy**: No PII explicitly tracked (good)

### Event Coverage

- ✅ Booking funnel steps tracked
- ❌ No page view tracking (Plausible auto-tracks)
- ❌ No error events tracked
- ❌ No conversion value/revenue tracking
- ❌ No user properties tracked

## 9. Error Handling & Edge Cases

### Current Strategies

1. **API Errors**: Try-catch blocks, typed error classes (`ListRestaurantsError`)
2. **Loading States**: `isLoading`, `isFetching` from React Query
3. **Empty States**: Dedicated components with recovery actions
4. **Form Validation**: Zod schemas with inline error display
5. **Auth Errors**: Middleware redirects, toast notifications
6. **Network Failures**: React Query retry logic (default 3 retries)

### Gaps

- **No global error boundary** component
- **No 500 error page** (Next.js default used)
- **No offline detection** or messaging
- **No rate limit handling** explicitly
- **Limited error telemetry** (just console.error)

## 10. Internationalization & Localization

### Current State

- **Locale**: Hardcoded `en-GB` in config
- **Date/Time**: Uses `date-fns` for formatting (not locale-aware in practice)
- **Currency**: Not implemented; monetization deferred
- **RTL**: No support detected
- **Translation System**: None (opportunity)

## 11. Compliance & Legal

### Accessibility (a11y)

- ✅ WCAG 2.2 AA foundations (focus rings, skip links, ARIA)
- ✅ Semantic HTML (via Radix primitives)
- ✅ Keyboard navigation (full support via Radix)
- ✅ Touch target sizing (44px min)
- ✅ Color contrast (HSL tokens chosen for contrast)
- ❌ No automated a11y testing in CI (axe-core?)

### Privacy & Legal

- ✅ Privacy Policy page (`/privacy-policy`)
- ✅ Terms of Service pages (`/tos`, `/terms/venue`, `/terms/togo`)
- ❌ No cookie consent banner detected
- ❌ No GDPR data export/deletion UI
- ✅ Plausible (GDPR-friendly, no cookies)

## 12. Key Assumptions & Risks

### Assumptions

1. **Target Audience**: English-speaking users in UK/Europe (en-GB locale)
2. **Devices**: Mobile-first, but desktop heavily used for dashboard
3. **Browsers**: Modern evergreen browsers (ES2022+ features)
4. **Auth Method**: Primarily email/password, some OAuth
5. **Booking Model**: Single restaurant per booking, no group bookings
6. **Monetization**: Customer experience remains free-to-use; payment flows paused

### Risks

1. **Mobile Deprecation**: Legacy mobile components still present, unclear strategy
2. **Incomplete Features**: Blog system present but limited content management
3. **Monetization Strategy**: Legacy payment endpoints present; risk of stale code if not cleaned up
4. **Scalability**: No caching strategy beyond React Query
5. **Monitoring**: No APM, error tracking, or alerting system detected

## 13. Reusable Patterns & Best Practices Observed

### Code Quality

- ✅ TypeScript strict mode support
- ✅ ESLint with a11y plugin
- ✅ Pre-commit hooks (lint-staged + Husky)
- ✅ E2E test coverage (Playwright)
- ✅ Consistent file structure (colocation)

### Design Patterns

- ✅ Composition over inheritance (React components)
- ✅ Custom hooks for data fetching
- ✅ Centralized query keys (DRY)
- ✅ Typed API errors
- ✅ Environment validation (`scripts/validate-env.ts`)

### Developer Experience

- ✅ Hot reload (Next.js Fast Refresh)
- ✅ Type safety (TypeScript + Zod)
- ✅ Devtools (React Query Devtools)
- ✅ Storybook setup (for component development)
- ✅ Comprehensive npm scripts

## 14. Recommended Priorities for Architecture Specification

Based on this research, the frontend architecture should prioritize:

1. **Content Strategy**: Finalize all page content, SEO metadata, microcopy
2. **Navigation Model**: Clarify primary/secondary/utility nav (deprecate mobile?)
3. **State Management**: Document patterns, cache strategies, optimistic updates
4. **Error Handling**: Comprehensive error states, boundaries, telemetry
5. **Performance**: Define budgets, code splitting, loading strategies
6. **Analytics**: Expand event tracking, add error events, conversion tracking
7. **Accessibility**: Formalize testing, ARIA patterns, keyboard shortcuts
8. **Edge Cases**: Empty states, offline, rate limits, slow connections
9. **Design Tokens**: Finalize JSON export, document usage guidelines
10. **Testing Strategy**: Unit/E2E/VR coverage matrix, acceptance criteria

## 15. Files Reference

### Critical Configuration Files

- `package.json`: Dependencies, scripts
- `components.json`: Shadcn config
- `config.ts`: App-wide settings (auth, branding, feature flags)
- `tailwind.config.js`: Tailwind + custom tokens
- `app/globals.css`: Design system CSS
- `middleware.ts`: Auth guards, API deprecation headers
- `tsconfig.json`, `tsconfig.strict.json`: TypeScript configs

### Key Libraries/Utilities

- `lib/query/keys.ts`: React Query key factory
- `lib/analytics.ts`: Event tracking
- `lib/supabase/browser.ts`: Supabase client
- `lib/utils.ts`: `cn()` utility, misc helpers
- `libs/seo.tsx`: SEO metadata generator

### Server Functions

- `server/restaurants/`: listRestaurants, getRestaurantBySlug
- `server/bookings.ts`: CRUD operations
- `server/customers.ts`: User management
- `server/supabase.ts`: Server-side Supabase client
- `server/analytics.ts`: Server-side event tracking
- `server/emails/bookings.ts`: Transactional email logic

---

**Next Step**: Create `plan.md` with implementation strategy based on these findings.
