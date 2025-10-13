# Implementation Plan: Ops Console Release Readiness

## Objective

Deliver the remaining Ops Console features and stability work (restaurant switching, customer insights, bookings search, CI/runtime safeguards) so operations staff can confidently use the console for the v1.0.0-rc1 release.

## Success Criteria

- [ ] Global restaurant switcher lives in the Ops shell, stays in sync across tabs, and updates dependent views without manual reloads.
- [ ] Customer Insights page consumes a real customer service, inherits global restaurant context, and passes CSV export QA.
- [ ] Bookings API/UI accept name/email queries with unit, integration, and Playwright coverage for positive and empty states.
- [ ] `pnpm test:ops` runs clean locally and in CI after adding new suites and aligning auth callback expectations.
- [ ] Rate limiter warning + documentation land, and Chrome DevTools MCP QA is captured in `verification.md`.

## Architecture & Components

- **Ops Shell / Session (Epic 1)**
  - Extend `OpsSessionProvider` (`src/contexts/ops-session.tsx`) with storage-event syncing, membership validation, and optional `syncActiveRestaurant()` helper.
  - Create `OpsRestaurantSwitch` under `src/components/features/ops-shell/` using shadcn primitives (`Command`, `Popover`, `Button`) with keyboard navigation and search-as-you-type.
  - Wire the switcher into the header of `OpsSidebar.tsx`, showing initials + static name when only one membership exists.
  - Expose derived options via memoized hook (e.g., `useOpsRestaurantOptions`) for reuse in other feature components.

- **Customer Insights (Epic 2)**
  - Implement `createBrowserCustomerService` in `src/services/ops/customers.ts` mirroring the bookings service conventions (`fetchJson`, search params).
  - Move customer feature components to `src/components/features/customers/` and adjust imports (`app/(ops)/ops/(app)/customer-details/page.tsx`).
  - Update `OpsCustomersClient` to rely on `useOpsSession` for restaurant state, remove local `useState`, and hook into `useCustomerService` + React Query.
  - Ensure CSV export button pulls the active restaurant from context and exposes disabled/loading states with appropriate ARIA attributes.

- **Bookings Search (Epic 3)**
  - Extend `OpsBookingsFilters` with `query?: string`, update `bookingService.buildSearch`, and pass the new param to `/api/ops/bookings`.
  - Update `opsBookingsQuerySchema` + Supabase query to select `customer_name`/`customer_email` and apply `ilike` filters (guarding against SQL wildcards).
  - Enhance `useOpsBookingsTableState` to manage `query`, `setQuery`, and a debounced value for fetching; expose helper to reset pagination on query change.
  - Introduce a search input in `BookingsHeader` (shadcn `Input` + clear button) and sync query to the URL via `OpsBookingsClient`.

- **Testing & CI (Epics 4 & 5)**
  - Add RTL integration suites (`tests/ops/dashboard-client.test.tsx`, `tests/ops/bookings-client.test.tsx`, etc.) using stubbed services to assert loading/error/success, search filtering, context switching.
  - Align `app/api/auth/callback/route.test.ts` expectation to `/dashboard`, leaving fallback assertions intact.
  - Confirm React Query caches are reset between tests (utility helper or `beforeEach` cleanup).

- **Rate Limiter & Documentation (Epic 6)**
  - Update `server/security/rate-limit.ts` to emit a single warning in development/test when Upstash env vars are missing; keep production silent.
  - Author `docs/deployment/rate-limiter.md` (or similar) outlining required env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), fallback behavior, and verification steps.

- **Release QA (Epic 7)**
  - Prepare MCP manual QA plan covering shell switcher, bookings search, customer export, and note results + metrics in `verification.md`.
  - Document UAT sign-off flow and tag creation steps post-development (ties into release notes).

## Data Flow & API Contracts

- **Restaurant selection**
  - State source: `OpsSessionProvider` holds `activeRestaurantId`. On change, persist to `localStorage` (`ops.activeRestaurantId`) and broadcast via context and `storage` listener.
  - Consumers (dashboard, bookings, customers, team) read from context; query keys already include restaurantId—verify and adjust if necessary to trigger refetches.

