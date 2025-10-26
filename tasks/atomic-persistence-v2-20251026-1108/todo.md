# Implementation Checklist

## Database

- [x] Create migration `20251026_005_assign_tables_atomic_v2.sql` (ledger table + new RPC).
- [x] Update `types/supabase.ts` RPC definitions for v2 + ledger table.

## Services

- [x] Add `server/capacity/holds.ts` with create/confirm/expire/sweep helpers.
- [x] Update `server/capacity/tables.ts` to call v2 RPC, expose quote workflow hook, handle `requireAdjacency`.
- [x] Extend telemetry + observability modules for new events & metadata.
- [x] Introduce hold sweeper job stub.

## API & Client

- [x] Implement `/api/staff/auto/quote` route.
- [x] Update `src/services/ops/bookings.ts` with Auto Quote client method.

## Tests

- [ ] Unit tests for holds service & telemetry.
- [x] Update assignment tests for v2 RPC wiring.
- [ ] Integration test for Quote → Confirm + expired holds.

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

- ...
