/**
 * 4. Routing & Navigation (Next.js App Router)
 * 
 * This file provides type-safe route definitions, navigation utilities,
 * and file structure recommendations for SajiloReserveX.
 */

// ============================================================================
// ROUTE TYPE DEFINITIONS
// ============================================================================

export type AuthLevel = "public" | "protected" | "admin";

export interface Route {
  id: string;
  path: string;
  title: string;
  auth: AuthLevel;
  children?: Route[];
}

export const routes: Route[] = [
  {
    id: "home",
    path: "/",
    title: "Home",
    auth: "public",
  },
  {
    id: "reserve-hub",
    path: "/reserve",
    title: "Start a Reservation",
    auth: "public",
  },
  {
    id: "signin",
    path: "/signin",
    title: "Sign In",
    auth: "public",
  },
  {
    id: "booking-flow",
    path: "/reserve/r/:slug",
    title: "Book Restaurant",
    auth: "public",
  },
  {
    id: "booking-confirmation",
    path: "/reserve/:id",
    title: "Booking Confirmed",
    auth: "public",
  },
  {
    id: "dashboard",
    path: "/dashboard",
    title: "My Bookings",
    auth: "protected",
  },
  {
    id: "profile",
    path: "/profile/manage",
    title: "Profile Settings",
    auth: "protected",
  },
  {
    id: "blog",
    path: "/blog",
    title: "Blog",
    auth: "public",
    children: [
      {
        id: "blog-article",
        path: "/blog/:articleId",
        title: "Article",
        auth: "public",
      },
      {
        id: "blog-author",
        path: "/blog/author/:authorId",
        title: "Author",
        auth: "public",
      },
      {
        id: "blog-category",
        path: "/blog/category/:categoryId",
        title: "Category",
        auth: "public",
      },
    ],
  },
  {
    id: "privacy-policy",
    path: "/privacy-policy",
    title: "Privacy Policy",
    auth: "public",
  },
  {
    id: "terms",
    path: "/tos",
    title: "Terms of Service",
    auth: "public",
  },
  {
    id: "thank-you",
    path: "/thank-you",
    title: "Thank You",
    auth: "public",
  },
];

// ============================================================================
// FILE STRUCTURE (Next.js App Router)
// ============================================================================

/**
 * Recommended file structure for /app directory:
 * 
 * /app
 * ├── layout.tsx                     # Root layout (providers, SEO, skip link)
 * ├── page.tsx                       # Home page (restaurant listing)
 * ├── providers.tsx                  # React Query + context providers
 * ├── globals.css                    # Design system tokens
 * ├── not-found.tsx                  # 404 page
 * ├── error.tsx                      # Error boundary (500)
 * │
 * ├── (marketing)/                   # Route group (shared layout)
 * │   ├── layout.tsx                 # Marketing layout (Header, Footer)
 * │   ├── reserve/
 * │   │   └── page.tsx               # Reservation landing (marketing explainer)
 * │   ├── blog/
 * │   │   ├── layout.tsx             # Blog layout
 * │   │   ├── page.tsx               # Blog index
 * │   │   ├── [articleId]/
 * │   │   │   └── page.tsx           # Article detail
 * │   │   ├── author/
 * │   │   │   └── [authorId]/
 * │   │   │       └── page.tsx       # Author archive
 * │   │   └── category/
 * │   │       └── [categoryId]/
 * │   │           └── page.tsx       # Category archive
 * │   ├── terms/
 * │   │   ├── venue/
 * │   │   │   └── page.tsx           # Venue terms
 * │   │   └── togo/
 * │   │       └── page.tsx           # ToGo terms
 * │   ├── privacy-policy/
 * │   │   └── page.tsx               # Privacy policy
 * │   ├── tos/
 * │   │   └── page.tsx               # Terms of service
 * │   └── thank-you/
 * │       └── page.tsx               # Thank you page
 * │
 * ├── (auth)/                        # Route group (auth pages)
 * │   ├── layout.tsx                 # Minimal auth layout (centered card)
 * │   └── signin/
 * │       └── page.tsx               # Sign in page
 * │
 * ├── (booking)/                     # Route group (booking flow)
 * │   └── reserve/
 * │       ├── r/
 * │       │   └── [slug]/
 * │       │       └── page.tsx       # Booking flow (restaurant-specific)
 * │       └── [reservationId]/
 * │           └── page.tsx           # Booking confirmation
 * │
 * ├── (protected)/                   # Route group (authenticated pages)
 * │   ├── layout.tsx                 # Protected layout (auth check, sidebar?)
 * │   ├── dashboard/
 * │   │   ├── layout.tsx             # Dashboard layout
 * │   │   └── page.tsx               # Bookings table
 * │   └── profile/
 * │       ├── layout.tsx             # Profile layout
 * │       └── manage/
 * │           └── page.tsx           # Profile management form
 * │
 * └── api/                           # API routes (existing structure)
 *     ├── auth/
 *     ├── bookings/
 *     ├── profile/
 *     └── ...
 */

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Type-safe navigation builder
 */
