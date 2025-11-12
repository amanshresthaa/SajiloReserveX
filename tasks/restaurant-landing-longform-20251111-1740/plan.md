# Implementation Plan: Restaurant Landing Longform

## Objective

We will launch a single long-form landing page at `/partners` that speaks to restaurant operators, highlights SajiloReserveX’s ops value props, and routes every CTA to the restaurant-only auth/onboarding flow—then reuse the exact experience for the homepage (`/`) so every visitor sees the restaurant story first.

## Success Criteria

- [ ] `/partners` renders a complete story (hero → proof → features → pricing → FAQ → CTA) with copy aimed at restaurant partners.
- [ ] `/` mirrors the same experience (same sections, nav, CTAs) so we only maintain one marketing narrative.
- [ ] All buttons/links on these pages route to ops endpoints (`/ops/login`, `mailto:partnerships@…`, etc.); no guest `/signin` links remain.
- [ ] Layout passes axe/Lighthouse accessibility checks (proper headings, aria labels, focus order) and stays responsive from 360px → desktop.

## Architecture & Components

- Route group: `src/app/(restaurant-partners)/`
  - `layout.tsx`: wraps page with `RestaurantNavbar` + `Footer` so guest navbar is excluded.
  - `page.tsx`: homepage root using the restaurant landing component.
  - `partners/page.tsx`: re-export(s) the same landing component for the `/partners` vanity URL.
- Components:
  - `RestaurantNavbar`: lightweight nav with anchors (Overview, Platform, Pricing, FAQ) plus CTA button(s) -> `/ops/login`.
  - `RestaurantLandingPage` component encapsulates all sections so `/` and `/partners` simply render it.
  - `RestaurantHero`: hero w/ tagline, stat chips, CTA stack using `MarketingSessionActions` (new `mode="restaurant"`).
  - `ImpactMetrics`, `OpsWorkflow`, `FeatureGrid`, `Testimonials`, `PricingTiers`, `FAQAccordion`, `FinalCTA`. Each uses static data arrays + shadcn `Card`, `Badge`, `Accordion`.
  - `MarketingSessionActions` enhancement: add `"restaurant"` mode mapping to ops auth links and remove reliance on guest session state (still uses supabase hook to detect logged-in operator to show “Go to Ops Console”).

## Data Flow & API Contracts

- Page is static: no API calls. Data lives in local arrays describing features, metrics, quotes, FAQ entries, pricing tiers.
- `MarketingSessionActions`:
  - Determine auth status via `useSupabaseSession` (already available).
  - For `mode="restaurant"`:
    - Authenticated → primary CTA `/ops`, secondary `/ops/team`.
    - Unauthenticated → primary CTA `/ops/login`, secondary `mailto:partners@{supportDomain}` or `/ops/login?redirect=/ops/onboarding`.
  - No new HTTP endpoints required.

## UI/UX States

- Hero: shows stat badges; CTA stack includes descriptive aria labels; background gradient similar to existing hero.
- Feature Sections: alternating backgrounds to break monotony; cards highlight live availability, pacing controls, multi-location support.
- Ops Workflow Timeline: vertically stacked steps with icons & accessible description list.
- Pricing: two cards (Starter vs. Enterprise) with CTA buttons to either “Start now” (ops login) or “Talk to us” (mailto).
- FAQ: accordion (shadcn) with keyboard support.
- Final CTA band: large gradient, final push to `/ops/login`.

## Edge Cases

- Auth detection: `MarketingSessionActions` already handles `loading` vs `ready`. Ensure new mode gracefully handles SSR (component is client-side).
- Mailto fallback: if support email missing, default to `support@example.com`.
- Anchors (#overview, #platform, etc.) must match nav links for skip-to-section.

## Testing Strategy

- Unit-ish: rely on TypeScript + lightweight tests? (Optional) add React Testing Library test for `MarketingSessionActions` new mode to validate CTA hrefs.
- Manual verify `/partners` on mobile/desktop, ensure nav anchors scroll, CTAs correct.
- Accessibility scan via axe / DevTools.
- Optional Playwright smoke to confirm `/partners` loads 200 and contains hero text (also implicitly covers `/`).

## Rollout

- No feature flag; route is public.
- Deploy behind standard CI.
- After merge, add link from ops login or marketing nav if needed (future task).
