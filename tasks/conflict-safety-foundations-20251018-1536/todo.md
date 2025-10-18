# Implementation Checklist

## Database

- [x] Reshape `public.allocations` (tstzrange, EXCLUDE, RLS)
- [x] Introduce atomic RPCs (`assign_tables_atomic`, `unassign_tables_atomic`)
- [x] Add idempotency + merge group refs to `booking_table_assignments`
- [x] Write SQL backfill + integration test scripts

## Backend

- [x] Extend feature flags (`FEATURE_ALLOCATIONS_DUAL_WRITE`, `FEATURE_RPC_ASSIGN_ATOMIC`, `FEATURE_ASSIGN_ATOMIC`)
- [x] Wrap helpers (`assignTableToBooking`, `unassignTableFromBooking`) with atomic path + window computation
- [x] Propagate idempotency header through ops API route

## Frontend

- [x] Emit `Idempotency-Key` in booking service
- [x] Surface soft conflict warning in booking dialog (no disable)

## Tests & Docs

- [x] Add Vitest coverage for atomic wrappers
- [x] Document runbook + rollout guidance
- [ ] Manual QA via DevTools MCP (pending)

## Notes

- Assumptions: re-used existing restaurants/customers for SQL tests to avoid heavy fixtures.
- Deviations: `assign_tables_atomic` currently always writes `shadow = false`; dual-write toggled via env rather than parameter.

## Batched Questions (if any)

- Need confirmation on desired shadow behaviour when `FEATURE_ALLOCATIONS_DUAL_WRITE` is disabled (set to always `false` today).
