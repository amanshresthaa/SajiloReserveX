# Implementation Plan: Release failed holds in ultra-fast assignment script

## Objective

Ensure the ultra-fast assignment script never leaves conflicting holds behind when assignments fail, restoring table availability for subsequent bookings.

## Success Criteria

- [ ] Any failure path in `fastAssign` releases the hold created for that booking.
- [ ] New logging captures `AssignTablesRpcError` codes (e.g., `ASSIGNMENT_CONFLICT`) for diagnostics.
- [ ] Script still reports successful assignments unchanged.

## Architecture & Components

- `scripts/ops-auto-assign-ultra-fast.ts`: update `fastAssign` to
  - Track hold context explicitly.
  - Call `releaseTableHold` on failures before returning.
  - Surface error codes in the `QuickResult` payload for observability.
- Reuse `releaseTableHold` from `server/capacity/holds` to avoid duplicating logic.

## Data Flow & API Contracts

- No external API changes; script continues to read/write Supabase tables via existing modules.
- `QuickResult.failureType` remains but `errorCode` will now carry the RPC error code rather than `null` when available.

## UI/UX States

- Not applicable (CLI-only script). Console output should remain concise.

## Edge Cases

- Confirm failure due to `ASSIGNMENT_CONFLICT` → release hold, emit conflict metadata.
- Transition failure after successful assignment → do **not** release hold (assignments exist); instead flag persistence failure (already handled).
- Unexpected errors before hold creation → no release attempt.

## Testing Strategy

- Manual: rerun script against staging dataset, confirm failure breakdown no longer dominated by hold conflicts.
- Automated: rely on existing coverage; change is isolated to script logic.

## Rollout

- Immediate – script execution only. No feature flag required.
