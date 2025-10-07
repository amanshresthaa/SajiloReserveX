# 12. Final Output Package

## 1. Assumptions

- Users prefer instant booking to inquiry/waitlist journeys; guest checkout is deferred in favour of Supabase Auth (email/password + Google).
- Four-step booking flow (plan → details → review → confirmation) balances clarity and speed; future tests may explore a condensed variant.
- OAuth + email/password cover ≥95 % of diners; SMS/2FA reserved for enterprise accounts.
- Marketing pages remain static for ~quarterly updates; blog publishes weekly to sustain SEO momentum.
- Initial locale is en-GB with UK spellings; format dates/times in restaurant timezone; GBP as default currency.
- Monetization deferred during MVP; customer experience remains free-to-use with no payment processing required.
- Mobile-first responsive web app replaces need for native apps; PWA enhancements come later.
- Restaurant data is curated by partner staff; no public content moderation pipeline required.
- Plausible analytics satisfies privacy and reporting needs; no PII captured in events.
- Node.js runtime deployments (Vercel) meet performance requirements; Edge runtime optional for future experiments.

## 2. IA & Navigation

```json
{
  "ia": {
    "meta": {
      "project": "SajiloReserveX",
      "version": "1.0.0",
      "lastUpdated": "2024-10-07",
      "maxDepth": 3,
      "totalNodes": 21
    },
    "nodes": [
      {
        "id": "home",
        "path": "/",
        "title": "Home",
        "h1": "Pick your restaurant and reserve in moments",
        "purpose": "Primary landing page: showcase partner restaurants, drive to booking flow",
        "messages": [
          "Real-time availability across multiple restaurants",
          "Simple, fast booking in under 2 minutes",
          "Manage all reservations in one dashboard"
        ],
        "owner": "Marketing team",
        "ttlDays": 30,
        "seoTitle": "Reserve a table · SajiloReserveX",
        "seoDescription": "Pick a SajiloReserveX partner restaurant and book your next visit in seconds.",
        "schemaType": "WebSite",
        "auth": "public",
        "priority": "critical"
      },
      {
        "id": "reserve-hub",
        "path": "/reserve",
        "title": "Reserve",
        "h1": "Book in under two minutes",
        "purpose": "Guide diners into the booking flow with live availability and reassurance messaging",
        "messages": [
          "Instant confirmation with every booking",
          "Flexible changes up to two hours before dining",
          "Notifications that keep guests informed"
        ],
        "owner": "Marketing team",
        "ttlDays": 60,
        "seoTitle": "Reserve a table · SajiloReserveX",
        "seoDescription": "Start a reservation, see live availability, and manage every booking from one place.",
        "schemaType": "Service",
        "auth": "public",
        "priority": "high"
      },
      {
        "id": "signin",
        "path": "/signin",
        "title": "Sign In",
        "h1": "Welcome back",
        "purpose": "Authenticate users via Supabase Auth (OAuth + email/password)",
        "messages": [
          "Sign in to view your bookings",
          "Continue with Google or email",
          "New user? Signing in creates your account automatically"
        ],
        "owner": "Engineering team",
        "ttlDays": 180,
        "seoTitle": "Sign In · SajiloReserveX",
        "seoDescription": "Access your dashboard and manage your restaurant reservations.",
        "schemaType": "WebPage",
        "auth": "public",
        "priority": "critical"
      },
      {
        "id": "booking-restaurant-select",
        "path": "/reserve/r/[slug]",
        "title": "Book at [Restaurant Name]",
        "h1": "Book your table at [Restaurant Name]",
        "purpose": "Multi-step booking flow: capture date, time, party size, customer details",
        "messages": [
          "Real-time availability (no overbooking)",
          "Instant confirmation via email and SMS",
          "Free cancellation up to 2 hours before"
        ],
        "owner": "Product team",
        "ttlDays": 7,
        "seoTitle": "Book [Restaurant Name] · SajiloReserveX",
        "seoDescription": "Reserve your table at [Restaurant Name] with SajiloReserveX.",
        "schemaType": "Service",
        "auth": "public",
        "priority": "critical",
        "children": [
          {
            "id": "booking-step-plan",
            "step": 1,
            "title": "Step 1: Choose Date & Time",
            "purpose": "Date picker, timeslot selector, party size input"
          },
          {
            "id": "booking-step-details",
            "step": 2,
            "title": "Step 2: Your Details",
            "purpose": "Name, email, phone, special requests"
          },
          {
            "id": "booking-step-review",
            "step": 3,
            "title": "Step 3: Review & Confirm",
            "purpose": "Summary, terms acceptance, submit"
          },
          {
            "id": "booking-step-confirmation",
            "step": 4,
            "title": "Step 4: Confirmation",
            "purpose": "Success state, booking reference, next steps"
          }
        ]
      },
      {
        "id": "booking-confirmation",
        "path": "/reserve/[reservationId]",
        "title": "Booking Confirmed",
        "h1": "Your table is confirmed!",
        "purpose": "Post-booking confirmation page (shareable link)",
        "messages": [
          "Confirmation email sent to [email]",
          "Booking reference: [REF]",
          "Add to calendar / Share / Manage booking"
        ],
        "owner": "Product team",
        "ttlDays": 365,
        "seoTitle": "Booking Confirmed · SajiloReserveX",
        "seoDescription": "Your reservation is confirmed. View details and manage your booking.",
        "schemaType": "ReservationConfirmation",
        "auth": "public",
        "priority": "high"
      },
      {
        "id": "dashboard",
        "path": "/dashboard",
        "title": "My Bookings",
        "h1": "Your reservations",
        "purpose": "View, filter, edit, cancel user's bookings; primary authenticated landing page",
        "messages": [
          "All your reservations in one place",
          "Upcoming, past, and cancelled bookings",
          "Quick actions: edit, cancel, rebook"
        ],
        "owner": "Product team",
        "ttlDays": 1,
        "seoTitle": "My Bookings · SajiloReserveX",
        "seoDescription": "View and manage your restaurant reservations.",
        "schemaType": "CollectionPage",
        "auth": "protected",
        "priority": "critical"
      },
      {
        "id": "profile-manage",
        "path": "/profile/manage",
        "title": "Profile Settings",
        "h1": "Your profile",
        "purpose": "Edit user profile (name, email, phone, preferences)",
        "messages": [
          "Keep your details up to date",
          "Set dining preferences (dietary restrictions, seating)",
          "Manage notification settings"
        ],
        "owner": "Product team",
        "ttlDays": 30,
        "seoTitle": "Profile Settings · SajiloReserveX",
        "seoDescription": "Update your profile and booking preferences.",
        "schemaType": "ProfilePage",
        "auth": "protected",
        "priority": "medium"
      },
      {
        "id": "blog-index",
        "path": "/blog",
        "title": "Blog",
        "h1": "Dining insights & news",
        "purpose": "Content marketing hub: SEO traffic, thought leadership, restaurant features",
        "messages": ["Tips for dining out", "Restaurant spotlights", "Industry news and trends"],
        "owner": "Marketing team",
        "ttlDays": 7,
        "seoTitle": "Blog · SajiloReserveX",
        "seoDescription": "Discover dining tips, restaurant features, and industry insights.",
        "schemaType": "Blog",
        "auth": "public",
        "priority": "medium"
      },
      {
        "id": "blog-article",
        "path": "/blog/[articleId]",
        "title": "[Article Title]",
        "h1": "[Article Title]",
        "purpose": "Individual blog post with rich content, social sharing, related posts",
        "messages": ["Rich media (images, videos)", "Author bio", "Related articles"],
        "owner": "Marketing team",
        "ttlDays": 365,
        "seoTitle": "[Article Title] · SajiloReserveX Blog",
        "seoDescription": "[Article excerpt, ≤155 chars]",
        "schemaType": "BlogPosting",
        "auth": "public",
        "priority": "medium"
      },
      {
        "id": "blog-author",
        "path": "/blog/author/[authorId]",
        "title": "Author Archive",
        "h1": "[Author Name]",
        "purpose": "List all articles by a specific author",
        "messages": ["Author bio", "Articles by this author", "Subscribe CTA"],
        "owner": "Marketing team",
        "ttlDays": 30,
        "seoTitle": "[Author Name] · SajiloReserveX",
        "seoDescription": "Read articles written by [Author Name] on SajiloReserveX.",
        "schemaType": "ProfilePage",
        "auth": "public",
        "priority": "low"
      },
      {
        "id": "blog-category",
        "path": "/blog/category/[categoryId]",
        "title": "Category Archive",
        "h1": "[Category Name]",
        "purpose": "Group articles by category for SEO and UX",
        "messages": ["Articles within category", "Related categories", "Subscribe CTA"],
        "owner": "Marketing team",
        "ttlDays": 30,
        "seoTitle": "[Category Name] · SajiloReserveX",
        "seoDescription": "Browse articles about [Category Name] on SajiloReserveX.",
        "schemaType": "CollectionPage",
        "auth": "public",
        "priority": "low"
      },
      {
        "id": "privacy-policy",
        "path": "/privacy-policy",
        "title": "Privacy Policy",
        "h1": "Privacy policy",
        "purpose": "Legal compliance (GDPR) and user trust",
        "messages": ["How we collect and use data", "Your privacy rights", "Contact information"],
        "owner": "Legal team",
        "ttlDays": 180,
        "seoTitle": "Privacy Policy · SajiloReserveX",
        "seoDescription": "Learn how SajiloReserveX keeps your data private and secure.",
        "schemaType": "WebPage",
        "auth": "public",
        "priority": "medium"
      },
      {
        "id": "terms",
        "path": "/tos",
        "title": "Terms of Service",
        "h1": "Terms of service",
        "purpose": "Legal terms for using SajiloReserveX",
        "messages": ["User obligations", "Service limitations", "Liability statements"],
        "owner": "Legal team",
        "ttlDays": 180,
        "seoTitle": "Terms of Service · SajiloReserveX",
        "seoDescription": "Review the terms and conditions for using SajiloReserveX.",
        "schemaType": "WebPage",
        "auth": "public",
        "priority": "medium"
      },
      {
        "id": "terms-venue",
        "path": "/terms/venue",
        "title": "Venue Terms",
        "h1": "Venue partnership terms",
        "purpose": "Contract terms for restaurants joining the platform",
        "messages": ["Service-level expectations", "Commission rates", "Cancellation policies"],
        "owner": "Legal team",
        "ttlDays": 180,
        "seoTitle": "Venue Terms · SajiloReserveX",
        "seoDescription": "Review our venue partnership terms and conditions.",
        "schemaType": "WebPage",
        "auth": "public",
        "priority": "low"
      },
      {
        "id": "terms-togo",
        "path": "/terms/togo",
        "title": "ToGo Terms",
        "h1": "Takeaway terms",
        "purpose": "Terms for takeaway/collection partners",
        "messages": ["Operational requirements", "Fulfilment expectations", "Fee structure"],
        "owner": "Legal team",
        "ttlDays": 180,
        "seoTitle": "ToGo Terms · SajiloReserveX",
        "seoDescription": "Understand our ToGo service partnership terms.",
        "schemaType": "WebPage",
        "auth": "public",
        "priority": "low"
      },
      {
        "id": "thank-you",
        "path": "/thank-you",
        "title": "Thank You",
        "h1": "Thank you",
        "purpose": "Post-form submission confirmation (lead capture, feedback)",
        "messages": ["We received your submission", "Next steps timeline", "Support contact"],
        "owner": "Marketing team",
        "ttlDays": 90,
        "seoTitle": "Thank You · SajiloReserveX",
        "seoDescription": "Thanks for reaching out to SajiloReserveX.",
        "schemaType": "WebPage",
        "auth": "public",
        "priority": "low"
      },
      {
        "id": "not-found",
        "path": "/404",
        "title": "Page Not Found",
        "h1": "We couldn’t find that page",
        "purpose": "Friendly 404 page with recovery links",
        "messages": ["Apology and reassurance", "Link back to home", "Contact support"],
        "owner": "Engineering team",
        "ttlDays": 365,
        "seoTitle": "404 · SajiloReserveX",
        "seoDescription": "The page you’re looking for no longer exists.",
        "schemaType": "WebPage",
        "auth": "public",
        "priority": "low"
      },
      {
        "id": "error",
        "path": "/500",
        "title": "Something Went Wrong",
        "h1": "Something went wrong",
        "purpose": "Global error fallback for unexpected failures",
        "messages": ["Apology and reassurance", "Retry button", "Support link"],
        "owner": "Engineering team",
        "ttlDays": 365,
        "seoTitle": "Error · SajiloReserveX",
        "seoDescription": "We ran into an error. Please retry or contact support.",
        "schemaType": "WebPage",
        "auth": "public",
        "priority": "low"
      }
    ],
    "nav": {
      "primary": ["home", "reserve-hub", "blog"],
      "secondary": ["thank-you", "privacy-policy", "terms"],
      "utility": ["signin", "dashboard", "profile-manage"],
      "footer": [
        "home",
        "reserve-hub",
        "blog",
        "privacy-policy",
        "terms",
        "terms-venue",
        "terms-togo",
        "thank-you"
      ]
    }
  }
}
```

