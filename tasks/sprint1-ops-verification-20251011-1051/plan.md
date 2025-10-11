# Implementation Plan: Sprint 1 Ops Verification

## Objective

Deliver comprehensive automated and manual verification for the Ops console core flows (auth → dashboard → bookings CRUD → customer export → email side-effects) so Sprint 1 exit criteria are satisfied and regression risk is minimized.

## Success Criteria

- [ ] All verification tasks V-AUTH-01 through V-JOBS-01 covered by automated tests (Vitest or Playwright) or documented manual checks.
- [ ] Playwright suite achieves ≥90% coverage across core Ops journeys (tracked via scenario count + Lighthouse accessibility checks).
- [ ] New tests execute successfully via `pnpm test` and `pnpm test:e2e` in CI without flakiness.
- [ ] Manual QA via Chrome DevTools validates key UI states and accessibility.
- [ ] Documentation (verification.md) summarizes outcomes, defects, and follow-up actions.

## Architecture & Approach

### Verification Strategy by Workstream

1. **Workstream A (Auth & Access)**
   - Unit tests for `fetchUserMemberships` / `requireMembershipForRestaurant` using Supabase client mocks to simulate role matrices.
   - API route integration tests (Vitest + Next route handler harness) covering unauthenticated, no membership, insufficient role, and success cases.
   - Playwright scenarios verifying SSR redirects (`/ops` → `/signin`) and logout cookie invalidation.
2. **Workstream B (Dashboard & Navigation)**
   - Service-level unit tests for `getTodayBookingsSummary` & `computeCalendarRange` with deterministic fixtures.
   - Component snapshot or accessibility tests for `TodayBookingsCard` & `AppSidebar` active states.
   - Playwright flows covering date query parameter validation, timezone display, keyboard navigation, and support link accessibility.
3. **Workstream C (Bookings CRUD)**
   - Unit tests for helper functions (`deriveEndTime`, `buildBookingAuditSnapshot`, idempotency logic) and API route behaviour.
   - Playwright end-to-end chain: create walk-in → verify list filters → update → mark status → cancel (plus audit & email assertions via mailbox fixture or job spy).
4. **Workstream D (Customers & Export)**
   - Unit tests for `getCustomersWithProfiles` paginated response, CSV generator (golden file).
   - Playwright scenario to trigger export download and validate metadata (filename, BOM).
5. **Workstream E (Emails & Side-effects)**
   - Unit tests for `processBooking*SideEffects` functions (stubbing email/analytics) verifying idempotency and payload handling.
   - Email template snapshot tests for confirmation/update/cancellation variants.
   - Integration test ensuring Inngest function registration (via `server/queue/inngest.ts`).

### Alternative Approaches Considered

- **Live Supabase integration tests** rejected due to remote-only constraint and risk of mutating production data.
- **Contract testing via MSW** considered for Playwright but deferred; instead, rely on seeded data + Supabase mock clients for deterministic unit tests.
- **Full API mocking in Playwright** avoided to maintain end-to-end fidelity; use controlled seed fixtures instead.

## Component/Test Suite Breakdown

| Area                 | Planned Artifact                                                     |
| -------------------- | -------------------------------------------------------------------- |
| Auth utilities       | `tests/server/auth/requireMembership.test.ts` (Vitest)               |
| Ops SSR routing      | `tests/app/ops-auth-redirect.test.tsx` (component/server test)       |
| Dashboard summaries  | `tests/server/ops/getTodayBookingsSummary.test.ts` (extend existing) |
| Sidebar UI           | `tests/component/ops/AppSidebar.test.tsx`                            |
| Bookings API         | `tests/server/ops/bookings-route.test.ts` + supporting factories     |
| Bookings helpers     | `tests/server/ops/bookings-utils.test.ts`                            |
| Playwright Ops suite | `tests/e2e/ops/{auth.spec.ts, bookings.spec.ts, customers.spec.ts}`  |
| Customer export      | `tests/server/ops/customers-export.test.ts`                          |
| Email templates      | `tests/emails/bookings/*.test.ts`                                    |
| Side-effect jobs     | `tests/server/emails/booking-side-effects.test.ts`                   |

