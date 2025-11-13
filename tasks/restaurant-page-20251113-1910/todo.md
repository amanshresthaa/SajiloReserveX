---
task: restaurant-page
timestamp_utc: 2025-11-13T19:16:30Z
owner: github:@codex-bot
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Confirm route placement under `(guest-public)/(guest-experience)`.
- [x] Create `/restaurant` route files + metadata alignment.

## Core

- [x] Build typed fetch helper for `/api/v1/restaurants` (handles filters, abort, errors). _Reused `lib/restaurants/api.ts` + React Query integration._
- [x] Implement `RestaurantDirectory` client component with search state + debounced fetch. _Reused the existing `RestaurantBrowser` client with server-prefetched data._
- [x] Render responsive card grid w/ CTA to `/reserve/r/[slug]` and timezone/capacity labels.
- [x] Provide loading skeleton, empty, and error UI with retry (handled by `RestaurantBrowser`).

## UI/UX

- [x] Ensure accessible headings, focus management, `aria-live` for status.
- [x] Mobile responsive layout (1 col) + larger breakpoints.
- [x] Add SEO metadata + canonical description.

## Tests

- [~] Unit tests for fetch helper/hook. _Covered by existing `reserve/tests/features/restaurant-browser.test.tsx`; added server-page hydration test instead._
- [x] Component test verifying rendering states. _`tests/server/restaurant-page.test.tsx` ensures hero + error state are wired._
- [ ] Axe/keyboard smoke (manual if automated not feasible).

## Notes

- Assumptions: direct link to `/reserve/r/[slug]` suffices for booking.
- Deviations: N/A yet.

## Batched Questions

- Need confirmation re: `/restaurant` vs `/restaurants` naming.
