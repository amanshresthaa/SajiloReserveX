# Implementation Plan: Reservation Logic Audit

## Objective

Assess reservation/table-assignment logic for compliance with seat inventory, merge, and timing rules; surface correctness and performance risks with actionable evidence.

## Success Criteria

- [ ] Inventory + merge policy traced to concrete code locations.
- [ ] Time/buffer logic analyzed with at least two reproducible edge scenarios.
- [ ] Concurrency risk documented with clear race example.
- [ ] Deliver final report sections (exec summary, findings table, gaps checklist, test plan, quick wins).

## Architecture & Components

- `server/capacity/tables.ts`: booking window math, schedule building, table filtering/combination, RPC orchestration.
- `supabase/migrations/20251016092000_create_booking_table_assignments.sql`: DB schema, assignment RPCs, status updates.
- `server/capacity/service.ts` & `server/ops/capacity.ts`: service periods/capacity metadata (check for service-window handling).
- `src/app/api/ops/dashboard/assign-tables/route.ts`: entry point used by ops dashboard.
- `tests/server/capacity/autoAssignTables.test.ts`: current behavioral expectations.

## Data Flow & API Contracts

- Ops request → API route → `autoAssignTablesForDate({ restaurantId, date })`.
- Auto assign loads `table_inventory` + same-day `bookings` (with current assignments) via Supabase client.
- In-memory `schedule: Map<tableId, TableScheduleEntry[]>` built from existing assignments.
- `assignTableToBooking` RPC inserts `booking_table_assignments` row, updates `table_inventory.status='reserved'` (no conflict detection).

## UI/UX States

- Not UI facing; note API error propagation to dashboard for context.

## Edge Cases

- Service window boundaries (start/end exactly at 12:00/15:00/17:00/22:00).
- Turn time variation by party size vs fixed default (90m).
- Cleaning buffer enforcement between sequential bookings.
- Merge component locking/unlocking on cancel/unassign.
- DST/timezone conversion (HH:MM strings vs service timezone).
- Concurrency when two assignments target same table simultaneously.

## Testing Strategy

- Static review of TypeScript + SQL with targeted `rg` searches (merge, buffer, overlap, duration, timezone, lock).
- Synthesize scenario suite into prospective Vitest cases hitting `autoAssignTablesForDate` and helper functions.
- Identify missing DB-level tests (e.g., RPC overlap guards) for regression coverage.

## Rollout

- Deliver audit artifacts only; implementation follow-up deferred to engineering backlog.