**Diagrammer-friendly list**:

- Home (`/`) → Reserve, Blog, Sign In, Booking Flow, Legal (Privacy, Terms, Venue Terms, ToGo Terms), Utility (Thank You, 404, 500)
- Booking Flow (`/reserve/r/[slug]`) → Step 1 (Plan), Step 2 (Details), Step 3 (Review), Step 4 (Confirmation), Confirmation page (`/reserve/[reservationId]`)
- Blog (`/blog`) → Article, Author, Category nodes
- Protected area → Dashboard (`/dashboard`), Profile (`/profile/manage`)

## 3. Content

```md
---
slug: '/'
seoTitle: 'Reserve a table · SajiloReserveX'
seoDescription: 'Pick a SajiloReserveX partner restaurant and book your next visit in seconds.'
schemaType: 'WebSite'
canonical: 'https://example.com/'
ogImage: '/og-home.png'
---

# Pick your restaurant and reserve in moments

Explore participating SajiloReserveX locations and book a table in just a few taps. Sign in to revisit previous reservations and keep your preferences synced.

## Available restaurants

Choose a partner location below to open the full reservation flow. We keep availability updated in real-time so you can book with confidence.

CTA (primary, authed): **View My Bookings**
CTA (primary, unauth): **Sign In**
CTA (secondary): **Browse Restaurants**

Empty state:

- H3: “No restaurants available”
- Body: “Check back soon or reach out to our concierge team for personalised assistance.”
- CTA: **Contact Support**

Error state:

- Alert: “We couldn’t load restaurants right now. Please refresh, or contact support if the issue persists.”
- CTA: **Retry**
```

