# Implementation Plan: Remove Merge Table Feature

## Objective

We will excise the merge-table capability end-to-end so the platform treats all bookings as single-table assignments with no merge metadata in code, database, or configuration.

## Success Criteria

- [ ] Supabase schema no longer contains `merge_groups`, `merge_group_members`, `merge_rules`, or `booking_table_assignments.merge_group_id`.
- [ ] Application/server/UI code compiles and runs without any merge-specific helpers, flags, or telemetry fields.
- [ ] Automated tests touching capacity, table inventory, and ops dashboards pass without merge-dependent assertions.
- [ ] Set adjacency UI and related APIs removed from table management.

## Architecture & Components

- **Supabase schema**: New migration to drop merge tables/column, dependent triggers/policies, and replace `assign_tables_atomic` / `unassign_tables_atomic` with single-table implementations.
- **Generated types**: Update `types/supabase.ts` to reflect schema removals; adjust any DTOs relying on merge-specific shapes.
- **Server capacity engine**: Simplify `server/capacity/tables.ts`, `server/capacity/selector.ts`, and telemetry to remove merge planning and metadata.
- **Ops services & APIs**: Remove `deriveMergeEligible` logic and merge flags from `server/ops/tables.ts`, `src/services/ops/tables.ts`, and `src/app/api/ops/tables` routes.
- **Ops UI**: Update `TableInventoryClient`, `BookingsList`, `BookingDetailsDialog` to eliminate merge badges/labels and clarify adjacency copy.
- **Config/env**: Remove `FEATURE_MERGE_PERSISTENCE` from schemas and runtime env exports.

## Data Flow & API Contracts

- RPC: `assign_tables_atomic(booking_id uuid, table_ids uuid[], window tstzrange, assigned_by uuid, idempotency_key text)`
  - **New response**: `TABLE(table_id uuid, assignment_id uuid)` (drops `merge_group_id`).
  - **Behaviour**: Upsert booking-table assignments, set statuses, and manage `allocations` entries per table only.
- RPC: `unassign_tables_atomic(booking_id uuid, table_ids uuid[])`
  - **New response**: `TABLE(table_id uuid)` with no merge semantics; removes allocations per table.
- REST: `/api/ops/tables` (GET/POST/PATCH) returns table rows without `merge_eligible`.
- Ops dashboard booking summary now lists assigned tables without merge decoration.

## UI/UX States

- Table inventory list loses “Merge” column/badges; adjacency dialog copy refers only to adjacency management.
- Booking list/details show combined table labels like “Tables T1 + T2 · 6 seats” without merge tags; fallback text remains unchanged.
- No new states introduced; existing loading/empty/error behaviour unaffected.

## Edge Cases

- Legacy data with non-null `merge_group_id` will be orphaned once column drops; migration must handle constraint removal before dropping.
- `assign_tables_atomic` idempotency logic must still validate `p_idempotency_key` without merge IDs; ensure allocation overlap errors continue to surface.
- Downstream analytics expecting `mergeType` will now receive payloads without that key; confirm optional handling.

## Testing Strategy

- Unit: Update and run relevant suites (`pnpm test --filter tables` or targeted server tests covering capacity/ops tables).
- Integration: Execute server capacity tests (`pnpm test --filter capacity`) to ensure selector/auto-assign flows still work.
- E2E: Not required (UI behaviour largely cosmetic), but regression through component/unit tests suffices.
- Accessibility: N/A (copy-only adjustments preserve semantics).

## Rollout

- Feature flag: None (merge flag removed outright).
- Exposure: Change is global once deployed.
- Monitoring: Observe capacity selector telemetry for warning spikes; confirm observability events still ingest without merge metadata errors.
