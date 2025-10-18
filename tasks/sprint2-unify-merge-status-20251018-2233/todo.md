# Implementation Checklist

## Setup

- [x] Add feature flag wiring (`config/env.schema.ts`, `lib/env.ts`) for merge persistence, status triggers, realtime floorplan.
- [x] Draft Supabase migrations for RPC refresh, status triggers, and maintenance allocations (scripts only; run remotely per policy).
- [x] Update Supabase types if new columns/constraints introduced.

## Core

- [x] Refactor `assignTablesForBooking` to use candidate plans + atomic RPC with idempotency key retry logic.
- [x] Adjust in-memory schedule updates to consume RPC merge group data.
- [x] Enhance `assign_tables_atomic` (SQL) for idempotency reuse and overlap error messaging.
- [x] Implement booking status trigger + helper to flip table statuses.
- [x] Extend `/api/ops/tables/[id]` to handle out_of_service maintenance allocation flow.
- [x] Update DTO mapping (`server/ops/bookings.ts`, `server/capacity/tables.ts`) for persisted merge group info.

## UI/UX

- [x] Revise `OpsTodayBooking` types and utilities to expose `{groupId, members[], capacitySum}`.
- [x] Update dashboard components (`BookingsList`, `BookingDetailsDialog`) to render merge groups & occupied/out_of_service badges.
- [ ] Update `TableInventoryClient` to surface new statuses and maintenance metadata.
- [x] Introduce Supabase realtime subscription helper and integrate with `useBookingRealtime` & table inventory refresh.

## Tests

- [x] Extend server tests (`autoAssignTables`, `assignTablesAtomic`) for new behaviour & overlap retries.
- [ ] Add API/unit tests for maintenance status endpoint and DTO mappers.
- [x] Add UI tests covering merged display + status badges.
- [ ] Plan manual Chrome DevTools MCP run (device modes, accessibility, realtime updates).

## Notes

- Assumptions: DB migrations executed remotely; realtime feature flag off by default until end-to-end verified.
- Deviations: Maintenance allocation implementation may relax `booking_id` constraint in `allocations`; document final approach.

## Batched Questions (if any)

- Do we need explicit maintenance window inputs from UI or derive default duration (e.g., rest of day)? Pending confirmation.
