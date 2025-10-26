# Research: Auto & Manual Assignment Audit

## Existing Patterns & Reuse

- **Table assignment service** in `server/capacity/tables.ts` handles `autoAssignTables`, `assignTableToBooking`, and atomic Supabase RPC calls.
- **Supabase schema** already models `table_inventory`, `table_adjacencies`, `zones`, `bookings`, `booking_table_assignments`, and `allocations` (see `supabase/migrations/20251019..._consolidated_schema.sql` plus the 20251021 merge clean-up migrations).
- **Ops dashboard UI** exposes manual assignment via `BookingDetailsDialog` and a bulk auto-assign button in `OpsDashboardClient`.
- **React Query booking service** (`src/services/ops/bookings.ts`) centralises calls to the `/api/ops` endpoints, adding idempotency headers for assignment mutations.
- **Telemetry hook** `emitSelectorDecision` (server/capacity/telemetry.ts) records selector outcomes via `recordObservabilityEvent`, though backing table may be missing.

## External Resources

- No external specs referenced yet; audit relies on in-repo implementation.

## Constraints & Risks

- Atomic assignment RPC (`assign_tables_atomic`) was rewritten on 2025-10-21 to allow only single-table assignments; merge groups were dropped, so multi-table parties are unsupported.
- Legacy RPC fallback (`assign_table_to_booking`) lacks overlap enforcement with `allocations`, so feature-flag regressions could reintroduce double-booking risk.
- No evidence of reservation holds/quote endpoints or persistence; manual flow assigns tables immediately.
- Auto-assign algorithm only generates single-table candidates despite adjacency data being available.
- Observability target (`observability_events`) is referenced but table DDL not located—telemetry may fail silently.

## Open Questions (and answers if resolved)

- Q: Does the allocator enforce adjacency/zone constraints?
  A: Not currently—candidate generation filters only by capacity/status, and the atomic RPC no longer verifies zone consistency.
- Q: Are there API surfaces for “hold” or “quote” flows?
  A: None found under `src/app/api/ops` or `server/`; only direct assign/unassign endpoints exist.
- Q: Where are assignment metrics emitted?
  A: Only `emitSelectorDecision` logs via observability events; no dedicated metrics pipeline was found.

## Recommended Direction (with rationale)

- Catalogue present domain models, services, APIs, UI surfaces, and tests to establish Auto/Manual readiness.
- Highlight schema and feature-flag gaps (multi-table merges, holds, metrics) to scope next steps.
- Propose concrete changes spanning Supabase RPCs, server allocator logic, API endpoints, and Ops UI enhancements.