## Data Flow & Test Fixtures

- **Unit tests**: use synthetic data objects mirroring Supabase schema (Types from `@/types/supabase`). Provide factory helpers (`tests/helpers/factories/ops.ts`) to avoid duplication.
- **Playwright**: rely on global setup to create Ops staff user + restaurant (inspect `tests/global-setup.ts`). If missing, introduce test hook that seeds via Supabase admin API or mocks via backend stub route.
- **Emails**: stub out `sendBooking*Email` dependencies using `vi.mock('@/server/emails/bookings')` for job tests; for template tests, use actual functions with fixture data and compare sanitized HTML.

## API Contracts to Validate

- `GET /api/ops/bookings`: query params (status, from, to, sort, page, pageSize); expect 403 without membership, 200 with filtered payload.
- `POST /api/ops/bookings`: request payload from `opsWalkInBookingSchema`; response includes `booking`, `bookings`, `idempotencyKey`, `clientRequestId`.
- `PATCH /api/ops/bookings/:id`: validated update payload; rejects invalid times and unauthorized roles.
- `PATCH /api/ops/bookings/:id/status`: accepts status `completed | no_show`; idempotent response.
- `DELETE /api/ops/bookings/:id`: returns `{ id, status }`; ensures audit + side effects triggered.
- `GET /api/ops/customers`: pagination, sort order, membership enforcement.
- `GET /api/ops/customers/export`: CSV response headers, BOM, filename format.

## UI/UX & Accessibility Considerations

- Ensure Playwright checks focus order inside sidebar, keyboard navigation, and support link (mailto) presence.
- Validate responsive layout by executing tests in both default and `mobile-chrome` Playwright projects.
- For dashboard cards, verify loading, empty, and error states (simulate API failure).

## Testing Strategy & Tooling

- Extend Vitest coverage with new suites using `vi.mock` for Supabase clients.
- Configure Playwright Ops suite with tags to track coverage (`@ops-core`, `@ops-auth`).
- Leverage snapshot testing for CSV and email outputs; store golden files under `tests/__snapshots__` or inline depending on repo conventions.
- Introduce job spy utilities to capture Inngest event `id` usage and retry behavior.

## Edge Cases & Negative Paths

- Invalid/empty `?date` query fallback to today; timezone mismatch scenarios.
- Idempotency keys with whitespace/invalid UUID; ensure system generates new `clientRequestId`.
- Booking updates where `endIso <= startIso` to assert 400 response.
- Customer export when restaurant has zero customers (returns header row only).
- Email side-effects when customer email blank (should skip sending but still log analytics).
- Logout while jobs in flight—verify session cookies revoked.

## Rollout Plan

1. **Test Harness Prep**: build fixture utilities and Supabase client mocks; configure env toggles (`IS_ASYNC_QUEUE_ENABLED=false`).
2. **Unit Test Implementation**: tackle Workstreams A, B, D, E functions with Vitest suites; update exports if needed for testability.
3. **Playwright Ops Suite**: script login helper, add sequential scenarios covering Workstreams A–D; include email assertions if supported by test mailbox.
4. **Refinement & Flake Hardening**: run tests repeatedly (`pnpm test:e2e --repeat-each=2`) to ensure stability; adjust timeouts.
5. **Documentation & QA**: execute Chrome DevTools manual checks, capture evidence in `verification.md`.
6. **Final Review**: ensure lint/typecheck unaffected, summarize coverage gains.

## Risk Mitigation

- Mock Supabase network calls to avoid remote mutation (aligns with remote-only constraint).
- Wrap Playwright data setup in try/finally to clean state when possible.
- Capture logs for background job tests to confirm retries & fallback paths.

## Metrics & Reporting

- Track number of new tests per workstream, coverage % (if instrumentation available), and failure logs.
- Document manual QA results (including Lighthouse scores) in verification phase.