export const nav = {
  home: () => "/",
  reserve: () => "/reserve",
  signin: (redirectTo?: string) => 
    redirectTo ? `/signin?redirectedFrom=${encodeURIComponent(redirectTo)}` : "/signin",
  dashboard: () => "/dashboard",
  profile: () => "/profile/manage",
  bookingFlow: (restaurantSlug: string) => `/reserve/r/${restaurantSlug}`,
  bookingConfirmation: (reservationId: string) => `/reserve/${reservationId}`,
  blog: {
    index: () => "/blog",
    article: (articleId: string) => `/blog/${articleId}`,
    author: (authorId: string) => `/blog/author/${authorId}`,
    category: (categoryId: string) => `/blog/category/${categoryId}`,
  },
  legal: {
    privacy: () => "/privacy-policy",
    terms: () => "/tos",
    venue: () => "/terms/venue",
    togo: () => "/terms/togo",
  },
  thankYou: () => "/thank-you",
};

// ============================================================================
// ACTIVE LINK LOGIC
// ============================================================================

/**
 * Hook to determine if a path is active
 * 
 * @example
 * const isActive = useIsActivePath('/dashboard');
 * <Link href="/dashboard" className={isActive ? 'active' : ''}>Dashboard</Link>
 */
export function useIsActivePath(path: string): boolean {
  // This would use Next.js usePathname() in actual implementation
  // Placeholder for type safety
  const pathname = "/"; // Replace with: usePathname()
  
  if (path === "/" && pathname === "/") return true;
  if (path !== "/" && pathname.startsWith(path)) return true;
  
  return false;
}

/**
 * NavLink component with active state
 * 
 * @example
 * <NavLink href="/reserve">Reserve</NavLink>
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
}

export function NavLink({
  href,
  children,
  className = "",
  activeClassName = "nav-link-active",
  exact = false,
}: NavLinkProps) {
  const pathname = usePathname();
  
  const isActive = exact
    ? pathname === href
    : href === "/"
    ? pathname === "/"
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`${className} ${isActive ? activeClassName : ""}`}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

// ============================================================================
// MIDDLEWARE PATTERNS
// ============================================================================

/**
 * Auth guard for protected routes (implemented in middleware.ts)
 * 
 * Current implementation:
 * - Checks Supabase session for /dashboard and /profile routes
 * - Redirects to /signin?redirectedFrom={pathname} if unauthenticated
 * - Refreshes session automatically via Supabase SSR
 * 
 * See: /middleware.ts
 */

/**
 * Protected route patterns (for reference):
 * 
 * const PROTECTED_MATCHERS = [
 *   /^\/dashboard(\/.*)?$/,
 *   /^\/profile(\/.*)?$/,
 * ];
 */

// ============================================================================
// 404/500 HANDLING
// ============================================================================

/**
 * Not Found Page (/app/not-found.tsx)
 * 
 * Triggered by:
 * - Non-existent routes
 * - notFound() function in page components
 * 
 * Implementation:
 * - Display 404 error message
 * - Suggest common destinations (Home, Reserve, Blog)
 * - "Return Home" CTA
 */

/**
 * Error Boundary (/app/error.tsx)
 * 
 * Triggered by:
 * - Unhandled exceptions in page components
 * - Server errors (500)
 * 
 * Implementation:
 * - Display error message with error ID (for support)
 * - "Reload Page" CTA
 * - "Check Status" link (external status page)
 * - Log error to monitoring service (Sentry, Datadog, etc.)
 */

