# Reservation Logic Audit – Findings

## Context

- **Repo**: `/Users/amankumarshrestha/Downloads/SajiloReserveX`
- **Tech stack**: Next.js (App Router) + TypeScript + Supabase/PostgreSQL RPC + Vitest
- **Key entry points**: `src/app/api/ops/dashboard/assign-tables/route.ts`, `server/capacity/index.ts`, `supabase/migrations/20251016092000_create_booking_table_assignments.sql`
- **Relevant tests**: `tests/server/capacity/autoAssignTables.test.ts`

## Executive Summary

- Auto-assignment hardcodes a 90 min duration and ignores per-party/service turn times and closing windows, so large parties can be under-blocked or run past 22:00.
- No 15 min cleaning buffer is applied to availability math, allowing back-to-back bookings that business rules forbid.
- Table-combination heuristic permits any mix (including triples) and doesn’t enforce the approved 2+4 or 4+4 merges, so inventory use can violate floor rules.
- `assign_table_to_booking` performs no overlap check or locking, so concurrent auto-assign runs can double-book the same table.
- Seeds deliver 16 tables (2/4/6/8 tops) instead of the mandated 3×2, 5×4, 2×7 inventory, forcing illegal merge patterns.
- Cancelling a booking doesn’t unassign its tables; component tables remain “reserved” and assignments linger, breaking the release requirement.
- Time math is timezone-naïve; DST transitions can stretch or shorten seat blocks compared with the real clock.

## Findings List

| Severity | Category    | File:Line                                                                     | Description                                                                                                                                                                                | Repro steps                                                                                                                                  | Fix sketch                                                                                                                                                                                                                                                        |
| -------- | ----------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High     | Correctness | `server/capacity/tables.ts:83`                                                | `computeBookingWindow` defaults all stays to 90 min and never clamps to lunch/dinner windows, so 7–8 tops don’t get the required 130–150 min and bookings can bleed past 22:00.            | S4/S5: create dinner booking for 8 at 20:00 or 6 at 17:30; observe system ends at 21:30/19:00 instead of ≥22:10/19:40.                       | Load per-service turn-time matrix (lunch vs dinner) and party-size bands; compute end = start + policy duration; reject/adjust if end exceeds service close. Persist end_time accordingly.                                                                        |
| High     | Correctness | `server/capacity/tables.ts:101`                                               | No buffer is added before checking `windowsOverlap`, so a 13:30 booking is allowed immediately after a 12:00, even when a 15 min clean is required.                                        | S1/S2: book 12:00→13:30 on a 2-top; request 13:30. System accepts despite buffer rule.                                                       | Apply configurable buffer when building `BookingWindow` (subtract/add buffer to start/end) or enforce via overlap check; expose 0/15 min from venue config.                                                                                                       |
| High     | Correctness | `server/capacity/tables.ts:173`                                               | `chooseTableCombination` evaluates all singles/pairs/triples and greedy fallback—no guard against disallowed merges or >2 tables.                                                          | Request party=7; algorithm happily returns three 2-tops because total ≥7.                                                                    | Encode allowed merge catalogue {(2,4),(4,4)}; reject other combos; ensure merged capacity matches rule of 6/8 and tag component tables as blocked atomically.                                                                                                     |
| Critical | Correctness | `supabase/migrations/20251016092000_create_booking_table_assignments.sql:160` | `assign_table_to_booking` just inserts rows; there’s no time-window clash check, unique constraint, or lock on table usage, so concurrent runs can reserve the same table twice.           | S6: fire two `autoAssignTablesForDate` calls in parallel for the same 4-top at 19:00; both succeed.                                          | Wrap selection/assignment in transaction: lock candidate tables (`SELECT … FOR UPDATE`), verify no overlapping assignments via `booking_table_assignments` join on time, and enforce uniqueness via exclusion constraint (e.g., GiST on table_id with tstzrange). |
| Medium   | Data        | `supabase/seeds/seed-table-inventory.sql:16`                                  | Seed blueprint provisions 16 tables (capacities 2/4/6/8) instead of 10 tables with 3×2, 5×4, 2×7, so planner never has 7-tops and must rely on illegal merges.                             | Inspect seeded data; party=7 can’t be seated on single table; forced to combine 3 small tables.                                              | Update seed/migration to create exact inventory (3×2,5×4,2×7), add `table_inventory` constraint to cap total rows per restaurant, and expose seating map as config.                                                                                               |
| Medium   | Correctness | `server/bookings.ts:380`                                                      | `softCancelBooking` flips status to `cancelled` but never calls `unassign_table_from_booking`; tables stay in `booking_table_assignments` and `table_inventory.status` remains `reserved`. | S8: create merged booking, cancel via API, query `booking_table_assignments`; rows persist.                                                  | On cancel, fetch assignments and call `unassign_table_from_booking` within transaction; alternatively add trigger to cascade when status enters cancelled/no_show.                                                                                                |
| Medium   | Correctness | `server/capacity/tables.ts:70`                                                | Time math is HH:MM parsing with no timezone context; DST transitions (clock forward/back) shift actual stay length vs expected buffer.                                                     | S7: booking spanning BST→GMT shift (e.g., 2025-10-26 01:30). System still treats it as fixed 90 min while real wall time differs by ±60 min. | Move to timezone-aware arithmetic: use `booking.start_at`/`end_at` (timestamptz), convert to minutes via restaurant TZ, and run overlap/buffer logic on actual instant ranges.                                                                                    |

## Gaps vs Business Rules

- [ ] **Inventory**: Current seed data violates the 3×2, 5×4, 2×7 requirement and merge logic allows unsupported combinations.
- [ ] **Service windows & turn times**: Fixed 90 min duration ignores lunch/dinner targets and closing times.
- [ ] **Cleaning buffer**: No 15 min buffer is applied to table reuse.
- [ ] **Assignment policy**: Smallest-table preference is undermined by unrestricted merges and lack of rule enforcement.
- [ ] **Capacity realism**: Concurrency gaps in RPC allow silent double-booking; walk-ins would suffer same risk.

## Test Plan Additions

- Add `tests/server/capacity/autoAssignTablesBuffer.test.ts` to assert buffer enforcement (13:30 request fails when prior booking ends 13:30 with 15 min buffer).
- Add `tests/server/capacity/autoAssignTablesDuration.test.ts` verifying party-size dependent durations and refusal when the stay would overrun 22:00.
- Add `tests/server/capacity/autoAssignTablesMergeRules.test.ts` covering allowed merges (2+4, 4+4) and rejecting triple-table allocations.
- Introduce concurrency integration test simulating simultaneous assignments to ensure the second attempt fails once locking/exclusion enforced.
- Extend cancellation tests to confirm `softCancelBooking` unassigns tables and restores availability.

## Quick Wins

1. Persist configurable turn times and buffers per service period and feed them into `computeBookingWindow`.
2. Add a Postgres exclusion constraint (e.g., `USING gist (table_id, tstzrange(start_at, end_at))`) and matching RPC checks to prevent overlapping assignments.
3. Refactor `chooseTableCombination` to consult an explicit allowed-merge table, eliminating illegal combos and simplifying audits.
4. Update `softCancelBooking` to unassign all associated tables (or add a trigger) so cancellations immediately free inventory.
5. Refresh `table_inventory` seeds to the mandated 10-table layout and enforce via migration checks to prevent drift.
