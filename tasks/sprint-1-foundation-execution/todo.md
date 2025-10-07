# Sprint 1 To‑Do Checklist

> Derived from `plan.md`. Update as tasks progress.

## Sprint Operations

- [x] Create sprint tracker (`tracker.md`) with standup template & story swimlane.
- [x] Verify environment (Node 20.11+, pnpm 9+, Supabase CLI) and run `pnpm validate:env`.
- [x] Audit CI workflows; ensure lint/typecheck/test/build wired.

## US-001 — Booking Discovery Flow

- [x] Implement `useRestaurants` hook with React Query + API client.
- [x] Build `/` page loader supplying initial restaurant data.
- [x] Extend `RestaurantBrowser` for filters, skeleton, empty/error states.
- [x] Instrument analytics (`restaurant_list_viewed`, CTA events).
- [x] Add Vitest coverage (filters + error states).
- [x] Add Playwright mobile scenario for filtering & CTA.

## US-002 — Booking Wizard Steps 1–4

- [x] Audit existing wizard wiring in Next app; ensure SPA mounts correctly.
- [x] Align wizard fixtures and query hydration for tests.
- [x] Implement Plan step UI (calendar, party selector, time grid).
- [x] Ensure Details step validation UX matches spec (placeholders, focus).
- [x] Finalise Review step summary + analytics.
- [x] Hook Confirmation mutation with optimistic UI.
- [x] Add Vitest coverage for new logic (analytics, validation, DI).
- [ ] Add Playwright flow completing booking <2 mins (mobile + desktop).

## US-003 — Booking Confirmation Page

- [ ] Implement server loader for `/reserve/[reservationId]`.
- [ ] Inject JSON-LD + ensure SSR hydration props.
- [ ] Verify analytics emissions + offline handling.
- [ ] Add Vitest + Playwright tests (share CTA, offline message).

## US-004 — Dashboard Bookings Table

- [ ] Guard `/dashboard` via middleware + Supabase session.
- [ ] Build dashboard UI (mobile cards + desktop table).
- [ ] Integrate cancel dialog with optimistic rollback & analytics.
- [ ] Add Vitest coverage + Playwright scenario.

## US-005 — Profile Management

- [ ] Implement profile query + form prefill.
- [ ] Wire update mutation with idempotency + analytics.
- [ ] Handle avatar upload errors (toast + aria-live).
- [ ] Add Vitest validation tests + Playwright keyboard flow.

## US-006 — Wizard QA & Offline

- [ ] Add wizard offline banner + analytics.
- [ ] Ensure loading skeleton parity + optimistic states.
- [ ] Track failure analytics (e.g., `booking_cancel_error`).
- [ ] Add Vitest + Playwright offline simulation.

## US-007 — Auth Flow & Guards

- [ ] Implement Supabase server client + middleware session checks.
- [ ] Protect routes (`/dashboard`, `/profile`, wizard post-confirmation).
- [ ] Build `/signin` UI with RHF + shadcn components.
- [ ] Support magic link/password flows; add tests (Vitest + Playwright).

## Stretch — US-008 & US-009

- [ ] `/blog` index + article layout w/ breadcrumbs + metadata.
- [ ] Extend analytics union + consent gating (`NEXT_PUBLIC_ANALYTICS_CONSENT`).
- [ ] Add tests ensuring consent gating behaviour.

## US-010 — Demo & Docs

- [ ] Storybook docs for Button, Input, Card, Form.
- [ ] Update `README.md` setup steps (Supabase, scripts).
- [ ] Prepare demo script + retrospective notes in tracker.
