# Implementation Plan: Component Screenshot Capture

## Objective

Capture and store high-quality screenshots for the first two reusable marketing components (Hero + following feature module) so stakeholders can review the component catalog before scaling to the rest.

## Success Criteria

- [ ] `pnpm dev` launches locally with no blocking errors.
- [ ] Chrome DevTools MCP captures two distinct component screenshots from `http://localhost:3000/`.
- [ ] Screenshots saved under `screenshots/components/` with descriptive names and <1 MB each.
- [ ] `verification.md` documents capture details (viewport/device + confirmation of no console errors).

## Architecture & Components

- `src/app/page.tsx`: existing marketing landing page composed of `<Hero />`, `<MarketingSessionActions />`, `<RestaurantBrowser />`, etc. We'll leverage this page for the first screenshots.
- `screenshots/components/`: new folder to store evidence (parallel to existing `screenshots/ops`).
  - `hero.png`: hero section capture.
  - `features.png`: next component (MarketingSessionActions/RestaurantBrowser cluster) capture.
- No code changes expected beyond optional documentation updates if needed.

## Data Flow & API Contracts

- `pnpm dev` uses `NEXT_PUBLIC_*` env vars from `.env.local`; no network contract modifications. We simply render the landing page and capture static content.

## UI/UX States

- Hero (above the fold) – includes headline, CTA, stats; ensure screenshot includes entire component without partial cutoffs.
- Secondary module (marketing session actions or restaurant browser) – capture whichever is the next discrete component block.

## Edge Cases

- Dev server failing due to missing env – mitigated by existing `.env.local`.
- Dynamic data (e.g., RestaurantBrowser) might require Supabase data; confirm fallback placeholders render even if network fails.
- Need to ensure scroll-based lazy-loading does not hide sections; scroll via DevTools before screenshot.

## Testing Strategy

- Manual QA via Chrome DevTools MCP:
  - Verify landing page loads without console/network errors.
  - Capture hero + next component screenshot with consistent viewport.
- No automated/unit tests needed for documentation-only task.

## Rollout

- No feature flag; assets checked into repo under `screenshots/components/`.
- Future exposure: share asset preview via PR/task update; extend folder with more components per user feedback.
- Kill-switch not applicable (non-runtime change).