```md
---
slug: '/reserve'
seoTitle: 'Reserve a table · SajiloReserveX'
seoDescription: 'Start a reservation, see live availability, and manage every booking from one place.'
schemaType: 'Service'
canonical: 'https://example.com/reserve'
---

# Book in under two minutes

Tell us when and where you’d like to dine. We’ll surface live availability and keep you posted at every step—no phone calls required.

## Highlights

- **Instant confirmation** — Every reservation is confirmed with the restaurant before we show it to you.
- **Flexible changes** — Modify or cancel up to two hours before your seating, straight from your dashboard.
- **Stay in the loop** — Choose email, SMS, or both for reminders and updates that actually help.

## Calls to action

- **Start a reservation** (primary) → `/reserve/r/discover` (focus lands on filters panel)
- **Browse restaurants** (secondary) → `/#restaurants`
- Inline help: “Need support for a group of 8 or more? Email concierge@example.com and we’ll take it from there.”

## Frequently asked questions

1. **Can I edit my booking after confirmation?** Yes. Visit your dashboard to adjust time, party size, or special requests. We’ll confirm changes instantly or offer alternatives.
2. **Do I need an account?** You can browse without one, but you’ll sign in (or create an account) to finish a booking so we can send updates.
3. **How far in advance can I book?** Most restaurants accept bookings up to 60 days ahead. The date picker shows available windows automatically.
4. **What happens if I lose internet mid-booking?** We save your progress locally. Reconnect and we’ll resume exactly where you left off, with prompts if anything needs review.
```

```md
---
slug: '/signin'
seoTitle: 'Sign In · SajiloReserveX'
seoDescription: 'Access your dashboard and manage your restaurant reservations.'
schemaType: 'WebPage'
canonical: 'https://example.com/signin'
---

# Welcome back

Sign in to view your bookings and manage your reservations. New user? Signing in creates your account automatically.

## Sign in options

- **Continue with Google** (OAuth)
- Divider “or”
- Email input: label “Email address”, placeholder “you@example.com”, `autocomplete="email"`, required
- Password input: label “Password”, placeholder “Enter your password”, `autocomplete="current-password"`, required
- Link: **Forgot password?**
- Submit button: **Sign In** (loading label “Signing in…”)

