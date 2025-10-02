# Research: Playwright strategy

## Repository Overview

- Monorepo-style Next.js 13 App Router project at root `app/`.
- `/reserve` flow toggled by `NEXT_PUBLIC_RESERVE_V2`; legacy React booking flow under `components/reserve/booking-flow`, new feature-sliced app under `reserve/` workspace (Vite). 【F:README.md†L3-L37】
- Reserve app structure emphasises feature-sliced architecture (`reserve/app`, `features`, `shared`, etc.). 【F:README.md†L21-L36】
- Playwright currently configured minimally (`playwright.config.ts`) pointing to `reserve/tests/e2e` with three placeholder specs (profile redirect, wizard validations, smoke). 【F:playwright.config.ts†L1-L8】【F:reserve/tests/e2e/wizard.plan.spec.ts†L1-L21】【F:reserve/tests/e2e/reserve.smoke.spec.ts†L1-L7】【F:reserve/tests/e2e/profile.manage.spec.ts†L1-L9】

## Key Domains & Flows

- **Reservation wizard**: multi-step flow with plan, details, review, confirmation. Steps use `WizardFooter`, `WizardProgress`, `PlanStep`, `DetailsStep`, `ReviewStep`, `ConfirmationStep`. Requires interactions with date picker, time slots, contact details, booking submission. 【F:reserve/features/reservations/wizard/ui/steps/PlanStep.tsx†L1-L43】【F:reserve/features/reservations/wizard/model/reducer.ts†L1-L159】
- **Shared config/env**: `reserve/shared/config/env.ts` enforces runtime env (API base URL, timeouts, router base path). Important for baseURL and route building. 【F:reserve/shared/config/env.ts†L1-L64】
- **API client**: `reserve/shared/api/client.ts` wraps fetch with JSON parsing, error normalization, timeouts, credentials include. 【F:reserve/shared/api/client.ts†L1-L59】
- **Booking/time utilities**: `reserve/shared/time` and `wizard/services/timeSlots.ts` compute slot availability, service windows, etc. indicates key logic requiring deterministic data for tests. 【F:reserve/features/reservations/wizard/services/timeSlots.ts†L1-L120】
- **Profile management**: `/profile/manage` route with Supabase integration, file uploads, validations. Documented in `docs/profile-management.md`. Likely critical for auth & file upload testing. 【F:docs/profile-management.md†L1-L55】
- **Config & payments**: `config.ts` includes Stripe plan IDs, Crisp, etc. indicates existence of checkout flows, though actual components not yet inspected.

## Existing Testing Stack

- Vitest + Testing Library for unit/integration tests under `reserve/tests/unit` etc.
- Playwright minimal scaffolding; E2E tests apparently run via `pnpm test:e2e` per README. Need to integrate with Next dev server/reserve dev server.
- Additional test infrastructure: `reserve/tests/setup-tests.ts` (Vitest). Playwright storage state not configured.

## Environments & Auth

- Login route at `/signin`, callback `/`. Config indicates Crisp support, Stripe. Auth likely uses Supabase or NextAuth; need more inspection but we know `/profile/manage` is protected. Middleware ensures redirect. File uploads to Supabase Storage. Tests must handle Supabase auth or mock.
- Reserve API base default `/api`; toggles for real backend by env variables. Without external API we might use mock server (MSW). Need to determine how to stub for Playwright.

## Build/Serve Scripts

- `pnpm dev` runs Next dev server. `pnpm reserve:dev` for Vite reserve app. E2E likely uses Next server at 3000. Should plan to start Next server in CI before tests.

## Observed Gaps

- No global fixtures, no data seeding, no authentication helpers for Playwright.
- env requires `BASE_URL` for wizard spec to run. Tests currently skip if baseURL absent.
- Need strategy for toggling feature flag `NEXT_PUBLIC_RESERVE_V2`.
- Need test IDs/test-friendly selectors across wizard and components. Many accessible roles available (buttons, headings). Should ensure new tests use `getByRole` etc.

## Additional Items to Inspect (TODO during planning)

- Identify API routes under `app/api` for profile, booking, etc.
- Check `reserve/pages` for React Router routes (wizard path?).
- Evaluate presence of MSW or server mocks for tests.
