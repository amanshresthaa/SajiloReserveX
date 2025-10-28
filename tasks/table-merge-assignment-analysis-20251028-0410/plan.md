# Implementation Plan: Table Merge Assignment Logic Analysis

## Objective

We will enable stakeholders to understand the correctness and robustness of the table merge assignment logic so that future changes can be made with confidence.

## Success Criteria

- [x] Document the current control/data flow involved in table merge assignment
- [x] Identify edge cases, potential defects, and improvement opportunities

## Architecture & Components

- `public.assign_tables_atomic_v2` (Supabase RPC): transactional hub that validates table set, enforces adjacency/zone/mobility, writes `booking_table_assignments`, and manages both table-level and merge-group allocations.
- `server/capacity/holds.confirmTableHold` (Node): confirms holds by invoking the RPC with hold window/table set, relays merge_group IDs, and purges the hold.
- `server/capacity/tables.assignTableToBooking`: manual assignment path that derives booking window, calls the RPC, and normalises `booking_table_assignments`/`allocations` rows if RPC results differ.
- Supporting tables: `booking_assignment_idempotency`, `allocations`, `booking_table_assignments`, `table_adjacencies`, `table_inventory`, `table_holds`.

## Data Flow & API Contracts

Endpoint: `rpc/assign_tables_atomic_v2`
Request:

```jsonc
{
  "p_booking_id": "<uuid>",
  "p_table_ids": ["<uuid>", ...],
  "p_idempotency_key": "<text|null>",
  "p_require_adjacency": <bool>,
  "p_assigned_by": "<uuid|null>",
  "p_start_at": "<iso8601>",
  "p_end_at": "<iso8601>"
}
```

Response (per table):

```jsonc
[
  {
    "table_id": "<uuid>",
    "start_at": "<iso8601>",
    "end_at": "<iso8601>",
    "merge_group_id": "<uuid|null>",
  },
]
```

Errors: raises Postgres exceptions (e.g., `23514` for validation failures, `P0001` for conflicts/overlaps, `P0003` idempotency mismatch) that surface via Supabase RPC error payloads.

## UI/UX States

- Not applicable for this analysis task

## Edge Cases

- Reconfirming assignments with the same idempotency key (should return existing rows, not duplicate merges).
- Missing undirected adjacency entries leading to `23514` despite physical adjacency.
- Merge group allocation conflicts when another merge covers overlapping window or when advisory lock cannot be acquired.
- Environments lacking `merge_group_id` column -> RPC gracefully degrades to single-table behaviour without merge allocations.
- Table mobility restrictions causing merged assignment failures (non-movable tables).

## Testing Strategy

- Review unit/integration tests under `tests/server/capacity` (`assignTablesAtomic.test.ts`, `manualConfirm.test.ts`, `autoAssignTables.test.ts`) to understand expected merge behaviour and regression coverage.
- Identify missing cases (e.g., partial adjacency graphs, simultaneous merge allocations) for potential future tests.

## Rollout

- Not applicable
