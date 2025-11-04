# Implementation Plan: Fix hold TOCTOU, error handling, and atomicity

## Objective

We will make table hold creation atomic and conflict-safe to prevent double holds and orphan rows.

## Success Criteria

- [ ] Atomic creation of holds and members in one server-side transaction.
- [ ] Conflicting concurrent requests result in one success and one explicit `HoldConflictError`.
- [ ] No orphan `table_holds` rows when member insert fails.
- [ ] `findHoldConflicts` no longer silently downgrades on generic errors.
- [ ] Quote flow avoids pre-check when strict conflicts are enabled.

## Architecture & Components

- `server/capacity/holds.ts#createTableHold`: one-shot nested insert; DB enforces overlap via EXCLUDE; translate errors.
- `server/capacity/holds.ts#findHoldConflicts`: strict error handling; legacy fallback only on `42P01`.
- `server/capacity/tables.ts#quoteTablesForBooking`: skip pre-check when `isHoldStrictConflictsEnabled()` is true.

## Data Flow & API Contracts

- No public API change; internal error mapping tightened (`23P01` → `HoldConflictError`).

## UI/UX States

- N/A (server-only). API returns consistent conflict errors.

## Edge Cases

- Duplicate table IDs in input → de-duplicate before insert.
- Rate limit / min TTL logic unchanged.
- If nested write is not supported in some environments, the insert will fail; this would surface quickly.

## Testing Strategy

- Unit/integration: simulate concurrent hold creation and expect one success, one conflict.
- Verify no orphan hold remains on conflict.
- Verify quoting loop without pre-check still resolves via DB errors.

## Rollout

- Guarded by existing strict conflicts feature flag on the quote pre-check path.
- Monitor logs for `HoldConflictError` rates and any unexpected generic errors.
