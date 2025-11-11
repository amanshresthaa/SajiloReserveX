# Implementation Plan: Customer Facing Testing

## Objective

Run the full Playwright E2E coverage for every public/customer-facing journey (marketing funnel, reservation wizard, booking management, auth/profile) against the local Next dev server so we can confirm the experience still works with the latest code and environment configuration.

## Success Criteria

- [ ] Dev server launched with `NEXT_PUBLIC_RESERVE_V2=true` and stays healthy for the duration of testing.
- [ ] Playwright suites covering marketing, reservations, restaurant items, my-bookings, auth/profile, wizard, service worker offline, confirmation download, reservation detail, and payments placeholder all executed (pass/fail captured).
- [ ] Issues and skips (e.g., features behind `PLAYWRIGHT_TEST_IFRAME`) are documented with context in `verification.md`.

## Architecture & Components

- Next.js dev server (`pnpm dev`) serves as the system under test; relies on existing `.env.local` for Supabase access plus temporary overrides for Playwright toggles.
- Playwright test runner (`pnpm test:e2e`) executes specs with default multi-project matrix (Chromium, Firefox, WebKit, Mobile Chrome). Storage state produced by `tests/global-setup.ts`.
- Customer credential injection:
  - `PLAYWRIGHT_TEST_EMAIL`, `PLAYWRIGHT_TEST_PASSWORD` = `amanshresthaaaaa@gmail.com` (per user request) for UI login specs.
  - `PLAYWRIGHT_TEST_AUTH_FLOW=true`, `PLAYWRIGHT_TEST_DASHBOARD=true`, `PLAYWRIGHT_TEST_OFFLINE=true` to enable otherwise skipped flows.
- We'll keep `PLAYWRIGHT_TEST_IFRAME` disabled (feature flagged until iframe ships) but note it in verification.

## Data Flow & API Contracts

- Tests interact with `/api/restaurants`, `/api/bookings`, `/api/test/*` endpoints exposed by the dev server, using Supabase backend per `.env.local`.
- Auth session bootstrap uses `/api/test/playwright-session` (no manual credential entry) except for explicit auth flow spec using provided creds.
- Booking flows send POSTs to `/api/bookings`; confirmations retrieved from `/api/reservations/:id` and `/api/reservations/:id/download` for PDF check.

## UI/UX States

- Reservation wizard (plan/contact/confirm); mobile + desktop.
- Marketing pages `/create` and `/checkout`.
- Restaurant item detail `/item/[slug]`.
- My bookings dashboard `/my-bookings` (after login) including empty/error states if data missing.
- Profile management `/profile/manage` including avatar upload + keyboard submission.
- Auth redirect/failure states (`/signin`, redirect to `/my-bookings`).
- Offline UX banner when network drops during wizard confirmation.

## Edge Cases

- Handling of booking API failures (intentional 500 intercept in `booking-flow.spec.ts`).
- PDF download/reservation detail error handling via guarded test endpoints.
- Offline state toggling with Playwright context.
- Potential data unavailability (no restaurants) — tests already call `test.skip` with explanatory reason which we must capture if triggered.

## Testing Strategy

- E2E: Use Playwright CLI with targeted spec batches (grouped to balance runtime) while dev server is running. Collect HTML/JSON reports plus raw console output for triage.
- Accessibility: rely on assertions baked into specs (e.g., `aria-live` checks in profile avatar tests). Note any manual observations while reviewing failing tests.
- No separate unit/integration coverage executed as part of this request.

## Rollout

- No deployment; deliverables are test artifacts + summary.
- After execution, stop the dev server process and archive `playwright-report` for reference.
