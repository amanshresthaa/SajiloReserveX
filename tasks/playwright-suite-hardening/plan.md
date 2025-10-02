# Plan: Hardening Playwright suites

## Goals

1. Automate creation of reusable storage state for Playwright by exposing a secure test-only API and enhancing `global-setup`.
2. Support incremental suite enabling through documented env toggles + sensible defaults (`NEXT_PUBLIC_RESERVE_V2`, `PLAYWRIGHT_TEST_*`).
3. Replace per-test route mocks for payments/lead/download/websocket with backend-driven flows (or realistic fallbacks) and let specs run by default.

## Steps

1. **Test session API**
   - Add `/api/test/playwright-session` route (guarded against production) that upserts a Supabase user via service client and signs in via route handler to set auth cookies.
   - Allow optional profile seed payload; return user metadata + seeded profile fields for verification.

2. **Global setup integration**
   - Update `tests/global-setup.ts` to call the new route when no storage state file supplied; save storage via Playwright request context.
   - Support config-driven auth identity via env (`PLAYWRIGHT_AUTH_EMAIL`/`PASSWORD`) with safe defaults; log helpful warnings when baseURL missing.

3. **Backend fixtures & env toggles**
   - Extend `libs/stripe.ts` (and `app/api/stripe/create-checkout/route.ts` as needed) to short-circuit when `STRIPE_MOCK_MODE=true`, returning deterministic checkout URL.
   - Add test-only API for deterministic reservation confirmation asset (download) and websockets fallback (e.g., queue events via SSE/polling) or adjust tests to exercise real accessible flows (e.g., reservation details updates) without mocking.
   - Provide script/route to create sample booking data for tests (creates booking + returns IDs) to drive download/detail assertions.
   - Update documentation (`tests/README.md`) describing env toggles and how to enable suites progressively.

4. **Spec revisions**
   - Remove Playwright route intercepts; rely on backend responses (which use new mock mode envs).
   - Replace placeholder download/websocket specs with flows powered by deterministic fixtures (e.g., fetch seeded booking detail, poll test event endpoint) and drop `PLAYWRIGHT_TEST_*` skips unless necessary.
   - Ensure specs tag smoke appropriately and leverage new seeds (e.g., create booking via API before running UI assertions).

5. **Validation**
   - Run `pnpm playwright test --list` to confirm suites discoverable with new defaults.
   - Document required env vars `.env.playwright` example for CI/local.
