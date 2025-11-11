# Research: Customer Facing Testing

## Requirements

- Functional:
  - Execute the existing Playwright E2E coverage that exercises every customer-facing journey (marketing pages, public reservation flow, confirmation pages, profile management, customer auth, my-bookings, restaurant item pages, wizard plan step, reservation detail/confirmation download, payments placeholder).
  - Use the provided customer credentials (`amanshresthaaaaa@gmail.com` for both email/password) wherever tests require an interactive login (e.g. `tests/e2e/profile/auth-session.spec.ts`).
  - Capture and summarize pass/fail results plus any defects observed.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Respect existing Playwright multi-project matrix (Chromium, Firefox, WebKit, mobile Chrome) to mirror cross-browser coverage expected for customer UIs (`playwright.config.ts`).
  - Keep secrets (API keys, Supabase URLs) inside env vars; do not commit credentials.
  - Ensure test data seeding happens only through the provided `/api/test/*` helpers guarded by `TEST_ROUTE_API_KEY` (`server/test-api.ts`).

## Existing Patterns & Reuse

- Playwright suite already organized under `tests/e2e/**`, with customer-centric specs in `reservations`, `marketing`, `my-bookings`, `profile`, `auth`, `restaurant-item`, `wizard`, `service-worker`, and `payments`.
- Authenticated fixtures rely on storage state generated during `tests/global-setup.ts`, which in turn can bootstrap a session via `/api/test/playwright-session` when `PLAYWRIGHT_AUTH_*` env vars are set.
- Helper selectors for wizard/profile flows live in `tests/helpers/selectors.ts` and should be leveraged indirectly by the tests already written (no new code required).
- Reports automatically emitted to `playwright-report` (HTML + JSON) and component-level to `playwright-component-report` if we run complementary suites.

## External Resources

- `tests/e2e/E2E_TEST_COVERAGE_SUMMARY.md` — documents historical pass/fail state so we can compare regressions and prioritize flaky areas.
- `REMOTE_ONLY_SETUP.md` — reiterates that Supabase + env configuration must point at the shared remote instance; confirms we should not stand up local Supabase.

## Constraints & Risks

- `.env.local` currently lacks the `TEST_ROUTE_API_KEY`, `PLAYWRIGHT_TEST_API_KEY`, and other Playwright-specific env vars, so we must inject them inline when running dev server/tests to avoid forbidden responses from the guarded `/api/test/*` endpoints.
- Customer reservation specs (`tests/e2e/reservations/booking-flow.spec.ts`) require `NEXT_PUBLIC_RESERVE_V2=true` (React wizard); failing to set it will hard skip the suite.
- Several specs depend on live restaurant records in Supabase (e.g. hitting `/api/restaurants`), so if the remote dataset is empty tests will self-skip — need to note any resulting coverage gaps.
- Tests that mutate bookings could pollute shared data if cleanup fails; rely on provided DELETE endpoints and ensure serial execution where necessary.
- Running the full suite across four Playwright projects will be time-consuming but necessary to satisfy “all possible customer-facing testing.”

## Open Questions (owner, due)

- Q: Should operations/ops-panel specs also run given they are technically customer-support facing?  
  A: Assuming “customer facing” strictly means end-customer journeys, we will exclude `tests/e2e/ops/**`, `analytics`, and `invitations` unless requested otherwise.
- Q: Is it acceptable to use the supplied email/password for `PLAYWRIGHT_TEST_EMAIL/PASSWORD` in addition to any seeded QA accounts?  
  A: Yes — user explicitly provided credentials for this task; we will scope them to the auth-session test only.

## Recommended Direction (with rationale)

- Start a local Next.js dev server that reads the existing `.env.local` plus overrides (`NEXT_PUBLIC_RESERVE_V2=true`, `TEST_ROUTE_API_KEY=<same as PLAYWRIGHT_TEST_API_KEY>`, `PLAYWRIGHT_TEST_API_KEY=<value>`) so guarded APIs allow test data seeding.
- Export `PLAYWRIGHT_TEST_AUTH_FLOW=true`, `PLAYWRIGHT_TEST_EMAIL`, and `PLAYWRIGHT_TEST_PASSWORD` (user-provided) before invoking `pnpm test:e2e` with targeted spec globs for the customer modules; this reuses the entire, battle-tested E2E harness without inventing new flows.
- Capture Playwright HTML/JSON reports and summarize per-spec pass/fail outcomes in `verification.md`, highlighting any regressions relative to the baseline summary document.
