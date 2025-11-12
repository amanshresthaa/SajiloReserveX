# Research: Restaurant Landing Longform

## Requirements

- Functional:
  - Deliver one long-form, public landing page for restaurant partners (overview → proof → pricing → FAQ → CTA).
  - Navigation/CTA elements must link exclusively to restaurant (ops) entry points (e.g., `/ops/login`, request-access mailto).
  - Auth prompts for guests (`/signin`, `/create`) must not appear anywhere on this page.
  - Highlight differentiators pulled from repo context (live availability, team tools, analytics) using compelling sections.
  - Revamp the root homepage (`/`) so it mirrors the restaurant-focused story while reusing the same sections for consistency.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Reuse existing typography/spacing tokens; keep layout responsive and WCAG AA accessible.
  - Keep bundle lean (static content + minor client interactivity only).
  - No secrets or environment-specific data in markup; page should be static export friendly.

## Existing Patterns & Reuse

- `components/customer/navigation/CustomerNavbar.tsx` – current public layout nav is guest-focused (links to `/browse`, `/signin`). We will **not** reuse it for the restaurant landing, but we can mirror its responsive structure for a new `RestaurantNavbar`.
- `src/app/(restaurant-partners)/page.tsx` now owns the homepage, reusing the shared `RestaurantLandingPage` component so `/` and `/partners` stay identical.
- `components/marketing/MarketingSessionActions.tsx` – auth-aware CTA logic already drives guest vs account states. Extending it with a new `"restaurant"` mode lets us reuse styling while routing to `/ops/login` and `/ops/onboarding` links.
- Marketing primitives (`components/ButtonGradient`, `Problem`, `FeaturesAccordion`, `Testimonials*`, `CTA`, etc.) can inspire layout spacing, typography, and UI tokens so the new page feels consistent even if we write fresh JSX.
- `components/ui/*` (Button, Card, Badge, Skeleton, etc.) – shadcn-kit already configured; ideal for info/timeline sections without reinventing styles.
- Ops auth entry point at `src/app/(ops)/ops/(public)/login/page.tsx` gives us the canonical URL & copy tone for restaurant CTAs.

## External Resources

- `COMPLETE_ROUTE_MAP.md` & `route-map.json` – confirms `/ops/login` and `/ops` flows so we can link accurately and describe funnel states without spelunking all code paths.
- `VISUAL_ARCHITECTURE.md` – documents how marketing vs. app shells are composed; keeps us aligned with typography/spacing tokens.

## Constraints & Risks

- `src/app/(guest-public)/layout.tsx` injects `CustomerNavbar`, so any page placed there will inherit guest auth cues. Restaurant landing must live in its own route group/layout to keep auth separation.
- Removing/replacing the current guest homepage means we need to ensure no other routes import it directly and that tests referencing copy are updated (none discovered yet, but worth confirming post-change).
- Marketing copy/components like `Problem.tsx` reference unrelated SaaS examples (ShipFast). We need new restaurant-specific content to avoid messaging mismatch.
- CTAs must not mix `/signin` (guest) with `/ops/login` (restaurant). We have to ensure shared components (e.g., `MarketingSessionActions`) can’t accidentally fall back to guest routes.
- Page must remain static/SSR friendly—no heavy client data fetching to keep performance budgets intact.

## Open Questions (owner, due)

- None yet.

## Recommended Direction (with rationale)

- Create a dedicated route group (e.g., `src/app/(restaurant-partners)/partners/page.tsx`) with its own layout that renders a `RestaurantNavbar` + targeted footer, ensuring guest nav never appears.
- Build bespoke sections (Hero, Stats, Feature blocks, Operations timeline, Social proof, Pricing, FAQ, CTA) using shadcn primitives and marketing gradients already present in the repo so visual language stays cohesive.
- Extend `MarketingSessionActions` with a new `mode="restaurant"` that maps to `/ops/login` for authenticated restaurants and `/ops/login?redirect=/ops` + `/ops/login?redirect=/ops/join` (or mailto) for secondary CTAs. This reuses styling while guaranteeing separate auth flows.
- Keep the page static/async-light by hardcoding content arrays; no need to fetch restaurants list here.
- Reuse the same React component tree for both `/` and `/partners` so the experience stays identical while letting us iterate once.
