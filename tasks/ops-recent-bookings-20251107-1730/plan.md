# Implementation Plan: Ops “Recent” Bookings

## Objective

Provide an Ops-visible “Recent” tab that lists bookings in reverse creation order, while keeping existing status filters intact and ensuring pagination/Supabase queries honor the new ordering.

## Success Criteria

- [ ] `/ops/bookings?filter=recent` renders without errors and shows newest bookings first (verified via API order and UI).
- [ ] URL/state sync persists the new filter (refresh keeps “Recent” selected).
- [ ] Existing tabs (Upcoming/All/Past/Cancelled) and guest “My Bookings” remain unaffected.

## Architecture & Components

- **Filtering hooks**
  - `hooks/useBookingsTableState.ts` / `src/hooks/ops/useOpsBookingsTableState.ts`: add `'recent'` branch setting `sort='desc'`, `sortBy='created_at'`.
  - Extend `OpsBookingsFilters` with `sortBy?: 'start_at' | 'created_at'`.
- **API contract**
  - In `/api/ops/bookings`, parse a new `sortBy` query parameter (default `start_at`), include `created_at` in the select, and use it for ordering when requested.
- **Client plumbing**
  - Allow `useOpsBookingsList` → `bookingService.listBookings` → `buildSearch` to include `sortBy`.
  - Make `BookingsTable` accept optional `statusOptions` so Ops can extend tabs.
  - Pass `[...defaultStatusOptions, { value: 'recent', label: 'Recent' }]` from `OpsBookingsClient`.
  - Update `VALID_FILTERS` and query-param parsing in `src/app/(ops)/ops/(app)/bookings/page.tsx`.

## Data Flow

1. User clicks “Recent” tab → `BookingsTable` notifies `OpsBookingsClient`.
2. `useOpsBookingsTableState` updates `statusFilter` to `'recent'`, sets `sort='desc'` and `sortBy='created_at'`.
3. `useOpsBookingsList` memoizes filters, `bookingService.listBookings` converts them to query params (`sort=desc&sortBy=created_at`).
4. API orders by `created_at` desc and returns results/pagination.

## UI/UX

- New tab label “Recent” adjacent to existing tabs (same style).
- No layout changes; only Ops view receives the extra tab.

## Edge Cases

- If a user deep links to `filter=recent` without selecting a restaurant, existing guards still prompt selection.
- Sorting by `created_at` when also filtering by date range is acceptable (rare use case) since date filters remain optional for `'recent'`.

## Testing Strategy

- Manual: Visit `/ops/bookings`, switch to “Recent”, confirm query param updates and results reorder (spot-check by creating a new booking or observing IDs).
- Regression: `pnpm exec eslint` on touched files; rely on existing hooks tests for status filters (extend if time permits).
