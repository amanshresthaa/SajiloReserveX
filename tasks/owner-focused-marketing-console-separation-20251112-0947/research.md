# Research: Owner-Focused Marketing & Console Separation

## Requirements

- Functional:
  - `/` becomes the owner-focused marketing landing page with SaaS messaging, Product/Pricing/Contact nav, CTA to `/ops/login` (`Sprint Story 2.1`).
  - `/product`, `/pricing`, `/contact` host long-form marketing content for owners with consistent dark theme, responsive layouts, and shared footer copy.
  - `/partners` permanently redirects to `/` and `components/restaurant-partners/RestaurantLandingPage.tsx` is removed (`Story 1.2`).
  - `/ops/login` updates copy + styling (no guest switch, back link to `/`, dark theme, redirect logic intact) (`Story 1.3`).
  - `/reserve/*` guest flows remain untouched; `/ops` stays the post-login console hub; README documents new routing/entry points (`Story 1.1`).
- Non-functional:
  - Maintain accessibility: keyboard nav, semantic headings, focus rings, skip links (per `AGENTS.md` §5).
  - Performance: hero/feature sections must avoid large CLS, use Tailwind tokens (see `src/app/globals.css` + `tailwind.config.js`).
  - Documentation + testing: update routing README + run lint/typecheck before completion; manual QA later via DevTools MCP (§4).

## Existing Patterns & Reuse

- `components/restaurant-partners/RestaurantLandingPage.tsx` + `RestaurantNavbar.tsx`: already implement dark SaaS sections, CTA buttons to `/ops/login`, FAQ, pricing, etc. Structure can seed new marketing shell before we archive the component.
- `components/marketing/MarketingSessionActions.tsx`: auth-aware CTA helper with `mode="restaurant"` (lines 70-132) that routes to `/ops/login` or mailto using `config.email.supportEmail`.
- `src/app/(guest-public)/layout.tsx` currently injects `CustomerNavbar` and `Footer`, so we must refactor into nested route-group layouts to allow separate chromes for marketing vs guest booking flows without duplicating code.
- `components/customer/navigation/CustomerNavbar.tsx`: references `useSupabaseSession` & `useProfile`; useful learning for responsive nav + auth states but too guest-specific.
- `components/Footer.tsx`: global guest footer; marketing flow needs different copy (“Built for restaurants…”), so duplicating structure into a marketing footer component keeps guest flows unchanged.
- `middleware.ts`: enforces redirect logic (`isGuestAccountPath`, `isOpsProtectedPath`, safe redirect builder). Any new redirects (e.g., `/partners → /`) must respect these helpers and not introduce loops.
- `components/auth/SignInForm.tsx`: operations login already passes `redirectedFrom` so we can focus on page shell and copy changes.
- Documentation: `src/app/(guest-public)/README.md` describes this route group; we should extend it with updated entry-point map + layout structure.

## External Resources

- Sprint brief “Owner-Focused Marketing & Console Separation” (user-provided) – defines acceptance criteria, CTA copy, nav links, theming, and testing expectations.

## Constraints & Risks

- Layout refactor risk: moving guest routes under a new route-group layout must not change URLs or break static exports; need to migrate directories carefully and re-export error/not-found components if necessary.
- Marketing nav/footer must not rely on guest session hooks to keep bundle lean and avoid hydration warnings.
- Removing `RestaurantLandingPage` requires ensuring no other module imports it; run `rg` after deletion.
- `/partners` redirect should be permanent (308/301) without affecting middleware guard order.
- Need to confirm `SUPPORT_EMAIL` is configured via `config.email.supportEmail`; fallback string should still be meaningful if env missing.
- Large UI changes require thorough responsive testing; ensure sections degrade gracefully on small screens while maintaining 16px minimum touch targets.

## Open Questions (owner, due)

- Q: Do we still need an easily discoverable guest landing for diners (current `/`)?  
  A: Pending. For now, spec states guest access remains via `/reserve/*`, so we will keep guest routes functional under a separate layout and consider follow-up tasks if a dedicated guest home is needed.

## Recommended Direction (with rationale)

- Adopt dual route-group layouts under `(guest-public)`:
  1. `(guest-public)/(marketing)` for `/`, `/product`, `/pricing`, `/contact` – inject new `OwnerMarketingNavbar` + footer + dark background.
  2. `(guest-public)/(guest-experience)` housing existing guest pages with the previous `CustomerNavbar`/`Footer`.  
     This keeps URLs stable while letting us ship specialized chrome per audience.
- Build reusable marketing primitives (e.g., `OwnerMarketingShell`, CTA buttons, feature cards) inspired by `RestaurantLandingPage` to accelerate hero/product/pricing/contact implementation and ensure theme consistency.
- Update `/ops/login` page (server component) to adopt new styling + remove guest switch while keeping server-side redirect logic untouched; rely on CSS tokens defined in `globals.css`.
- Replace `/partners` page with `permanentRedirect("/")` and delete unused restaurant landing components to prevent dead code.
- Document routing changes + entry points in `src/app/(guest-public)/README.md` (and, if needed, higher-level docs) so future contributors understand marketing vs guest chrome split.
