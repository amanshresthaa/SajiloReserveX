# Customer Navbar Refresh — Research

## Current Navigation Implementations

- `components/marketing/Navbar.tsx` powers the home page header (`app/page.tsx`). It is a client component that:
  - Pulls the Supabase session via `useSupabaseSession`.
  - Builds nav links (currently `#restaurants`, `/dashboard`, `/profile/manage`, `mailto:support`).
  - Uses Headless UI `Dialog` + raw buttons for the mobile sheet, **not** shadcn primitives.
  - Relies on `MarketingSessionActions` to render primary/secondary CTAs (desktop + mobile).
  - Shows a skip link; applies focus rings manually; includes a hamburger button for mobile.
- `components/Header.tsx` is an older marketing header (DaisyUI-style classes). It also appends `/dashboard` when a session exists. New work should avoid duplicating this legacy pattern.

## Session & Profile Data

- `useSupabaseSession` (`hooks/useSupabaseSession.ts`) exposes `{ user, status }` and subscribes to auth changes. Useful for toggling between “Sign in” vs avatar menu.
- `useProfile` (`hooks/useProfile.ts`) fetches the customer profile (`/api/profile`) with React Query. Provides access to profile image/name that can populate an avatar.
- `MarketingSessionActions` generates action buttons; both nav + hero call it. Defaults link authenticated users to `/dashboard` and `/profile/manage`.

## Route Naming & Guards

- Customer dashboard lives under `app/(authed)/dashboard`. Server entry (`page.tsx`) redirects anonymous users to `/signin?redirectedFrom=/dashboard`.
- Middleware (`middleware.ts`) also protects `/dashboard`, `/profile`, `/thank-you`.
- Numerous modules/tests reference `/dashboard` (`rg "/dashboard"`):
  - Marketing header + session actions.
  - Supabase auth flows (sign-in form defaults, magic link redirect).
  - Tests (`tests/e2e/dashboard`, unit tests, middleware coverage).
  - Server/client booking components.
  - API callback + analytics fixtures.
- Renaming the route to `/my-bookings` requires coordinated updates across these references plus filesystem rename (`app/(authed)/dashboard` → `app/(authed)/my-bookings`).

## UI Component Inventory

- Existing shadcn kit in `components/ui` includes: `button`, `dialog`, `popover`, `accordion`, etc.
- Missing shadcn primitives we likely need:
  - `Avatar` for profile thumbnail/fallback.
  - `DropdownMenu` for avatar menu.
  - Possibly `Sheet` or `NavigationMenu` for mobile.
- Adding these will require generating new files (follow shadcn patterns) and ensuring light, responsive, focus-visible defaults.

## Customer-Facing Code Organization

- Current marketing components live under `components/marketing`.
- Customer authenticated pages live in `app/(authed)/dashboard`, with supporting widgets under `components/dashboard`.
- There is no dedicated namespace for shared “customer shell” pieces (navbar, footer, etc.). New work should introduce something like `components/customer/navigation` for clarity and future reuse across `/`, `/my-bookings`, reservation flows.

## Accessibility & Responsive Considerations

- Requirements emphasize:
  - Mobile-first layout: nav should collapse gracefully, with ≥44px touch targets and accessible focus rings.
  - Keyboard support per WAI-ARIA: avatar menu must be navigable via keyboard, focus managed correctly.
  - Visual focus indicators (`:focus-visible`). Current marketing nav handles this manually; shadcn variants include focus ring tokens.
  - `Skip to content` link already present—should preserve.
  - Ensure avatar menu includes “My bookings”, “Manage profile”, “Sign out”; sign-out likely triggers Supabase `signOut`.

## Testing Hooks

- No existing dedicated navbar tests. To follow TDD:
  - Could add Playwright/Vitest tests under `reserve/tests` or `tests/e2e` to exercise new menu behavior.
  - Need to mock Supabase session + profile query for unit tests.

## Open Questions

- Sign-out implementation: confirm if there is a helper/hook for Supabase sign-out in customer area (search during planning).
- Determine where new navbar should mount (home page only vs shared layout). Likely we should replace `MarketingNavbar` usage and export new shared navbar for all customer routes.