### Error states

- Invalid credentials: “Email or password is incorrect. Please try again.”
- Network issue: “Connection failed. Please check your internet and retry.”
- Rate limit: “Too many sign-in attempts. Please wait 5 minutes and try again.”

### Success

- Redirect to `/dashboard` (or provided `redirectedFrom` URL)
```

## 4. Routes

```ts
import { redirect } from 'next/navigation';

export type AuthLevel = 'public' | 'protected' | 'admin';

export interface Route {
  id: string;
  path: string;
  title: string;
  auth: AuthLevel;
  children?: Route[];
}

export const routes: Route[] = [
  { id: 'home', path: '/', title: 'Home', auth: 'public' },
  { id: 'reserve-hub', path: '/reserve', title: 'Reserve', auth: 'public' },
  { id: 'signin', path: '/signin', title: 'Sign In', auth: 'public' },
  { id: 'booking-flow', path: '/reserve/r/:slug', title: 'Book Restaurant', auth: 'public' },
  { id: 'booking-confirmation', path: '/reserve/:id', title: 'Booking Confirmed', auth: 'public' },
  { id: 'dashboard', path: '/dashboard', title: 'My Bookings', auth: 'protected' },
  { id: 'profile', path: '/profile/manage', title: 'Profile Settings', auth: 'protected' },
  {
    id: 'blog',
    path: '/blog',
    title: 'Blog',
    auth: 'public',
    children: [
      { id: 'blog-article', path: '/blog/:articleId', title: 'Article', auth: 'public' },
      { id: 'blog-author', path: '/blog/author/:authorId', title: 'Author', auth: 'public' },
      {
        id: 'blog-category',
        path: '/blog/category/:categoryId',
        title: 'Category',
        auth: 'public',
      },
    ],
  },
  { id: 'privacy-policy', path: '/privacy-policy', title: 'Privacy Policy', auth: 'public' },
  { id: 'terms', path: '/tos', title: 'Terms of Service', auth: 'public' },
  { id: 'thank-you', path: '/thank-you', title: 'Thank You', auth: 'public' },
];

export const nav = {
  home: () => '/',
  reserve: () => '/reserve',
  signin: (redirectTo?: string) =>
    redirectTo ? `/signin?redirectedFrom=${encodeURIComponent(redirectTo)}` : '/signin',
  dashboard: () => '/dashboard',
  profile: () => '/profile/manage',
  bookingFlow: (restaurantSlug: string) => `/reserve/r/${restaurantSlug}`,
  bookingConfirmation: (reservationId: string) => `/reserve/${reservationId}`,
  blog: {
    index: () => '/blog',
    article: (articleId: string) => `/blog/${articleId}`,
    author: (authorId: string) => `/blog/author/${authorId}`,
    category: (categoryId: string) => `/blog/category/${categoryId}`,
  },
};

export function requireAuth(session: unknown) {
  if (!session) {
    redirect(nav.signin());
  }
}
```

```text
/app
├── layout.tsx
├── page.tsx
├── providers.tsx
├── globals.css
├── not-found.tsx
├── error.tsx
├── (marketing)/
│   ├── layout.tsx
│   ├── reserve/page.tsx
│   ├── blog/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── [articleId]/page.tsx
│   │   ├── author/[authorId]/page.tsx
│   │   └── category/[categoryId]/page.tsx
│   ├── terms/venue/page.tsx
│   ├── terms/togo/page.tsx
│   ├── privacy-policy/page.tsx
│   ├── tos/page.tsx
│   └── thank-you/page.tsx
├── (auth)/
│   ├── layout.tsx
│   └── signin/page.tsx
├── (booking)/
│   └── reserve/
│       ├── r/[slug]/page.tsx
│       └── [reservationId]/page.tsx
├── (protected)/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   └── profile/manage/page.tsx
└── api/
    ├── auth/...
    ├── bookings/...
    ├── profile/...
    └── stripe/...
```

## 5. State/Data

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  bookings: {
    all: ['bookings'] as const,
    list: (params: BookingListParams = {}) => ['bookings', 'list', params] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
    history: (id: string, params: Record<string, unknown> = {}) =>
      ['bookings', 'history', id, params] as const,
  },
  profile: {
    self: () => ['profile', 'self'] as const,
  },
  restaurants: {
    all: ['restaurants'] as const,
    list: (params: RestaurantListParams = {}) => ['restaurants', 'list', params] as const,
    detail: (slug: string) => ['restaurants', 'detail', slug] as const,
  },
  blog: {
    all: ['blog'] as const,
    articles: (params: ArticleListParams = {}) => ['blog', 'articles', params] as const,
    article: (id: string) => ['blog', 'article', id] as const,
    authors: () => ['blog', 'authors'] as const,
    author: (id: string) => ['blog', 'author', id] as const,
    categories: () => ['blog', 'categories'] as const,
    category: (id: string) => ['blog', 'category', id] as const,
  },
} as const;

interface BookingListParams {
  status?: 'upcoming' | 'past' | 'cancelled';
  page?: number;
  pageSize?: number;
}

interface RestaurantListParams {
  city?: string;
  cuisine?: string;
}

interface ArticleListParams {
  categoryId?: string;
  authorId?: string;
  page?: number;
  pageSize?: number;
}

export interface BookingDTO {
  id: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount: number, error: any) => {
        if (error?.response?.status && error.response.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: (failureCount: number, error: any) => {
        if (error?.message?.includes('network') || error?.code === 'ECONNREFUSED') {
          return failureCount < 2;
        }
        return false;
      },
    },
  },
};

export const invalidationPatterns = {
  afterCreateBooking: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  },
  afterUpdateBooking: (queryClient: QueryClient, bookingId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  },
  afterCancelBooking: (queryClient: QueryClient, bookingId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  },
  afterUpdateProfile: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.self() });
  },
  afterSignOut: (queryClient: QueryClient) => {
    queryClient.clear();
  },
};

export function optimisticCancelBooking(queryClient: QueryClient, bookingId: string) {
  const key = queryKeys.bookings.detail(bookingId);
  const previous = queryClient.getQueryData<BookingDTO>(key);
  queryClient.setQueryData<BookingDTO>(key, (old) => (old ? { ...old, status: 'cancelled' } : old));
  return () => queryClient.setQueryData(key, previous);
}

export function optimisticUpdateProfile(queryClient: QueryClient, updates: Partial<ProfileDTO>) {
  const key = queryKeys.profile.self();
  const previous = queryClient.getQueryData<ProfileDTO>(key);
  queryClient.setQueryData<ProfileDTO>(key, (old) => (old ? { ...old, ...updates } : old));
  return () => queryClient.setQueryData(key, previous);
}

export const authFlows = {
  signIn: async (email: string, password: string) => {
    // Supabase sign-in handled via supabase-js
  },
  signInWithGoogle: async () => {
    // Supabase OAuth flow
  },
  signOut: async (queryClient: QueryClient) => {
    invalidationPatterns.afterSignOut(queryClient);
  },
};
```

