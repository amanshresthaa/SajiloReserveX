# Research: Sprint 1 Ops Verification

## Task Outline

- Sprint objective (Oct 13–17): re-verify day-to-day operations flows (auth → dashboard → bookings CRUD → customers → emails) and lock in automated coverage.
- Verification backlog supplied as five workstreams (A–E) with detailed acceptance tasks (e.g. V-AUTH-01 SSR redirects, V-BK-CRT-01 walk-in validations, V-EML-03 cancellation template variants).
- Exit criteria: 90%+ Playwright coverage on core journeys, all verification tasks green in CI, defects triaged for Sprint 2.

## Subtask Breakdown & Multi-Perspective Notes

### Workstream A — Auth & Access (RBAC + Sessions)

- **Primary flows**: `/ops` server component auth checks (`app/(ops)/ops/(app)/page.tsx:24-68`), membership gating utilities (`server/team/access.ts:1-109`), sign-out client logic (`components/ops/AppSidebar.tsx:94-140`, `lib/supabase/signOut.ts:1-13`).
- **Perspective 1 (SSR redirects)**: Code review shows explicit `redirect('/signin?redirectedFrom=/ops')` when `!user`; needs Playwright coverage for V-AUTH-01. Verified via `sed` output and `rg "redirectedFrom=/ops" -n app/(ops)/ops/(app)/page.tsx`.
- **Perspective 2 (API gating)**: `fetchUserMemberships` & `requireMembershipForRestaurant` enforce membership before data access; `app/api/ops/bookings/route.ts:83-154` and `app/api/ops/customers/route.ts:43-126` both early-return 403. Must design Vitest unit coverage (utilities) + API integration tests (mock Supabase) and Playwright negative paths.
- **Perspective 3 (Role matrix)**: Role enums defined in `lib/owner/auth/roles.ts:1-35`; operations endpoints pass optional `allowedRoles`. Need matrix tests for create/update/cancel endpoints verifying owner/manager allowed, host/server denied. Consider stubbing Supabase responses vs using contract tests.
- **Assumption stress-test**: Confirmed there is _no_ existing auth/Vitest coverage by running `ls tests/server/auth` (empty) and `find tests -name '*ops*test.ts'` (no auth tests). This double-check challenges assumption that auth already covered.

### Workstream B — Dashboard & Navigation

- **Core modules**: Dashboard server page (`app/(ops)/ops/(app)/page.tsx`), booking summary service (`server/ops/bookings.ts#getTodayBookingsSummary`), heatmap range logic (`computeCalendarRange`), sidebar UI (`components/ops/AppSidebar.tsx`).
- **Perspective 1 (Summary math)**: `getTodayBookingsSummary` totals exclude `CANCELLED_STATUSES` (server/ops/bookings.ts:116-162). Verification should unit test aggregator with synthetic datasets (Vitest) and cross-check using Supabase mock responses.
- **Perspective 2 (Heatmap window)**: `computeCalendarRange` calculates 6-week span (start from first Sunday). Verified via `sed` inspection and by manually recalculating for sample dates; plan to test with deterministic date inputs + snapshot of returned map. Consider off-by-one risk if timezone conversions fail.
- **Perspective 3 (Navigation/accessibility)**: Sidebar uses Shadcn components; active-state derived via matcher functions (`components/ops/AppSidebar.tsx:52-93`). Need keyboard navigation Playwright tests plus unit snapshot for role label display. Double-checked presence of touch targets via class names (`touch-manipulation`) to ensure mobile compliance.
- **Uncertainty**: Historical date fallback uses regex; cross-check with invalid strings (Vitest). Must also confirm timezone reliance on `resolveTimezone` & `getDateInTimezone` (server/ops/bookings.ts:54-66, lib/utils/datetime.ts) with both configured & null timezone scenarios.

### Workstream C — Bookings CRUD (Ops)

- **Entry points**: Walk-in POST (`app/api/ops/bookings/route.ts:1-403`), list GET (>200 lines), update PATCH & cancel DELETE (`app/api/ops/bookings/[id]/route.ts`), status PATCH (`app/api/ops/bookings/[id]/status/route.ts`).
- **Perspective 1 (Walk-in happy path)**: Reference generation via `generateUniqueBookingReference` (server/bookings.ts), fallback contact logic ensures idempotency data. Need tests that assert: reference charset, derived end time via `deriveEndTime`, metadata shape (`buildRequestDetails`). Will require mocking Supabase insert; consider contract tests or local test harness.
- **Perspective 2 (Negative/idempotency)**: POST checks `Idempotency-Key` header, existing booking detection; need tests to ensure duplicate returns same payload. Verified double through reading code and running `rg "idempotency" app/api/ops/bookings/route.ts`.
- **Perspective 3 (Audit + side effects)**: PATCH/DELETE use `buildBookingAuditSnapshot` and log events (`server/bookings.ts:41-129`, `logAuditEvent`). Ensure tests measure audit payload diff correctness and side effect queue invocation (mock `enqueueBookingUpdatedSideEffects`). Playwright flow should execute create → update → cancel with mail assertions.
- **Edge-case challenge**: Hosts vs servers permission—`requireMembershipForRestaurant` default accepts any role; if route needs stricter permission, we must simulate with allowedRoles (currently only used implicitly). Verify assumption by scanning endpoints with `rg "allowedRoles" -n app/api/ops`.

### Workstream D — Customer Management & Export

