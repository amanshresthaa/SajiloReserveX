# Research: Playwright suite hardening

## Auth & session mechanics

- Supabase auth flows rely on magic links/OAuth (`app/signin/page.tsx`) with callback that exchanges code via `app/api/auth/callback/route.ts`. No password login in UI.
- Server utilities in `server/supabase.ts` expose both service-role (`getServiceSupabaseClient`) and route handler clients (`getRouteHandlerSupabaseClient`) capable of setting auth cookies.
- No existing `/api/test/login` endpoint; tests currently require manual storage state injection (see `tests/global-setup.ts`).

## Booking & reservation APIs

- `app/api/bookings/route.ts` handles booking creation with detailed validation and loyalty hooks. Requires authenticated session + Supabase DB access.
- `app/api/bookings/[id]/route.ts` manages updates/cancellations, expects valid booking IDs and uses service client for RLS bypass.
- Reservation details page fetches bookings via server utilities (`server/reservations`).

## Stripe integration

- `app/api/stripe/create-checkout/route.ts` calls `createCheckout` from `libs/stripe.ts`, which requires real Stripe keys. No test-mode short-circuit currently.
- `config.ts` defines plan price IDs used by pricing page buttons.

## Lead capture API

- `app/api/lead/route.ts` inserts into `leads` table without auth. Deterministic responses when payload valid; no rate limiting beyond DB rules.

## Existing Playwright scaffolding gaps

- `tests/global-setup.ts` only copies storage state from env; if absent, fixtures skip without auto-bootstrap.
- E2E specs for payments/download/websocket currently rely on Playwright route mocks or placeholders rather than backend-driven flows.
- Feature flag gating: wizard spec requires `NEXT_PUBLIC_RESERVE_V2 === 'true'`; other suites gated via custom `PLAYWRIGHT_TEST_*` env checks.

## Data seeding & Supabase access

- `database/seed.sql` seeds restaurants, but no automation for creating dedicated test users/bookings.
- Service-role client can create users via `auth.admin` methods; routes can run in non-production contexts to seed deterministic fixtures.