## 6. Components

```ts
import { ReactNode } from 'react';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
}

export interface InputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'url' | 'search';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'url' | 'search';
  maxLength?: number;
  className?: string;
  'aria-label'?: string;
}

export interface TextareaProps extends Omit<InputProps, 'type' | 'inputMode'> {
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

export interface SelectProps {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export interface CheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  error?: string;
  className?: string;
  'aria-label'?: string;
}

export interface CardProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

export interface TableProps<Row> {
  columns: Array<{
    id: string;
    header: ReactNode;
    accessor: (row: Row) => ReactNode;
    align?: 'left' | 'center' | 'right';
    className?: string;
  }>;
  rows: Row[];
  keyExtractor: (row: Row) => string;
  emptyState: ReactNode;
  isLoading?: boolean;
  skeletonRows?: number;
  onRowClick?: (row: Row) => void;
  'aria-label': string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type: Toast['type']) => void;
  dismissToast: (id: string) => void;
}
```

## 7. Design Tokens

```css
:root {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(222 47% 11%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(222 47% 11%);
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(222 47% 11%);
  --color-primary: hsl(222 47% 11%);
  --color-primary-foreground: hsl(210 40% 98%);
  --color-secondary: hsl(210 40% 96.1%);
  --color-secondary-foreground: hsl(222 47% 11%);
  --color-muted: hsl(210 40% 96.1%);
  --color-muted-foreground: hsl(215 16% 47%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-destructive-foreground: hsl(210 40% 98%);
  --color-success: hsl(142 76% 36%);
  --color-warning: hsl(38 92% 50%);
  --color-info: hsl(199 89% 48%);
  --color-border: hsl(214 32% 91%);
  --color-input: hsl(214 32% 91%);
  --color-ring: hsl(222 47% 11%);
  --space-0: 0px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  --font-sans:
    'SajiloReserveX Cereal App', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-screen-title: 34px/40px 700;
  --font-section-header: 22px/28px 600;
  --font-card-title: 18px/22px 600;
  --font-body: 16px/24px 400;
  --font-label: 14px/20px 400;
  --font-button: 16px/20px 600;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --z-dropdown: 1000;
  --z-modal: 1050;
  --z-toast: 1080;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --easing-standard: cubic-bezier(0.22, 1, 0.36, 1);
}

.dark {
  --color-background: hsl(222 47% 11%);
  --color-foreground: hsl(210 40% 98%);
  --color-card: hsl(222 40% 13%);
  --color-card-foreground: hsl(210 40% 98%);
  --color-popover: hsl(222 40% 13%);
  --color-popover-foreground: hsl(210 40% 98%);
  --color-primary: hsl(210 40% 98%);
  --color-primary-foreground: hsl(222 47% 11%);
  --color-secondary: hsl(217 33% 17%);
  --color-secondary-foreground: hsl(210 40% 98%);
  --color-muted: hsl(217 33% 17%);
  --color-muted-foreground: hsl(215 20% 65%);
  --color-destructive: hsl(0 72% 51%);
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-info: hsl(199 89% 48%);
  --color-border: hsl(217 33% 17%);
  --color-input: hsl(217 33% 17%);
  --color-ring: hsl(212 35% 70%);
}
```

