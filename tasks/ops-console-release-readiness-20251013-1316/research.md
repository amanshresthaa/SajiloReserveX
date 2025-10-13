# Research: Ops Console Release Readiness

## Existing Patterns & Reuse

- **Global session state** – `src/contexts/ops-session.tsx` already persists the active restaurant to `localStorage` and exposes `setActiveRestaurantId`. It lacks a storage-event listener for multi-tab sync and the shell UI does not surface selection controls. We can extend this provider instead of replacing bespoke per-page selectors.
- **Shell scaffolding** – `src/components/features/ops-shell/OpsSidebar.tsx` renders account metadata and navigation using the shadcn `Sidebar` primitives. The header currently shows initials + restaurant name but no dropdown. This is the natural insertion point for a shared context switcher component.
- **Per-page restaurant selects** – `src/components/features/bookings/OpsBookingsClient.tsx`, `src/components/features/team/OpsTeamManagementClient.tsx`, and `components/ops/customers/OpsCustomersClient.tsx` each implement their own selects/sync logic. These implementations confirm the data shape (memberships array from `useOpsSession`) and inform how we can centralize selection + URL synchronization.
- **Service layer** – `src/services/ops/*.ts` houses browser-facing clients for bookings/team/restaurants. `customers.ts` still exports `NotImplementedCustomerService`, so the new API integration can follow the fetch helpers in `bookings.ts` (e.g., `fetchJson`, search param helpers) for consistency.
- **API contracts** – Bookings and customers routes (`app/api/ops/bookings/route.ts`, `app/api/ops/customers/route.ts`) already guard memberships via Supabase and share pagination semantics. Bookings route currently lacks name/email filters; we can extend the zod schema and query builder rather than introducing a new endpoint.
- **Testing harness** – Vitest configuration (`vitest.config.ts`) includes React Testing Library support with JSDOM via `tests/vitest.setup.ts`. Current ops-focused suites (`tests/ops/clients.test.tsx`, `tests/ops/useOpsHooks.test.tsx`) mount providers with stubbed services, demonstrating how to compose new integration suites for dashboard/bookings clients.
- **Rate limiting utility** – `server/security/rate-limit.ts` already caches Upstash credentials and falls back to an in-memory store with a warning. We can hook into the credential check path to emit a dev-only warning while preserving existing fallback behavior.
- **Documentation pattern** – Infra guidance lives in `docs/` (largely empty today) and top-level runbooks reference env expectations. We may add/update a deployment-focused markdown under `docs` or `reports` to capture the Upstash requirement, following the concise style used in `DoneList.md`.

## External Resources

- [MDN Storage Events](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event) – ensure cross-tab restaurant switching stays in sync without custom polling.
- [TanStack Query v5 Mutations & Prefetch](https://tanstack.com/query/v5/docs/framework/react/) – confirm best practices for invalidation when filters change (bookings search, customer list).
- [Supabase PostgREST Filtering](https://supabase.com/docs/reference/javascript/select) – validate `ilike`/`textSearch` mechanics for name/email queries and any required indexes.
- [Upstash Redis Environment Setup](https://upstash.com/docs/redis/sdks/overview) – reference the official env variable names and recommended safeguards when documenting deployment steps.
- [WCAG 2.2 – Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance) – ensure the new shell dropdown + search inputs preserve keyboard visibility.

## Constraints & Risks

- **Multi-tab drift** – Without storage-event handling, two tabs selecting different restaurants will fight over persisted state. Need debouncing and guard against stale memberships (e.g., membership removed mid-session).
- **Large customer exports** – CSV endpoint iterates through all customers; adding richer filtering must avoid fetching unbounded result sets on the main list. Keep pagination limits and guard search to index-friendly columns (name/email uses `ilike` on potentially large tables).
- **Search performance** – Extending bookings query with name/email filters could require joining `customers` or `booking_guests`. Ensure indexes exist or consider `ilike` on denormalized columns (booking holds `customer_name/email`). We must confirm column availability before altering the query.
- **React Query cache coherence** – Global restaurant switch should invalidate dependent queries (dashboard summary, bookings list, customers list). Need to verify `queryKeys` include restaurantId so context changes auto-refresh data; otherwise, manually reset caches.
- **CI stability** – New integration suites must remain deterministic. Mock services/React Query to avoid real timers and ensure test cleanup resets global event listeners.
- **Rate limiter logging** – Production logs should avoid noisy warnings each invocation. We must scope the new warning to development/test to prevent log spam in prod while still surfacing configuration gaps locally.
- **Manual MCP QA requirement** – Any UI adjustments (shell dropdown, search field) must be verified via Chrome DevTools MCP, including accessibility scanning. Budget time for the mandated checklist.

## Open Questions (and answers if resolved)

- **Q:** Do bookings already expose customer name/email columns without joining extra tables?  
  **A:** `app/api/ops/bookings/route.ts` selects from `bookings` and populates DTOs with `notes` and timing but omits customer fields; however, Supabase `bookings` table (via helpers in `server/bookings.ts`) includes `customer_name` and `customer_email`. We can extend the select to include those fields to avoid expensive joins.
- **Q:** Should the global restaurant switch propagate to URL params automatically?  
  **A:** Current pages mirror the selection into `?restaurantId=` (bookings) or maintain internal state (customers). We should keep URL reflection on routes where filtering matters but rely on the shared context as the source of truth, updating page-specific search params when the provider changes.
- **Q:** Where should deployment documentation live?  
  **A:** No dedicated infra runbook exists; adding `docs/deployment/ops-rate-limiter.md` (or similar) keeps the guidance co-located with other cross-cutting docs without polluting root README.

## Recommended Direction (with rationale)

- **Centralize restaurant switching** by building a reusable `OpsRestaurantSwitch` component in `src/components/features/ops-shell/` that leverages shadcn `Command` or `Select`. Wire it into the sidebar header, update `OpsSessionProvider` with storage-event syncing, and expose a hook (`useOpsRestaurantSwitcher`) if needed for other components. This reduces duplication and satisfies Epic 1 UI/UX expectations.
- **Extend persistence logic** by enhancing `OpsSessionProvider` to validate stored IDs against fresh memberships, listen for `storage` events, and expose a `lastSyncedAt` or simple no-op guard to prevent loops. Update page clients (`OpsBookingsClient`, `OpsCustomersClient`, `OpsTeamManagementClient`) to consume `activeRestaurantId` directly and drop redundant local `useState`.
- **Implement the customer service layer** by replacing `NotImplementedCustomerService` with a browser fetch client hitting `/api/ops/customers` and exporting proper DTO types. Update `useOpsCustomers` to depend on the service (via context) to keep fetch logic cohesive.
- **Refactor the customer workspace** into `src/components/features/customers/` (co-locating with new architecture), integrate with `OpsSession`, and ensure CSV export reuses context-provided restaurant metadata for naming/authorization.
- **Add bookings search filters** by extending `OpsBookingsFilters` with a `query` (name/email) field, adjusting `buildSearch` in the service, updating the API zod schema, and enriching the Supabase query with case-insensitive filters. Pair this with a search input in `BookingsHeader` plus React Query debounced invalidation.
- **Bolster test coverage** by crafting React Testing Library suites for `OpsDashboardClient` and `OpsBookingsClient` using controlled service stubs to exercise loading/error/success states and search interactions. Ensure they run under `pnpm test:ops`.
- **Document Upstash requirements** by adding a short deployment note specifying `UPSTASH_REDIS_REST_URL`/`REST_TOKEN`, the effect of missing vars, and referencing the new warning log.
- **Stabilize CI** by correcting the auth callback test expectation to `/dashboard`, verifying `pnpm test:ops` locally, and investigating any residual flakes (e.g., React Query timers) while implementing new tests.
