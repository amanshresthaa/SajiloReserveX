# Implementation Plan: Customer Home & Navbar Refresh

## Objective

Deliver a focused customer landing experience with a redesigned global navbar and a streamlined home page that highlights partner restaurants.

## Success Criteria

- [ ] Navbar presents concise branding, primary navigation, and session-aware actions with accessible keyboard/touch interactions.
- [ ] Mobile navigation uses a tidy sheet/drawer with clear sign-in/out pathways.
- [ ] Home page showcases a hero section and contextual introduction before a refreshed restaurant list.
- [ ] All authentication behaviour (session display, sign-out) continues working.
- [ ] Unit tests updated to reflect new structure; lint/build succeed.

## Architecture & Components

### Navbar

- Rebuild `CustomerNavbar` using smaller subcomponents:
  - `BrandLink` for logo/home navigation.
  - `DesktopActions` / `MobileMenu` composed within the main header.
  - Extract sign-out logic to a helper hook (`useSignOut`) for clarity.
- Maintain a sticky header with backdrop blur, but simplify class usage and avoid inline `Sheet` state leakage.
- Preserve skip link and ensure `<nav aria-label="Primary">` semantics around navigation links.

### Home Page

- Keep data fetching in `app/page.tsx`, but split JSX into helper components (e.g., `<HeroSection />`, `<RestaurantSection />`).
- Hero: bold headline, supporting text, CTA buttons (reuse `MarketingSessionActions`).
- Add a subtle stats/features row to differentiate experience (optional if time permits and keeps scope manageable).
- Ensure `RestaurantBrowser` remains the source of truth for list interactions.

## Data Flow

- Server component fetches restaurants and hydrates React Query cache as before.
- Navbar continues reading Supabase session/profile via existing hooks.
- Sign-out triggers Supabase action, refreshes router, closes mobile sheet.

## Testing Strategy

- Update `CustomerNavbar` tests to assert new structure (loading skeleton, signed-in dropdown, mobile sheet toggling).
- Add snapshot or DOM queries for hero section to ensure headings and CTA exist.
- Run `pnpm run lint` and, if feasible, targeted Vitest suites (`pnpm vitest reserve/tests/unit/CustomerNavbar.test.tsx`).

## Implementation Steps

1. **Refactor navbar component**
   - Create helper subcomponents/hooks within `CustomerNavbar.tsx` or co-located files.
   - Ensure styling uses consistent utility classes.
2. **Revise home page layout**
   - Extract hero + restaurant sections, adjust copy, ensure semantics.
3. **Adjust supporting styles/assets** (if new icons or tokens needed).
4. **Update tests**
   - Adapt existing Vitest tests to new DOM structure.
5. **Verification**
   - Manual smoke test (desktop + mobile viewport, sign-in/out flow).
   - Automated lint/tests.

## Open Questions

- Confirm whether to add additional marketing sections beyond hero/list (pending stakeholder input).
- Determine final copy for CTA buttons (defaulting to existing `MarketingSessionActions`).
