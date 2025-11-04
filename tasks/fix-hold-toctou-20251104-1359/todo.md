# Implementation Checklist

## Core

- [x] Atomic nested insert for holds + members in `createTableHold`.
- [x] Map DB `exclusion_violation` to `HoldConflictError`.
- [x] Hard fail in `findHoldConflicts` except when view is missing.
- [x] Skip pre-check in quote loop when strict is enabled.

## Tests

- [ ] Concurrent hold creation race test (one success, one conflict).
- [ ] Orphan check (no `table_holds` without members after conflict).

## Notes

- Assumptions: PostgREST nested writes are transactional; EXCLUDE constraint is present.
- Deviations: Did not add a new RPC due to remote-only migration policy.