- **Modules**: Customers list GET (`app/api/ops/customers/route.ts`), export route (`app/api/ops/customers/export/route.ts`), service helpers (`server/ops/customers.ts`), CSV generator (`lib/export/csv.ts`).
- **Perspective 1 (Aggregates)**: Service returns totals/historic dates; need unit tests verifying “Never” formatting and pagination metadata. Verified aggregator logic by reading `server/ops/customers.ts:47-110`.
- **Perspective 2 (Export correctness)**: `generateCSV` plus BOM prefix (`\uFEFF`) ensures Excel compatibility. Plan to produce golden-file tests comparing CSV output (Vitest) and Playwright download scenario to confirm `Content-Disposition` filename pattern (derived via `buildFilename`).
- **Perspective 3 (Sorting & zero history)**: Query uses `orderBy` last booking date; ensure tests cover customers with `null` history to confirm UI shows “Never” but sorts correctly. Need dataset with mix of values—should check for `null` handling in service.
- **Assumption check**: Confirmed zero existing tests around customers by `rg --files tests | rg 'customers'` (returns none). Highlights need for new coverage.

### Workstream E — Emails & Side-effects

- **Key files**: Booking email templates (`server/emails/bookings.ts`), queue orchestrator (`server/jobs/booking-side-effects.ts`), analytics logger (`server/analytics.ts`), Inngest config (`server/queue/inngest.ts`).
- **Perspective 1 (Confirmation content)**: Email builder fetches venue details (`resolveVenueDetails`) and constructs calendar links. Testing requires fixture bookings and snapshot of rendered HTML/text. Need to mock Supabase venue fetch; ensure tests assert reference, date/time formatting.
- **Perspective 2 (Update diff)**: Update emails should only trigger when relevant fields change; ensure job pipeline only enqueues when `enqueueBookingUpdatedSideEffects` called. Validate by unit-testing job processors with identical payload to confirm idempotent behavior.
- **Perspective 3 (Cancellation variants)**: `cancelledBy` flag toggles template nuance; must simulate customer vs staff vs system events. Need to confirm analytics records `cancelledBy` passed through (server/jobs/booking-side-effects.ts:213-264). Cross-validate by reading `recordBookingCancelledEvent` usage in `server/analytics.ts`.
- **Safety check**: `isAsyncQueueEnabled()` toggles direct execution fallback; confirm test harness sets env to disable queue for deterministic asserts.

## Existing Automation & Tooling Inventory

- **Vitest**: Primary unit test runner (`vitest.config.ts`). Current repository uses `tests/` root with JS/TS modules.
  - Verified limited Ops coverage via `ls tests/server/ops` (single file) and `rg --files tests | rg 'ops'`.
  - Need new suites for auth utilities, booking service logic, customer exports, analytics.
- **Playwright**: Config in `playwright.config.ts` covers multi-browser + mobile. Current E2E directories focus on consumer flows (`tests/e2e/reservations`, etc.). No Ops coverage yet (confirmed by `find tests/e2e -maxdepth 1 -type d` listing categories w/o ops).
- **Email testing**: No explicit Ops harness discovered; inspect `tests/emails` for reusable patterns (next phase).
- **CI expectations**: Scripts `pnpm test` (Vitest) and `pnpm test:e2e` (Playwright). Our work must integrate with existing commands.

## Technical Constraints & Dependencies

- Supabase remote only (per `AGENTS.md`): avoid local migrations; tests must mock or use doubles rather than mutate remote DB.
- Must request Chrome DevTools MCP token before manual QA (Phase 4). Plan to do so before verification.
- UI components built on Shadcn; prefer extending existing components for test hooks rather than altering structure.
- Mobile-first design; ensure Playwright covers responsive states (desktop + mobile-chrome project).
- Approval policy `never`: cannot request sandbox escalation; rely on current environment.

## Recommendations & Immediate Actions Toward Planning

- Develop fixture factories for bookings/memberships to simplify Vitest coverage; check `tests/helpers` for existing utilities in next phase.
- For Playwright, create dedicated Ops suite (e.g., `tests/e2e/ops/`) with login helper (inspect `tests/global-setup.ts` for seeded users).
- Establish email snapshot baseline using `tests/emails` patterns to validate booking templates under each scenario.
- Document test data requirements: may need seeded Supabase records or to stub network requests—investigate `tests/fixtures` soon.

## Open Questions & Risks

- **Data seeding**: How do we provision Ops users/restaurants for Playwright? Need to review `tests/global-setup.ts`.
- **Supabase mocking**: Evaluate whether existing mocks (`tests/mocks`) cover Supabase client or if we build new wrappers.
- **Queue toggling**: Determine env var controlling `isAsyncQueueEnabled()` for deterministic unit tests.
- **Email assertions**: Clarify if repository uses HTML snapshot testing or string diff patterns.
- **Coverage metric**: Need method to measure Playwright coverage (maybe via instrumentation or heuristics).

## Verification Trace (Research Phase)

- Double-checked each assumption using at least two tools (e.g., `sed` + `rg` for code references; `ls` + `find` for directory checks).
- Captured relevant file paths with line ranges for cross-reference during planning.

## Final Reflection (Research Stage)

- Re-ran complete list of verification tasks (V-AUTH, V-DASH, V-BK, V-CUS, V-EML, V-JOBS) against collected evidence—no gaps spotted, but open questions flagged for plan.
- Ready to proceed to planning with identified modules, tooling status, and risk log.