// ============================================================================
// ROUTE GENERATORS (FOR SEO/SITEMAP)
// ============================================================================

/**
 * Generate all static routes for sitemap
 */
export function getStaticRoutes(): string[] {
  return [
    "/",
    "/reserve",
    "/signin",
    "/dashboard",
    "/profile/manage",
    "/blog",
    "/privacy-policy",
    "/tos",
    "/terms/venue",
    "/terms/togo",
    "/thank-you",
  ];
}

/**
 * Generate dynamic routes (requires data fetching)
 * 
 * Used in next-sitemap.config.js for dynamic route generation
 */
export async function getDynamicRoutes(): Promise<string[]> {
  // Example: Fetch all restaurants, blog articles, etc.
  // const restaurants = await fetchRestaurants();
  // const articles = await fetchArticles();
  
  // return [
  //   ...restaurants.map(r => `/reserve/r/${r.slug}`),
  //   ...articles.map(a => `/blog/${a.id}`),
  // ];
  
  return [];
}

// ============================================================================
// CANONICAL URL HELPERS
// ============================================================================

/**
 * Build canonical URL for SEO
 */
export function getCanonicalUrl(path: string, baseUrl = "https://example.com"): string {
  // Remove trailing slash, query params, hash
  const cleanPath = path.split("?")[0].split("#")[0].replace(/\/$/, "");
  return `${baseUrl}${cleanPath || "/"}`;
}

/**
 * Example metadata generation with canonical
 */
export function generateMetadata(path: string, title: string, description: string) {
  return {
    title: `${title} · SajiloReserveX`,
    description,
    alternates: {
      canonical: getCanonicalUrl(path),
    },
  };
}

// ============================================================================
// ROUTE GUARDS (CLIENT-SIDE)
// ============================================================================

/**
 * Hook to redirect unauthenticated users (client-side guard)
 * 
 * @example
 * export default function DashboardPage() {
 *   useRequireAuth(); // Redirects if not authenticated
 *   return <Dashboard />;
 * }
 */
export function useRequireAuth() {
  // Implementation would check Supabase session
  // and redirect to /signin if not authenticated
  // This is a placeholder for type safety
}

/**
 * HOC for protected pages (alternative pattern)
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    useRequireAuth();
    return <Component {...props} />;
  };
}

// ============================================================================
// NAVIGATION UTILITIES
// ============================================================================

/**
 * Programmatic navigation helper
 * 
 * @example
 * const navigate = useNavigate();
 * navigate.toDashboard();
 */
export function useNavigate() {
  // This would use Next.js router in actual implementation
  const router = {}; // Replace with: useRouter()
  
  return {
    toHome: () => {},
    toDashboard: () => {},
    toBookingFlow: (slug: string) => {},
    toSignin: (redirectTo?: string) => {},
    back: () => {},
    reload: () => {},
  };
}

// ============================================================================
// BREADCRUMB GENERATION
// ============================================================================

export interface Breadcrumb {
  label: string;
  href?: string; // Undefined for current page
}

/**
 * Generate breadcrumbs from current path
 * 
 * @example
 * // For path "/blog/best-restaurants-2024"
 * const crumbs = generateBreadcrumbs("/blog/best-restaurants-2024", {
 *   "/blog": "Blog",
 *   "/blog/best-restaurants-2024": "Best Restaurants of 2024",
 * });
 * // Returns: [{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Best Restaurants of 2024" }]
 */
export function generateBreadcrumbs(
  pathname: string,
  labels: Record<string, string>
): Breadcrumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [{ label: "Home", href: "/" }];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const isLast = i === segments.length - 1;
    
    breadcrumbs.push({
      label: labels[currentPath] || segments[i],
      href: isLast ? undefined : currentPath,
    });
  }

  return breadcrumbs;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  routes,
  nav,
  NavLink,
  useIsActivePath,
  getStaticRoutes,
  getDynamicRoutes,
  getCanonicalUrl,
  generateMetadata,
  generateBreadcrumbs,
};
