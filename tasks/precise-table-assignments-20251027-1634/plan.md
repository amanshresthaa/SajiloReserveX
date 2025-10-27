# Implementation Plan: Precise Table Assignments

## Objective

We will enable staff table assignments to rely on precise time ranges so that manual and automatic flows avoid overlapping bookings.

## Success Criteria

- [x] assign_tables_atomic_v2 accepts and uses exact start/end timestamps.
- [x] booking_table_assignments enforces non-overlapping windows on a per-table basis.
- [x] Manual confirmation flow returns normalized windows aligned with computeBookingWindow.

## Architecture & Components

- assign_tables_atomic_v2 RPC: extend signature (`p_start_at`, `p_end_at`), enforce window pairing, hydrate precise range, and persist to table/allocations.
- booking_table_assignments table: add nullable `start_at`/`end_at` columns, GiST exclusion constraint scoped to rows with both timestamps.
- Server wrappers: `assignTableToBooking`, `confirmTableHold`, `confirmHoldAssignment`, and related call sites compute `computeBookingWindow(...).block` and pass normalized ISO strings.
  State: maintained in Supabase function | Routing/URL state: unaffected (server-side change).

## Data Flow & API Contracts

Endpoint: RPC assign_tables_atomic_v2
Request: { booking_id, table_ids[], idempotency_key, require_adjacency, start_at?, end_at? }
Response: unchanged (assignments array)
Errors: conflicts surface via RPC exceptions with overlap codes.

## UI/UX States

- Loading: N/A (backend change).
- Empty: N/A.
- Error: Overlap conflicts return actionable 409.
- Success: Assignments saved with precise windows.

## Edge Cases

- Missing start/end values default from booking (legacy compatibility); mismatched inputs rejected.
- Existing records without timestamps keep constraint inactive (partial index) until refreshed.
- Idempotency ledger + merge group updates still align with new windows.

## Testing Strategy

- Unit: adjust RPC wrapper tests (assignTablesAtomic). Simulate overlap detection.
- Integration: run targeted server tests for manual/auto assign flows.
- E2E: Not required.
- Accessibility: Not applicable.

## Rollout

- Feature flag: none.
- Exposure: immediate once migration applied.
- Monitoring: Supabase logs for constraint violations and RPC errors.
