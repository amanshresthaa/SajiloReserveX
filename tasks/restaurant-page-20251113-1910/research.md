---
task: restaurant-page
timestamp_utc: 2025-11-13T19:12:40Z
owner: github:@codex-bot
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Restaurant Discovery Page

## Requirements

- Functional: create a `/restaurant` (or `/restaurants`) guest experience page where visitors can browse partner restaurants and initiate a booking. Surface restaurant name, location/timezone (if available), capacity, and a primary action linking into the existing Reserve flow (`/reserve/r/[slug]`). Include lightweight filtering/search so guests can find venues quickly.
- Non-functional: page must align with marketing/guest layout (`(guest-public)/(guest-experience)`), be responsive, meet accessibility rules (focus order, semantic headings/buttons), and reuse existing API/data contracts instead of inventing new ones. Loading state should be obvious; empty/error states must not block navigation. Server actions should remain cache-friendly for SSR and respect `force-dynamic` if data needs freshness.

## Existing Patterns & Reuse

- Data source: `src/app/api/restaurants/route.ts` proxies `server/restaurants/listRestaurants.ts`, exposing search, timezone, and capacity filters returning `RestaurantSummary` records (id, name, slug, timezone, capacity). We can call `/api/v1/restaurants` or `/api/restaurants` from the client via SWR/React Query or fetch with `useEffect`.
- Reserve entry: `src/app/(guest-public)/(guest-experience)/reserve/page.tsx` renders `ReserveApp`, which syncs URL state and mounts `ReserveRouter`. Linking to `/reserve/r/[slug]` currently deep-links to the slug-specific booking wizard and is the recommended CTA in docs such as `DEMO_RESTAURANT_QUICK_REF.md`.
- Layout wrappers: guest marketing experiences typically live under `(guest-public)/(guest-experience)` with `layout.tsx` providing fonts, shell, and `<main>` semantics we can hook into.
- UI primitives: `components/ui` includes `Card`, `Button`, `Badge`, `Skeleton`, etc. Tailwind config already loaded; prefer Shadcn-derived components to stay consistent.

## External Resources

- [COMPLETE_ROUTE_MAP.md](COMPLETE_ROUTE_MAP.md) — enumerates guest routes and confirms `/browse` currently redirects to `/`. We can replace that redirect or add a new `/restaurant` route per instructions.
- [docs/table-assignment-business-rules.md](docs/table-assignment-business-rules.md) — explains why `/reserve/r/[slug]` is the canonical booking entrypoint.

## Constraints & Risks

- Supabase is remote-only; we must not introduce server components that mutate data during listing. Read-only fetch through the REST API is acceptable.
- Restaurant dataset could be large, so we should paginate or virtualize if necessary; at minimum, we must guard against long lists causing layout shifts (reserve image aspect ratio, use Skeleton placeholders).
- Accessibility: ensure headings follow hierarchy, cards are focusable if interactive, CTA buttons provide descriptive labels (“Book at {name}”).
- SEO: marketing path should be statically optimized if possible, but data freshness may require `force-dynamic`. Need to confirm caching strategy.
- Without final design, we must avoid over-engineering. Keep to simple cards plus filters until requirements evolve.

## Open Questions (owner, due)

- Should the page URL be `/restaurant` as requested or `/restaurants` to match plural resource? (owner: @codex-bot, due ASAP).
- Are hero content and imagery required, or is a simple list sufficient? (pending design input).
- Do we need filtering beyond search/min capacity/timezone? (default to search-only unless product requests otherwise).

## Recommended Direction (with rationale)

- Implement a new page under `src/app/(guest-public)/(guest-experience)/restaurant/page.tsx` (or rename existing `/browse`). Server Component loads restaurant summaries via `listRestaurants` helper or fetch to `/api/restaurants` so SSR works. Provide client-side search input debounced with React state to avoid excessive calls. Render a grid of cards using Shadcn `Card`, including name, timezone, capacity, and `Link` to `/reserve/r/[slug]` with a `Button`. This approach reuses existing API, keeps Reserve experience unchanged, and remains accessible/responsive. Document states (loading, empty, error) and integrate tests (React Testing Library) around data fetching logic.
