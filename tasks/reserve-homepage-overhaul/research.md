# Research: Promote Reserve Flow to Homepage

## Current routes & components

- `/reserve` (`app/reserve/page.tsx`)
  - Server component using `dynamic = 'force-dynamic'` so content always reflects latest restaurants.
  - Fetches restaurant summaries via `listRestaurants()` (service role client) and renders cards with `Card`, `Badge`, `Button` from the shadcn UI kit.
  - Shows error banner if Supabase call fails; otherwise grid of restaurant cards or empty state.
  - Page metadata currently “Reserve a table · SajiloReserveX”.
- `/` (`app/page.tsx`)
  - Marketing landing page with bespoke hero/features/testimonials.
  - Already includes a sticky header with inline nav links, “SRX” logo chip, and `ButtonSignin` call-to-action.
  - Uses custom layout/styling; not easily reusable for reservation index.

## Navigation patterns

- `app/page.tsx` header: responsive top nav with inline links (desktop) and menu button (mobile). No focus-trap or disclosure functionality—button currently inert.
- `components/Header.tsx`: legacy responsive navbar built with Tailwind + DaisyUI tokens (burger menu toggles overlay). Depends on client-side session check to show Dashboard link.
- `components/mobile/BottomTabs.tsx`: mobile-only nav used within authenticated app, not suitable for marketing/home.

## Supporting utilities

- `server/restaurants/listRestaurants.ts`: wraps Supabase query, logs detailed errors, returns sorted list. Used only by `/reserve` today.
- Shared UI primitives (`Button`, `Badge`, `Card`) and `ButtonSignin` are available for reuse; ensures consistent styling.

## Constraints & opportunities

- Requirement: move `/reserve` experience to `/` instead of redirecting. Must keep dynamic data fetch and error handling intact.
- Need a new customer-facing navbar with clear hierarchy, skip-to-content link, keyboard accessibility, and responsive menu behavior (per accessibility guidelines provided).
- Ensure metadata/title/description for home reflect the reservation entry point.
- `/reserve` route should likely remain (either redirect to `/` or render fallback) to avoid breaking existing deep links—needs decision in plan.
