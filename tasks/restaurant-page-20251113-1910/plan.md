---
task: restaurant-page
timestamp_utc: 2025-11-13T19:15:05Z
owner: github:@codex-bot
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Restaurant Discovery Page

## Objective

Enable guests to browse SajiloReserveX partner restaurants from a dedicated `/restaurant` page and jump into booking for any venue.

## Success Criteria

- [ ] `/restaurant` page renders within `(guest-public)/(guest-experience)` shell.
- [ ] Page lists restaurant summaries fetched from existing API.
- [ ] Each card includes a CTA linking to `/reserve/r/[slug]`.
- [ ] Search/filter interactions provide loading/empty/error feedback.
- [ ] Axe/keyboard checks pass (focusable controls, headings, meaningful link text).

## Architecture & Components

- `src/app/(guest-public)/(guest-experience)/restaurant/page.tsx`: Server Component orchestrating data fetch + metadata.
- `RestaurantDirectory` client component (new) handles search input, client-side filtering, and fetch state (SWR or custom hook).
- UI primitives: reuse Shadcn `Input`, `Button`, `Card`, `Badge`, `Skeleton`, `Alert` (already in `components/ui`).
- `lib/restaurants/client.ts` helper (new) for typed fetch of `/api/v1/restaurants` returning `RestaurantSummary[]`.

State: search text, debounce, network status (idle/loading/error), list data. URL state optional via query params (future). Initially local state.

## Data Flow & API Contracts

Endpoint: `GET /api/v1/restaurants?search=foo&minCapacity=2` (existing). Response `{ data: RestaurantSummary[] }`.

Client: call via `fetch` (NEXT_PUBLIC base) using `useEffect` triggered by search/debounce. Provide abort controller to prevent race conditions.

Errors -> show inline alert with retry button.

## UI/UX States

- Loading (initial request & on search) -> skeleton cards.
- Empty -> illustration text “No restaurants match your filters”.
- Error -> alert with retry.
- Success -> responsive grid (1 col mobile → 2 +). Buttons accessible.

## Edge Cases

- API throttling/timeouts -> show error state; allow retry.
- Duplicated slugs -> tidy by keying on `id`.
- Null capacity/timezone -> handle gracefully (“Capacity TBD”).

## Testing Strategy

- Unit: test fetch helper & hook (mock fetch) ensuring query string built and errors thrown.
- Component: React Testing Library for `RestaurantDirectory` verifying loading -> success -> CTA link target.
- Accessibility: run `@testing-library/jest-dom` + `axe`? (maybe lighten). At minimum, ensure semantics & `aria-live` for status.

## Rollout

- Feature flag: not needed initially; page only accessible via URL.
- Deployment: Next.js static asset; verify via `pnpm run build`.
- Tracking: optionally log to existing analytics later.

## DB Change Plan (if applicable)

Not applicable (read-only API reuse).
