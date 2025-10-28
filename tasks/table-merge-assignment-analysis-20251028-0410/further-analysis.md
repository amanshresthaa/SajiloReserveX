# Further Analysis Plan: Multi-Table Assignment Failure

## Objective

Identify the defect preventing bookings from receiving two or more tables when the party size exceeds a single table’s capacity, and outline verification steps once hypotheses are tested.

## Current Signals

- `assign_tables_atomic_v2` enforces adjacency, mobility, and zone matching before creating a merge-group allocation. Any violation raises a `23514` exception, reported upstream as an RPC failure.
- Manual assignment (`server/capacity/tables.assignTableToBooking`) nulls out the merge ledger after normalizing timestamps, potentially orphaning the merge-group reference returned by the RPC.
- Automated coverage does not currently exercise merged assignments, so regressions may go undetected.

## Investigation Checklist

1. **Reproduce the Fault Path**
   - Attempt a merged assignment via both manual UI/API and hold confirmation.
   - Capture Supabase RPC errors (code, message, details, hint) and confirm whether they originate from validation (`23514`), overlap (`P0001`), or idempotency (`P0003`).
   - Enable verbose telemetry logging (`emitRpcConflict`) to trace the exact guard that fails.

2. **Validate Table Metadata**
   - Confirm all candidate tables share `restaurant_id`, `zone_id`, and have `active = true` in `table_inventory`.
   - Ensure each table intended for merges has `mobility = 'movable'`; non-movable tables block merges.
   - Inspect adjacency graph via `table_adjacencies` for bidirectional coverage (`table_a → table_b` and `table_b → table_a`). Missing reverse edges still fail adjacency checks.

3. **Inspect Existing Holds & Assignments**
   - Query `table_holds` and `booking_table_assignments` for overlapping windows on the involved tables to eliminate conflict-induced early exits.
   - Verify `allocations` entries for the tables and any previous merge-group resource spanning the requested range.

4. **Check Schema Feature Flags**
   - Confirm `booking_table_assignments.merge_group_id` exists in the target environment; without it the RPC silently downgrades to single-table behaviour.
   - Validate that the latest migration (`20251028034500_assign_tables_atomic_v2_alias_fix.sql`) has been deployed; earlier versions enforced directed adjacency and were prone to duplicate-key aborts.

5. **Review Ledger Behaviour**
   - When reproducing through manual assignment, inspect `booking_assignment_idempotency.merge_group_allocation_id` before and after the call to confirm whether it is being reset to `NULL` (see `server/capacity/tables.ts:1603-1613`).
   - Test idempotent retries with the same key to observe whether missing merge-group IDs cause subsequent attempts to skip merge creation.

6. **Augment Automated Coverage**
   - Add Vitest cases that simulate multi-table assignments, asserting the RPC payload, response, and persistence of `merge_group_id` in both assignments and the ledger.
   - Consider SQL regression tests (or Supabase test script) that call `assign_tables_atomic_v2` directly with two tables to ensure migrations behave as expected.

## Potential Root Causes to Verify

- **Adjacency gaps**: The enforcement is now undirected; any adjacency table missing an entry for one direction still triggers the error.
- **Mobility mismatch**: Tables with `mobility != 'movable'` cannot be merged even if UI indicates otherwise.
- **Ledger reset**: Clearing `merge_group_allocation_id` could break retries or future reads, leading upstream logic to believe a merge never occurred.
- **Stale allocations**: Existing `allocations` rows (either `table` or `merge_group`) with overlapping windows could prevent new merges until cleaned up.

## Verification Plan Once Fixes Are Applied

- Confirm multi-table assignment through UI/API succeeds without RPC errors.
- Verify database state:
  - `booking_table_assignments` rows share a non-null `merge_group_id`.
  - `allocations` contains both `table` and `merge_group` rows with aligned windows.
  - `booking_assignment_idempotency.merge_group_allocation_id` retains the merge UUID for the idempotency key used.
- Run updated automated tests to ensure coverage for merged scenarios.
- Perform manual QA via Chrome DevTools MCP to validate DOM state, console cleanliness, accessibility (keyboard navigation on merged bookings), and consistent behaviour across device viewports.

## Open Questions

- Do client flows attempt to retry with the same idempotency key after a partial failure, and how do they recover if the merge ledger was nulled?
- Should we expose merge diagnostics via telemetry or admin UI to surface adjacency/mobility violations proactively?

Document findings and any schema/data corrections back into this task folder once the faulting condition is confirmed.
