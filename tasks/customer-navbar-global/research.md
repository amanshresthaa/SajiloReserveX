# Customer Navbar Global Rollout — Research

## Current Placement

- `CustomerNavbar` lives in `components/customer/navigation/CustomerNavbar.tsx`. It is a client component that handles session-aware actions, mobile sheet, and skip link.
- Present usage is limited to the home page (`app/page.tsx`) via direct import. Other pages (sign-in, profile, my-bookings, owner flows) do **not** include it.

## App Shell Structure

- `app/layout.tsx` wraps every page with `<AppProviders>` and `<ClientLayout>`.
- `components/LayoutClient.tsx` is a client wrapper that renders:
  - `NextTopLoader`
  - `children`
  - `Toaster`, tooltip, Crisp chat embed
- Because `ClientLayout` already executes on the client and sits at the top of the tree, it is a good injection point for a global navbar.

## Existing Headers

- Authenticated areas still render route-specific headers:
  - `app/(authed)/my-bookings/layout.tsx` provides the contextual “My Bookings” hero.
  - `app/(authed)/profile/layout.tsx` renders its own header.
- Adding the navbar globally will stack above these. Need to ensure spacing looks correct (top padding if required).

## Sticky Behavior Considerations

- `CustomerNavbar` root element currently wraps header in a plain `div`. To make it sticky we can set `position: sticky; top: 0;` on the outer container and ensure `z-index` remains above page content (current `z-40` might be adequate; consider bumping if overlays conflict).
- Need backdrop + background to avoid transparency issues while scrolling; component already uses `bg-background/90` with blur—should continue to look good when sticky.

## Potential Conflicts

- Root layout already exposes a global “Skip to content” link (`app/layout.tsx`). `CustomerNavbar` includes its own skip link. With navbar rendered globally, there will be two skip links stacked near the top; we should verify they don't overlap visually (they’re placed differently, but consider deduplicating later if desired).
- Owner/admin routes currently rely on separate layout styling; confirm the global navbar aligns with their UX expectations. User requested “all pages,” so default approach is to render it universally.

## Implementation Targets

- Remove direct navbar usage in `app/page.tsx` (avoid duplication).
- Inject `<CustomerNavbar />` inside `ClientLayout` before `{children}` so all routes inherit it.
- Update navbar container classes to `sticky top-0` (with `z-50` or higher) while retaining existing focus/skip-link behavior.
