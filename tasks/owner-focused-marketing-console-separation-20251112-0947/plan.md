# Implementation Plan: Owner-Focused Marketing & Console Separation

## Objective

We will enable restaurant owners to experience a distinct marketing and console entry path so that guest flows stay isolated from owner funnels.

## Success Criteria

- [ ] `/`, `/product`, `/pricing`, `/contact` present the new dark SaaS experience with nav links (Product, Pricing, Contact, Sign in) and CTA targets to `/ops/login` or `mailto:SUPPORT_EMAIL`.
- [ ] Guest flows (`/reserve/*`, `/browse`, `/signin`, etc.) keep the previous customer navbar/footer without visual regressions.
- [ ] `/partners` permanently redirects to `/` and old restaurant landing/nav code is removed.
- [ ] `/ops/login` reflects new copy (no guest switch, back link to `/`, theme alignment) while preserving redirect handling.
- [ ] `src/app/(guest-public)/README.md` (and related docs) explain the split entry points and routing behavior.

## Architecture & Components

- **Route-group layout split**
  - Update `src/app/(guest-public)/layout.tsx` to act as a thin wrapper.
  - New `src/app/(guest-public)/(marketing)/layout.tsx` renders `OwnerMarketingNavbar`, page content, and `OwnerMarketingFooter`.
  - New `src/app/(guest-public)/(guest-experience)/layout.tsx` contains the previous `CustomerNavbar` + legacy `Footer`; move guest routes (`blog`, `browse`, `checkout`, `create`, `item`, `privacy-policy`, `reserve`, `signin`, `terms`, `thank-you`, etc.) inside this group so URLs stay intact.
- **Marketing primitives (new folder `components/owner-marketing`)**
  - `OwnerMarketingNavbar`: sticky header with Product/Pricing/Contact anchors or routes, CTA button to `/ops/login`, hamburger menu for mobile, accessible focus handling.
  - `OwnerMarketingFooter`: sectioned footer w/ tagline “Built for restaurants, not marketplaces”, links to docs/legal + `mailto`.
  - `OwnerMarketingShell`: shared wrapper for pages to compose hero/background spacing; optionally expose `showBackLink` etc.
  - `PrimaryCta`, `SecondaryCta`, `SectionHeading`, `StatGrid`, `FeatureCard` utilities to keep typography consistent across root/product/pricing/contact pages. Pull palette + spacing from `tailwind.config.js` tokens.
- **Pages**
  - `/src/app/(guest-public)/(marketing)/page.tsx` renders `OwnerLandingPage` component with hero (“Turn your website into a shameless booking engine”), feature highlights (bookings, table mgmt, automation), CTA buttons (primary `/ops/login`, secondary `mailto`), nav hook-up, responsive sections, final footer copy.
  - `/product/page.tsx`: long-form product narrative with five sections (Capture, Operate, Communicate, Service Match, Guest Ownership) + bottom CTA band reusing CTA components.
  - `/pricing/page.tsx`: three-tier cards (Starter, Growth—highlight, Enterprise), feature comparisons, CTA linking to `/ops/login` or `/contact`, FAQ referencing support email.
  - `/contact/page.tsx`: copy describing when to reach out, email CTA button, “What to include” checklist, optional form placeholder (copy only unless time).
- **Auth**
  - `/ops/login` remains server component. Update markup to dark background, remove “Switch to guest sign in” string, ensure back link points to `/` (still goes through new marketing home) and comprehension of `redirectedFrom`.
- **Redirects**
  - Replace `/src/app/(restaurant-partners)/partners/page.tsx` with `permanentRedirect("/")`.
  - Remove `components/restaurant-partners/*` once unused.

## Data Flow & API Contracts

Endpoint/UI interactions:

- CTA buttons and nav items link to:
  - `/ops/login` (auth page) — existing middleware already handles `redirectedFrom`.
  - `mailto:${config.email.supportEmail}` for “Talk to our team”.
  - `/contact` for enterprise CTA.
- `/partners` responds with HTTP 308 to `/` using Next’s `permanentRedirect`.
- `/ops/login` uses `getServerComponentSupabaseClient()` to detect session; ensure `redirectTarget` logic is unchanged so data flow stays the same.
  Errors: rely on existing Next error boundaries (`error.tsx`, `not-found.tsx`) plus middleware CSRF handling; no new APIs introduced.

## UI/UX States

- Loading: marketing pages are static; rely on skeleton-free content but ensure background colors render even before fonts load.
- Empty: sections degrade to stacked blocks on mobile; nav menu collapses into hamburger.
- Error: `/ops/login` retains skip link + accessible error messages via `SignInForm`; marketing CTAs degrade to accessible anchor tags.
- Success: hero + CTA emphasise console access; product/pricing/contact pages end with CTA band to capture conversions.

## Edge Cases

- Ensure marketing nav highlights active route (`usePathname` or `useSelectedLayoutSegment`) so users know location.
- When `SUPPORT_EMAIL` env is missing, fall back to `support@example.com` but still show CTA text without crashing.
- Keep `/reserve/*` and other guest pages unaffected by restructure; verify relative imports after moving directories.
- Check `redirectedFrom` query sanitization when hitting `/ops/login?redirectedFrom=/ops/bookings`.
- Responsive nav: when menu open and window resized to desktop, ensure state resets to avoid stuck overlay.

## Testing Strategy

- Unit/Component: ensure TypeScript catches prop mismatches; add basic tests if time (optional).
- Integration/manual:
  - `pnpm run typecheck` + targeted lint (at minimum `pnpm run lint` even though scope is limited) to ensure new TS/JS compiles.
  - Manual route QA (desktop + mobile) for `/`, `/product`, `/pricing`, `/contact`, `/partners`, `/ops/login`, `/reserve/:slug`.
  - Verify middleware/auth flows still redirect to `/ops/login`.
- Accessibility: keyboard nav through marketing nav + CTA buttons; ensure focus outlines visible on dark background; run quick `pnpm run lint` (will not catch a11y) then plan Chrome DevTools axe scan during verification phase.

## Rollout

- Ship as regular change (no feature flag); release after manual QA + docs update.
- Monitoring: keep eye on Next build output (run `pnpm run build` later if time) and ensure `next-sitemap` picks up new routes.
- Kill-switch: revert nav layout changes if guest flows break—documented in git so rollback is straightforward.

## Rollout

- Feature flag:
- Exposure:
- Monitoring:
- Kill-switch:
