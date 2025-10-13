# Implementation Checklist

## Setup

- [x] Reconfirm Supabase `bookings` schema exposes `customer_name`/`customer_email` (or identify alternate source) before coding filters.
- [x] Audit React Query key usage for ops dashboard/bookings/customers to ensure restaurantId already participates (note any gaps).
- [ ] Align with design/PM on expected UX for the shell switcher (search vs. simple dropdown) and capture specifics in plan if changes arise.
- [x] Inventory current Playwright fixtures to determine best data set for bookings search + customer insights smoke tests.

## Core

- [x] Enhance `OpsSessionProvider` with storage-event sync, stale membership fallback, and minimal helper exports.
- [x] Build `OpsRestaurantSwitch` component and replace the sidebar header area to use the shared switch (fallback to static state when single membership).
- [x] Refactor `OpsBookingsClient`/`OpsCustomersClient`/team settings to consume provider state directly and drop redundant local restaurant selectors.
- [x] Implement browser customer service in `src/services/ops/customers.ts` and migrate feature code into `src/components/features/customers`.
- [x] Extend bookings API (`/api/ops/bookings`) schema + query builder to support `query` filtering on customer name/email; update DTO as needed.
- [x] Update bookings hooks/service (`useOpsBookingsTableState`, `useOpsBookingsList`, `bookingService`) to handle query param + debounced fetch.
- [x] Adjust rate limiter utility to emit development-only warning when Upstash credentials are missing, preserving production silence.
- [x] Draft deployment doc (`docs/deployment/rate-limiter.md`) detailing required Upstash env vars and verification steps.

## UI/UX

- [x] Wire shell switcher component with accessible keyboard navigation, focus management, and role badges.
- [x] Add searchable input to bookings header with clear/reset controls and ensure responsive layout across breakpoints.
- [x] Update customer insights UI to reflect context-driven restaurant changes (reset pagination, disable export while loading).
- [ ] Validate that dialogs/toasts triggered by restaurant switching or search respect accessibility requirements (aria-live, focus return).

## Tests

- [x] Add unit coverage for session provider storage-event handling and booking service query builder.
- [x] Create RTL integration tests for dashboard, bookings, and customers clients covering loading/error/success and search interactions.
- [x] Extend `/api/ops/bookings` tests to assert query validation + filtered results; update auth callback test to new redirect.
- [ ] Update/author Playwright smoke covering customer insights navigation/export and bookings search scenarios.
- [ ] Run axe/manual accessibility checks via MCP for the new shell dropdown and search input, capture findings in `verification.md`.
- [x] Ensure `pnpm test:ops` and relevant Playwright suites run clean locally before CI push.

## Notes

- Assumptions:
  - `bookings` table exposes customer name/email fields; no additional join needed.
  - Existing query keys already include `restaurantId`, minimizing cache invalidation work.
  - Shell switcher will use searchable command-style UI unless design feedback states otherwise.
- Deviations:
  - None yet.

## Batched Questions (if any)

- None currently.