```json
{
  "colors": {
    "light": {
      "background": "hsl(0, 0%, 100%)",
      "foreground": "hsl(222, 47%, 11%)",
      "card": "hsl(0, 0%, 100%)",
      "cardForeground": "hsl(222, 47%, 11%)",
      "popover": "hsl(0, 0%, 100%)",
      "popoverForeground": "hsl(222, 47%, 11%)",
      "primary": "hsl(222, 47%, 11%)",
      "primaryForeground": "hsl(210, 40%, 98%)",
      "secondary": "hsl(210, 40%, 96.1%)",
      "secondaryForeground": "hsl(222, 47%, 11%)",
      "muted": "hsl(210, 40%, 96.1%)",
      "mutedForeground": "hsl(215, 16%, 47%)",
      "accent": "hsl(210, 40%, 96.1%)",
      "accentForeground": "hsl(222, 47%, 11%)",
      "destructive": "hsl(0, 84.2%, 60.2%)",
      "destructiveForeground": "hsl(210, 40%, 98%)",
      "success": "hsl(142, 76%, 36%)",
      "successForeground": "hsl(210, 40%, 98%)",
      "warning": "hsl(38, 92%, 50%)",
      "warningForeground": "hsl(222, 47%, 11%)",
      "info": "hsl(199, 89%, 48%)",
      "infoForeground": "hsl(210, 40%, 98%)",
      "border": "hsl(214, 32%, 91%)",
      "input": "hsl(214, 32%, 91%)",
      "ring": "hsl(222, 47%, 11%)"
    },
    "dark": {
      "background": "hsl(222, 47%, 11%)",
      "foreground": "hsl(210, 40%, 98%)",
      "card": "hsl(222, 40%, 13%)",
      "cardForeground": "hsl(210, 40%, 98%)",
      "popover": "hsl(222, 40%, 13%)",
      "popoverForeground": "hsl(210, 40%, 98%)",
      "primary": "hsl(210, 40%, 98%)",
      "primaryForeground": "hsl(222, 47%, 11%)",
      "secondary": "hsl(217, 33%, 17%)",
      "secondaryForeground": "hsl(210, 40%, 98%)",
      "muted": "hsl(217, 33%, 17%)",
      "mutedForeground": "hsl(215, 20%, 65%)",
      "accent": "hsl(217, 33%, 17%)",
      "accentForeground": "hsl(210, 40%, 98%)",
      "destructive": "hsl(0, 72%, 51%)",
      "destructiveForeground": "hsl(210, 40%, 98%)",
      "success": "hsl(142, 71%, 45%)",
      "successForeground": "hsl(210, 40%, 98%)",
      "warning": "hsl(38, 92%, 50%)",
      "warningForeground": "hsl(222, 47%, 11%)",
      "info": "hsl(199, 89%, 48%)",
      "infoForeground": "hsl(210, 40%, 98%)",
      "border": "hsl(217, 33%, 17%)",
      "input": "hsl(217, 33%, 17%)",
      "ring": "hsl(212, 35%, 70%)"
    },
    "chart": {
      "1": "hsl(12, 76%, 61%)",
      "2": "hsl(173, 58%, 39%)",
      "3": "hsl(197, 37%, 24%)",
      "4": "hsl(43, 74%, 66%)",
      "5": "hsl(27, 87%, 67%)"
    }
  },
  "spacing": {
    "0": 0,
    "1": 4,
    "2": 8,
    "3": 12,
    "4": 16,
    "5": 20,
    "6": 24,
    "8": 32,
    "10": 40,
    "12": 48,
    "16": 64,
    "20": 80,
    "24": 96,
    "32": 128,
    "40": 160,
    "48": 192,
    "56": 224,
    "64": 256,
    "touchTarget": 44,
    "screenMargin": "clamp(1rem, 3vw, 2rem)",
    "cardPadding": "clamp(1.5rem, 2.5vw, 2.5rem)",
    "sectionGap": "clamp(1.75rem, 4vw, 3rem)"
  },
  "typography": {
    "fontFamily": {
      "sans": "'SajiloReserveX Cereal App', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    },
    "fontSize": {
      "screenTitle": {
        "size": "34px",
        "lineHeight": "40px",
        "fontWeight": "700"
      },
      "sectionHeader": {
        "size": "22px",
        "lineHeight": "28px",
        "fontWeight": "600"
      },
      "cardTitle": {
        "size": "18px",
        "lineHeight": "22px",
        "fontWeight": "600"
      },
      "body": {
        "size": "16px",
        "lineHeight": "24px",
        "fontWeight": "400"
      },
      "label": {
        "size": "14px",
        "lineHeight": "20px",
        "fontWeight": "400"
      },
      "button": {
        "size": "16px",
        "lineHeight": "20px",
        "fontWeight": "600"
      },
      "caption": {
        "size": "12px",
        "lineHeight": "16px",
        "fontWeight": "400"
      }
    },
    "fontFeatures": "cv02, cv03, cv04, cv11",
    "letterSpacing": {
      "tight": "-0.02em",
      "normal": "0",
      "wide": "0.05em",
      "wider": "0.1em",
      "widest": "0.3em"
    }
  },
  "borderRadius": {
    "none": 0,
    "sm": "6px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "2xl": "24px",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "inner": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    "card": "0 18px 36px -16px rgba(15, 23, 42, 0.15)",
    "header": "0 1px 3px 0 rgb(0 0 0 / 0.1)",
    "modal": "0 25px 50px -12px rgb(0 0 0 / 0.25)"
  },
  "zIndex": {
    "base": 0,
    "dropdown": 1000,
    "sticky": 1020,
    "fixed": 1030,
    "modalBackdrop": 1040,
    "modalContent": 1050,
    "popover": 1060,
    "tooltip": 1070,
    "toast": 1080,
    "skipLink": 9999
  },
  "animation": {
    "duration": {
      "fast": "150ms",
      "normal": "200ms",
      "slow": "300ms",
      "slower": "500ms"
    },
    "easing": {
      "standard": "cubic-bezier(0.22, 1, 0.36, 1)",
      "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
      "easeOut": "cubic-bezier(0, 0, 0.2, 1)",
      "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)"
    },
    "keyframes": {
      "fadeIn": {
        "from": { "opacity": 0 },
        "to": { "opacity": 1 }
      },
      "fadeUp": {
        "from": { "opacity": 0, "transform": "translateY(10px)" },
        "to": { "opacity": 1, "transform": "translateY(0)" }
      },
      "scaleIn": {
        "from": { "opacity": 0, "transform": "scale(0.95)" },
        "to": { "opacity": 1, "transform": "scale(1)" }
      },
      "slideUp": {
        "from": { "transform": "translateY(100%)", "opacity": 0 },
        "to": { "transform": "translateY(0)", "opacity": 1 }
      }
    }
  }
}
```

## 8. Edge Cases

