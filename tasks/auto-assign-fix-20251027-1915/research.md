# Research: Auto Assign Fix

## Existing Patterns & Reuse

- `autoAssignTablesForDate` (`server/capacity/tables.ts:1674-1898`) builds candidate plans but does **not** check current table usage before selecting a plan; it only applies the structural filters from `filterAvailableTables`.
- Manual flows (`evaluateManualSelection`, `getManualAssignmentContext`) rely on `buildBusyMaps` and `extractConflictsForTables` to flag conflicting assignments/holds before confirmation.
- `buildBusyMaps` already converts `ContextBookingRow` assignments and active holds into per-table busy windows that use `computeBookingWindowWithFallback` for consistent timing.
- Helper utilities such as `fetchHoldsForWindow` and `listActiveHoldsForBooking` demonstrate how holds are queried and normalised; they can be adapted for auto-assign since they live in the same module.
- `assignTableToBooking` ultimately calls the Supabase RPC `assign_tables_atomic_v2`, whose SQL (`supabase/migrations/20251027164000_precise_assign_tables_atomic_v2.sql`) rejects overlap and emits the `assignment overlap for table %` error that Ops currently sees.

## External Resources

- Supabase RPC definition: `supabase/migrations/20251027164000_precise_assign_tables_atomic_v2.sql` – documents the overlap guard that fails auto assign today.
- Unit tests: `tests/server/capacity/autoAssignTables.test.ts` cover happy paths; none guard against conflicts, so we should extend this suite.

## Constraints & Risks

- Auto-assign processes multiple bookings sequentially; once we assign tables we must mark them busy for subsequent iterations to avoid double-booking within the run.
- Holds must be treated as busy windows; otherwise auto assign could seize tables that are on hold, undermining manual workflows.
- Additional queries (for holds or booking contexts) can increase latency; we should reuse already-fetched `bookings` and hydrate holds in bulk rather than per booking where possible.
- We must keep the fallback behaviour when timezone lookup fails; booking window calculations depend on a valid policy timezone.

## Open Questions (and answers if resolved)

- Q: Can we reuse `ContextBookingRow.booking_table_assignments` to mark new assignments during the same run?
  A: Yes—these rows are mutable in memory; pushing newly-assigned table ids ensures subsequent busy-map computations see them without extra queries.
- Q: Do we need holds scoped to a booking or the entire restaurant?
  A: Auto assign should avoid any active hold at the restaurant that overlaps the booking window, regardless of booking ownership, so a restaurant-level query filtered by time window is required.
- Q: Is it acceptable to skip a booking when every candidate conflicts?
  A: Yes; we already emit telemetry with a skip reason, so we can reuse the existing skip path when conflicts eliminate all candidates.

## Recommended Direction (with rationale)

- Build a busy map for each booking using existing helpers:
  1. Hydrate all same-day bookings once (already available) and track new assignments by mutating `booking_table_assignments`.
  2. Query active holds for the restaurant/date in a single call (similar to `fetchHoldsForWindow`) and reuse across iterations.
  3. Use `buildBusyMaps`/`extractConflictsForTables` to filter candidate tables and discard plans that conflict with busy windows.
- If all plans conflict, log telemetry and push the booking to `skipped` with a descriptive reason rather than calling the RPC.
- Extend `autoAssignTablesForDate` tests to cover conflict scenarios (existing assignment + active hold) to prevent regressions.
