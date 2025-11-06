# Implementation Plan: Sprint 1 Transaction Safety

## Objective

Ensure booking confirmation flows execute atomically across table assignments and booking status transitions while introducing abortable inline auto-assign and shared idempotency safeguards to eliminate split-brain scenarios.

## Success Criteria

- [ ] `atomicConfirmAndTransition` delegates to new SQL RPC to commit assignments + status together; on induced failure booking state and assignments remain unchanged.
- [ ] Inline + background auto-assign share deterministic idempotency key and cancellation handling; background job skips when inline succeeded; telemetry distinguishes timeout/pre/post-confirm outcomes.
- [ ] New Vitest suites cover atomic success, rollback, timeout abort, and idempotency skip; lint + targeted tests pass.

## Architecture & Components

- Supabase migration introducing function `confirm_hold_assignment_with_transition` (name TBD) that wraps `assign_tables_atomic_v2` and `apply_booking_state_transition` in one transaction and returns assignment rows.
- Capacity layer (`server/capacity/tables.ts` or new `atomic.ts`) exposing `atomicConfirmAndTransition` which reuses existing validations, invokes the new RPC, runs reconciliation, handles cleanup, and emits tracing spans.
- `confirmHoldAssignment` updated to optionally use atomic RPC path while preserving legacy behavior for non-transition callers; adds abort-signal propagation.
- `server/booking/auto-assign/cancellable-auto-assign.ts` — encapsulates AbortController timeout logic, signal propagation, cleanup handlers, and telemetry emission for inline/background flows.
- Schema change: new `bookings.auto_assign_idempotency_key` (name TBD) + index plus reconciliation SQL view/function for state checks.
- Observability updates in `server/observability.ts` / `server/capacity/telemetry.ts` to emit transaction boundary spans and metrics `timeout_before_confirm`, `timeout_after_confirm`, `completed_in_time` with idempotency key context.

## Data Flow & API Contracts

- Core function: `atomicConfirmAndTransition(bookingId, holdId, { idempotencyKey, assignedBy, signal, historyReason, historyMetadata })`
  - Performs existing allocator validations (hold ownership, snapshots, adjacency) and computes deterministic window/table payload.
  - Invokes RPC `confirm_hold_assignment_with_transition` with booking metadata, required status (`confirmed`), history context, and table payload; RPC handles transactionally inserting assignments and applying booking state transition.
  - After RPC success, executes reconciliation query `SELECT status AS booking_state, EXISTS(SELECT 1 FROM booking_table_assignments WHERE booking_id=$1) AS assignment_state` to confirm parity; emits tracing/observability.
  - On RPC error: triggers compensating cleanup (`releaseHoldWithRetry`, `unassign_tables_atomic`) and logs error span.
- Cancellation API: `CancellableAutoAssign.runWithTimeout({ bookingId, holdId, timeoutMs })` returns result or throws `AbortError`; ensures cleanup callback executed when aborted.
- Background worker obtains idempotency key from `bookings.auto_assign_idempotency_key`; if booking already confirmed or assignments exist with matching key, skip.

## UI/UX States

- No UI changes; API/logging only.

## Edge Cases

- RPC failure mid-flight → ensure compensating cleanup runs to clear partial assignments/holds.
- Transaction deadlock/serialization failure → leverage retry/backoff (reuse `retryWithBackoff` where applicable).
- Abort triggered after allocator reserved hold but before commit → ensure cleanup prevents orphan holds.
- Duplicate auto-assign attempts with same idempotency key → background path must skip work gracefully.
- Post-commit reconciliation mismatch triggers telemetry + auto cleanup routine; ensure path documented.

## Testing Strategy

- Unit: RPC payload builder + reconciliation utilities, `CancellableAutoAssign`, idempotency key generator.
- Integration: extend `tests/server/capacity/manualConfirm.test.ts` to cover atomic commit + rollback, simulate transaction failure, validate cleanup + state reconciliation; add tests for background skip logic.
- E2E: API inline confirm happy path via Playwright deferred (document if not run locally); rely on integration coverage now.
- Accessibility: N/A (no UI changes).

## Rollout

- Feature flag: consider temporary `FEATURE_ATOMIC_CONFIRM_ENABLED`; default on in staging, toggleable for rollback.
- Exposure: deploy to staging, monitor for one week per success metric before prod rollout.
- Monitoring: dashboards for new telemetry counters + tracing spans; alert on reconciliation mismatches.
- Kill-switch: disable feature flag to revert to existing non-transactional path; maintain compatibility in code.