| Context            | Failure Mode / Empty State           | User-Facing Copy                                                                   | Recovery Action                                                | Telemetry Event                                              |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| Global             | Network offline detected             | Banner: “You’re offline. Showing cached data only.”                                | Disable mutations; show Retry once `navigator.onLine` true.    | `network_offline` (`{ path }`)                               |
| Global             | 404 route                            | Page: “We couldn’t find that page.” CTA: **Back to home**                          | Offer Home + Contact links; focus heading on mount.            | `route_not_found` (`{ path }`)                               |
| Global             | 500/unhandled error                  | Fallback: “Something went wrong. Try again or contact support.”                    | Provide **Try again** reload + log to monitoring.              | `app_error` (`{ path, message }`)                            |
| Home               | Restaurants fetch fails              | Toast: “We can’t reach the restaurant list right now. Please retry.”               | Show error card with **Retry** button.                         | `restaurants_list_error` (`{ status }`)                      |
| Home               | No restaurants available             | Empty card: “No partner restaurants nearby yet. Tell us where to launch next.”     | CTA to lead form `/thank-you`, add newsletter opt-in.          | `restaurants_empty` (`{ city }`)                             |
| Booking Step 2     | No slots                             | Alert: “No tables available at that time. Try another time or party size.”         | Surface alternate slots + Modify search controls.              | `availability_empty` (`{ restaurantId, partySize }`)         |
| Booking submission | Validation error                     | Inline message: “Please double-check your email.”                                  | Keep values, focus first invalid field.                        | `booking_validation_error` (`{ code }`)                      |
| Booking submission | Server error                         | Dialog: “We couldn’t confirm your booking. We’ll keep trying.”                     | Allow manual retry; backoff retry automatically.               | `booking_server_error` (`{ restaurantId }`)                  |
| Dashboard          | No bookings                          | Empty card: “You haven’t booked a table yet.” CTA **Explore restaurants**          | Link to `/` with user city filter.                             | `dashboard_empty`                                            |
| Dashboard          | Cancel booking fails                 | Toast: “We couldn’t cancel that booking. Please try again.”                        | Roll back optimistic change; re-enable action.                 | `booking_cancel_error` (`{ bookingId }`)                     |
| Profile            | Avatar upload fails                  | Inline error: “Image upload failed. Use JPG or PNG under 5 MB.”                    | Keep existing avatar; focus uploader.                          | `profile_upload_error` (`{ fileSize }`)                      |
| Reserve            | Connection drops during confirmation | Sticky banner: “We saved your details. Reconnect to finish confirming your table.” | Persist form state, re-enable confirm when online, auto retry. | `network_offline` (`{ path: "/reserve", stage: "confirm" }`) |
| Blog               | No articles yet                      | Empty message: “Fresh stories are on the way.” CTA **Subscribe for updates**       | Show newsletter form.                                          | `blog_empty`                                                 |

## 9. Performance & SEO Plan

- Budgets: LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms, TTI ≤3.5 s; initial JS ≤200 KB gzipped; page weight ≤1 MB.
- Rendering: Prefer server components for marketing; client components only when interactivity required.
- Code splitting: Lazy-load dashboard charts, blog detail widgets; shared layout primitives extracted.
- Data fetching: Use Next.js `fetch` with revalidation tags; hydrate React Query on server for authed routes.
- Images: Next.js `<Image>` with AVIF/WebP, explicit dimensions, lazy-load below the fold, reserved aspect ratios.
- Fonts: Self-host subsets via `@next/font/local` with `font-display: optional`; fallback to system stack.
- Caching: `public, max-age=600, stale-while-revalidate=86400` for marketing pages; React Query staleTime 5 min.
- Monitoring: Lighthouse CI + WebPageTest; future Sentry performance for RUM.
- Accessibility: WCAG 2.2 AA baseline, AAA touch targets, focus management, reduced-motion variants.
- SEO: Sitemap + robots, canonical tags, schema.org (Restaurant, Reservation, Service, BlogPosting), OG/Twitter metadata, async `plausible.js`.

## 10. Analytics Spec

```md
- Provider: Plausible via `next-plausible`; dispatch through `track(event, props)`.
- PII policy: NEVER send names/emails/phones/notes; hash IDs where stored; honour consent flag `NEXT_PUBLIC_ANALYTICS_CONSENT`.
- Event taxonomy:
  - `restaurant_list_viewed` `{ city?, filters? }`
  - `restaurant_selected` `{ restaurantId, position, campaign? }`
  - `availability_checked` `{ restaurantId, partySize, dateISO?, timeSlot? }`
  - `availability_empty` `{ restaurantId, partySize, dateISO? }`
  - `details_submit_started` `{ restaurantId, partySize? }`
  - `booking_created` `{ bookingId, restaurantId, channel? }`
  - `booking_validation_error` `{ field, code, restaurantId? }`
  - `booking_server_error` `{ restaurantId, status? }`
  - `booking_cancelled` `{ bookingId, reason? }`
  - `booking_cancel_error` `{ bookingId, status? }`
  - `dashboard_viewed` `{ totalBookings, timeframe? }`
  - `profile_updated` `{ fields[], hasAvatar? }`
  - `profile_upload_error` `{ fileSize, fileType? }`
  - `blog_article_viewed` `{ articleId, category? }`
  - `route_not_found` `{ path, referrer? }`
  - `app_error` `{ path, message? }`
  - `network_offline` `{ path, wasOnlineForMs? }`
- Machine-readable catalog (JSON):
```

