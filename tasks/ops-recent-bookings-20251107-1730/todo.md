# Implementation Checklist

## Setup

- [x] Add `'recent'` to `StatusFilter`/`OpsStatusFilter` unions and update both table-state hooks.
- [x] Extend filter plumbing (`OpsBookingsFilters`, `useOpsBookingsList`, booking service) with `sortBy`.

## Backend

- [x] Update `/api/ops/bookings` query schema and ordering logic to honor `sortBy` (default `start_at`, optional `created_at`).
- [x] Include `created_at` in Supabase select to support ordering.

## Frontend

- [x] Allow `BookingsTable`/`BookingsHeader` to accept custom `statusOptions`.
- [x] Pass the extended options (including “Recent”) from `OpsBookingsClient`; ensure `VALID_FILTERS`/URL parsing accept the new filter.

## Verification

- [x] `pnpm exec eslint components/dashboard/BookingsTable.tsx src/components/features/bookings/OpsBookingsClient.tsx src/hooks/ops/useOpsBookingsTableState.ts src/hooks/ops/useOpsBookingsList.ts src/services/ops/bookings.ts src/app/api/ops/bookings/route.ts "src/app/(ops)/ops/(app)/bookings/page.tsx" hooks/useBookingsTableState.ts src/types/ops.ts`
- [ ] Manual QA: visit `/ops/bookings`, toggle “Recent”, confirm URL adds `filter=recent` and records display newest first (blocked by Ops auth gate).
