# Customer Navbar Refresh — Implementation Plan

## Goals

- Introduce a streamlined, customer-focused navbar showing only the brand mark and an auth-aware action area (sign-in button or avatar menu).
- Reorganize customer navigation code into a dedicated `components/customer/navigation` namespace built with shadcn primitives.
- Rename the customer dashboard route from `/dashboard` to `/my-bookings` across filesystem, redirects, middleware, and tests.
- Preserve accessibility requirements (skip link, focus visibility, keyboard support) and ensure responsive behavior from mobile upward.
- Provide tests validating the new navbar behavior and path rename.

## Functional Requirements

1. **Navbar experience**
   - Desktop: brand at left, auth actions right-aligned.
   - Authenticated: show avatar button opening dropdown with “My bookings”, “Manage profile”, “Sign out”.
   - Unauthenticated: show single “Sign in” button (touch target ≥44px, `touch-action: manipulation`).
   - Include skip-link + focus handling.
   - Mobile: hamburger toggles sheet/drawer listing the same actions; maintain full keyboard support and trap focus in sheet.
   - Honor `prefers-reduced-motion`.
2. **Route rename**
   - Filesystem path: `app/(authed)/dashboard` → `app/(authed)/my-bookings`.
   - Update server/client imports accordingly.
   - Adjust redirect defaults (`redirectedFrom`, session actions, middleware matcher, analytics, tests).
3. **Sign out**
   - Add Supabase sign-out handler triggered from avatar dropdown (optimistic UI; handle errors with toast if possible).

## Technical Approach

1. **Component scaffolding**
   - Add missing shadcn primitives (`Avatar`, `DropdownMenu`, `Sheet`, `Separator` if needed) under `components/ui`.
   - Create `components/customer/navigation/CustomerNavbar.tsx` (client component):
     - Reuse `useSupabaseSession`, `useProfile`.
     - Render responsive layout using Tailwind + shadcn components.
     - Provide `aria` labels, `focus-visible` modifiers, `aria-expanded` where appropriate.
     - Manage mobile sheet open state with `useState`; trap focus via shadcn `Sheet`.
   - Extract helper subcomponents if necessary (`ProfileMenu`, `AuthActions`).
2. **Sign-out handling**
   - Implement `handleSignOut` using Supabase browser client (`getSupabaseBrowserClient().auth.signOut()`).
   - Provide loading state to disable button briefly; ensure menu closes.
3. **Route rename execution**
   - Move directory to `app/(authed)/my-bookings`.
   - Update internal imports (e.g., `DashboardClient` -> rename to `MyBookingsClient`? Decide whether to keep name for minimal churn; if renaming, update references/tests).
   - Adjust redirect fallback in `SignInForm`, `MarketingSessionActions`, analytics tests, middleware matcher, etc.
   - Update `MarketingSessionActions` to point to `/my-bookings`.
   - Update `reserve/[reservationId]/ReservationDetailClient.tsx` link.
   - Review config/constants referencing `/dashboard`.
4. **Integrate navbar**
   - Replace `components/marketing/Navbar` usage in `app/page.tsx` with new navbar.
   - Remove or deprecate old `marketing/Navbar` (optionally leave stub exporting new component for backward compatibility).
   - Ensure customer-facing pages that should display navbar import it (initially home page; evaluate whether reservation detail pages should also use it).
   - Update CSS (skip link class, etc.) if necessary to reference new component.
5. **Testing strategy (TDD)**
   - Add Vitest unit tests for `CustomerNavbar`:
     - Unauthenticated: renders sign-in button, no dropdown.
     - Authenticated + profile image fallback: shows avatar initials, dropdown items trigger correct hrefs.
     - Mock Supabase + React Query providers (use `QueryClientProvider`).
   - Update existing tests referencing `/dashboard` to new path.
   - Consider Playwright update for e2e spec hitting `/my-bookings`.
6. **Verification**
   - Run relevant test suites (`pnpm test --filter ...` or targeted commands).
   - Smoke test `pnpm lint` or `pnpm typecheck` if necessary.
   - Manual verification instructions if automated coverage limited.

## Open Items / Clarifications

- Confirm whether `/reserve` pages should also include the new navbar (initial implementation targets home page).
- Determine design tokens for avatar fallback (initials vs icon). Default to initials derived from profile name/email.
- Decide whether to remove `MarketingSessionActions` or update to use new path; plan assumes update only.