- **Bookings search**
  - Endpoint: `GET /api/ops/bookings?restaurantId=:uuid&query=:string&…`.
  - Query param: optional `query` string (trimmed, max length ~80). Backend sanitizes `%` / `_` and applies `ilike` to `customer_name` and `customer_email`.
  - Response: unchanged `OpsBookingsPage`; optionally include `customerName` in DTO for future UI hints (keep plan to evaluate).
  - Errors: maintain existing 400/401/403/429/500 paths; add specific 400 message for overly long query.

- **Customer service**
  - Service methods: `list(restaurantId, params)` -> `OpsCustomersResponse`.
  - React Query key includes `{ restaurantId, page, pageSize, sort }`; ensure `queryKeys.opsCustomers.list` accepts undefined filters gracefully.
  - Export button still hits `/api/ops/customers/export`; rely on context for restaurantId and selected sort.

- **Rate limiter logging**
  - When `env.cache.upstash.restUrl/restToken` missing and environment is `development` or `test`, log `[rate-limit] Upstash credentials missing; using in-memory store`.
  - Preserve existing `warnedAboutMemoryStore` guard to avoid duplicate logs.

## UI/UX States

- **OpsRestaurantSwitch**
  - Loading: skeleton pill until memberships ready.
  - Empty: hide switch, fallback to “No restaurant access” card (already implemented in pages).
  - Success: searchable list with active item checkmark, badges for roles, `aria-activedescendant`, ESC to close.
  - Error/invalid membership: show toast + auto-reset to first available restaurant.

- **Bookings Search**
  - Input shows placeholder, `aria-label="Search bookings"`, `aria-busy` toggled on query changes.
  - Debounce 300–400ms using `useDeferredValue` or manual timer; display spinner in header/within input.
  - Provide clear button resetting query, clearing URL param, and reloading default results.

- **Customer Insights**
  - Retain existing skeleton + empty states, ensure new context-driven data updates gracefully on restaurant change (table resets to page 1, export button disabled while fetching).

- **General**
  - Maintain responsive layout (mobile-first). Ensure components respect `prefers-reduced-motion`.
  - Validate focus outlines for dropdown/search, capability for keyboard-only operation.

## Edge Cases

- Stored restaurant ID no longer valid (membership revoked): provider should drop to first valid membership and purge storage.
- Multi-tab race conditions: storage-event handler must ignore updates triggered by the current tab to prevent loops.
- Bookings search with emojis/special characters: sanitize using `%` escape; fallback to unfiltered results if the query is empty post-trim.
- CSV export triggered during fetch: disable button + show spinner; guard against double-click.
- Upstash vars absent in production: ensure new warning gated to dev/test, but we should still capture `source: "memory"` in observability events.
- Tests running in parallel: cleanup listeners to avoid cross-test leakage; use `afterEach` to reset session storage/localStorage mocks.

## Testing Strategy

- **Unit**
  - `OpsSessionProvider` storage-event handling (mock window + dispatch).
  - Booking service `buildSearch` sanitizes and encodes query correctly.
  - Customer service transforms API response + error pathways.

- **Integration (Vitest + RTL)**
  - `OpsDashboardClient` – verify loading skeleton, summary render, heatmap fallback, and status mutation stub invocation.
  - `OpsBookingsClient` – assert restaurant switching resets page, search input drives query param + service call, error banner/empty states.
  - `OpsCustomersClient` – context-driven restaurant changes, pagination, export button disable state.

- **API**
  - Extend `/api/ops/bookings/route.test.ts` to cover `query` param validation and filtered results.
  - Update auth callback test expectation + fallback scenario.

- **E2E (Playwright)**
  - Add/extend smoke tests for bookings search and customer insights navigation/export (use test data or intercepts).
  - Regression run for multi-restaurant switching scenario.

- **Accessibility**
  - Run axe in dev or dedicated tests, confirm dropdown/search accessible names and focus order.
  - Manual MCP QA: inspect DOM semantics, network requests, performance metrics logged in `verification.md`.

## Rollout

- No new feature flags; deployment enables functionality immediately.
- Sequence: implement -> unit/integration tests -> `pnpm test:ops` -> Playwright smoke -> staging deploy.
- Perform MCP manual QA checklist (mobile/tablet/desktop, accessibility, performance profiling). Document in `verification.md`.
- Coordinate UAT demo once QA passes; capture approvals + instructions for tagging `ops-console-v1.0.0-rc1`.