```json
{
  "events": [
    {
      "name": "restaurant_list_viewed",
      "props": { "city": "string|optional", "filters": "string[]|optional" }
    },
    {
      "name": "restaurant_selected",
      "props": { "restaurantId": "string", "position": "number", "campaign": "string|optional" }
    },
    {
      "name": "availability_checked",
      "props": {
        "restaurantId": "string",
        "partySize": "number",
        "dateISO": "string|optional",
        "timeSlot": "string|optional"
      }
    },
    {
      "name": "availability_empty",
      "props": { "restaurantId": "string", "partySize": "number", "dateISO": "string|optional" }
    },
    {
      "name": "details_submit_started",
      "props": { "restaurantId": "string", "partySize": "number|optional" }
    },
    {
      "name": "booking_created",
      "props": {
        "bookingId": "string",
        "restaurantId": "string",
        "channel": "\"web\"|\"phone\"|optional"
      }
    },
    {
      "name": "booking_validation_error",
      "props": { "field": "string", "code": "string", "restaurantId": "string|optional" }
    },
    {
      "name": "booking_server_error",
      "props": { "restaurantId": "string", "status": "number|optional" }
    },
    {
      "name": "booking_cancelled",
      "props": { "bookingId": "string", "reason": "string|optional" }
    },
    {
      "name": "booking_cancel_error",
      "props": { "bookingId": "string", "status": "number|optional" }
    },
    {
      "name": "dashboard_viewed",
      "props": { "totalBookings": "number", "timeframe": "\"30d\"|\"90d\"|optional" }
    },
    {
      "name": "profile_updated",
      "props": { "fields": "string[]", "hasAvatar": "boolean|optional" }
    },
    {
      "name": "profile_upload_error",
      "props": { "fileSize": "number", "fileType": "string|optional" }
    },
    {
      "name": "blog_article_viewed",
      "props": { "articleId": "string", "category": "string|optional" }
    },
    { "name": "route_not_found", "props": { "path": "string", "referrer": "string|optional" } },
    { "name": "app_error", "props": { "path": "string", "message": "string|optional" } },
    {
      "name": "network_offline",
      "props": { "path": "string", "wasOnlineForMs": "number|optional" }
    }
  ],
  "piiPolicy": {
    "forbidden": ["name", "email", "phone", "notes", "fullAddress"],
    "hashing": ["bookingId", "restaurantId"],
    "consentGate": "NEXT_PUBLIC_ANALYTICS_CONSENT === \"granted\""
  }
}
```

## 11. Acceptance Criteria & Test Plan

```gherkin
Feature: Guest discovers and books a restaurant
  Scenario: Complete booking in under two minutes
    Given I am on the Home page with restaurants available
    And I select a restaurant from the top results
    When I choose a date, time, and party size
    And I enter valid guest details
    And I confirm the booking
    Then I see the booking confirmation page within 2 minutes of landing
    And the confirmation toast announces “Booking confirmed”
    And the booking appears in my dashboard

Feature: Returning user manages an existing booking
  Scenario: Cancel a future booking
    Given I am a signed-in user with at least one upcoming booking
    When I open the dashboard and select “Cancel booking”
    Then the UI shows a confirmation dialog with details
    When I confirm the cancellation
    Then the booking status updates to “Cancelled” within 500 ms
    And a success toast reads “Booking cancelled”
    And the cancellation event is tracked as `booking_cancelled`

Feature: Booking resume after reconnect
  Scenario: Finish confirmation after going offline
    Given I have completed the details step of a booking
    And I lose connectivity before I can confirm
    When I return online within 5 minutes
    Then the review step retains all of my entered information
    And I see a banner “You’re back online — tap confirm to finish your booking.”
    When I press **Confirm booking**
    Then the booking is created within 500 ms
    And analytics records `booking_created` with the restaurant ID

Feature: Authentication recovery
  Scenario: Reset forgotten password
    Given I am on the Sign-in page
    When I select “Forgot password?”
    And I submit a registered email
    Then I see a confirmation message “Check your email for a reset link”
    And a reset email is sent via Supabase
    When I follow the link and set a new password
    Then I can sign in with the new password
    And previous sessions are invalidated
```

| Area                       | Unit (Vitest)                             | Component (Testing Library)         | E2E (Playwright)                     | Visual Regression               | Accessibility             |
| -------------------------- | ----------------------------------------- | ----------------------------------- | ------------------------------------ | ------------------------------- | ------------------------- |
| Booking availability logic | Validate query params, pagination helpers | Step forms rendering, validation    | Full booking flow (mobile + desktop) | Hero + confirmation             | Forms announce errors     |
| Dashboard table            | Data formatting utilities                 | Table sorting, empty/loading states | Cancel/edit booking via API          | Table layout across breakpoints | Row focus & keyboard      |
| Profile management         | Zod schemas trim/format values            | Avatar uploader, form inputs        | Update profile & rehydrate session   | Avatar cropper alignment        | Inputs + validation focus |
| Reserve landing            | CTA scroll + anchor behaviour             | Highlights cards & FAQ toggles      | Reserve CTA focus & offline banner   | Hero layout across breakpoints  | Buttons 44 px, contrast   |
| Authentication             | Session reducer, auth guards              | Sign-in form, error banners         | Sign-in/out, password reset          | Auth layout on mobile           | Focus trap & skip link    |
| Blog                       | Markdown parser utilities                 | Article preview card                | Article navigation & canonical       | Cover imagery cropping          | Heading order, skip link  |
| Global navigation          | Route config invariants                   | Header/footer components            | Deep links + locale switch (future)  | Header sticky behaviour         | Skip to content works     |

Testing cadence:

- TDD-first: write failing unit/component test before UI work.
- CI gates: `pnpm test`, `pnpm lint`, `pnpm test:e2e`, `pnpm test:a11y`.
- Manual QA: Safari (desktop + iOS), Chrome (Android), Firefox; verify reduced-motion + high-contrast settings.
- Regression: Weekly scheduled Playwright suite on staging; nightly Lighthouse CI run.
