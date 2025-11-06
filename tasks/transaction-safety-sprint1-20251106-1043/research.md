# Research: Sprint 1 Transaction Safety

## Requirements

- Functional:
  - Story 1.1: execute `confirmHoldAssignment` and `apply_booking_state_transition` inside a single DB transaction; introduce compensating rollback; add pre/post reconciliation checks; cover failure atomicity with integration/chaos tests.
  - Story 1.2: replace inline auto-assign `Promise.race` timeout with abortable flow; propagate `AbortSignal` through confirmation chain; ensure outcome logging differentiates timeout vs success/failure; guarantee state transitions await confirmation before proceeding; add cleanup on abort and updated metrics/tests.
  - Story 1.3: emit deterministic idempotency token at booking creation; persist token so inline/background paths share it; enforce idempotent processing (background skip if inline already succeeded); include token in telemetry; add remote schema support (column + index); validate via tests covering timeout recovery.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Data integrity: avoid split-brain states between booking status and table assignments.
  - Observability: enrich tracing/logging for transaction boundaries and timeout outcomes.
  - Remote-only DB changes per `AGENTS.md`; ensure migrations/rollbacks plan recorded.
  - Backward compatibility for existing booking flows (manual, ops jobs).

## Existing Patterns & Reuse

- `server/capacity/tables.ts:2593` — current `confirmHoldAssignment` orchestrates Supabase lookups, adjacency validation, and RPC `assign_tables_atomic_v2`, then calls `releaseHoldWithRetry` and `synchronizeAssignments`.
- `server/jobs/auto-assign.ts:120-205` — background auto-assign runs `confirmHoldAssignment` then `supabase.rpc("apply_booking_state_transition", …)` separately; logs via `recordObservabilityEvent`.
- `src/app/api/bookings/route.ts:741-838` — inline auto-assign uses chained `Promise.race` timeouts for quote/confirm, then transitions status and emails.
- `tests/server/capacity/manualConfirm.test.ts` — rich supabase-client mocks for `confirmHoldAssignment`; baseline for adding atomicity/idempotency tests.
- `server/capacity/tables.ts:3062-3074` — `unassignTableFromBooking` calls RPC `unassign_tables_atomic`; usable for rollback cleanup.
- Telemetry utilities in `server/capacity/telemetry.ts` and `server/observability.ts` handle structured observability events; extend for new spans/keys.

## External Resources

- Supabase Postgres RPC + `assign_tables_atomic_v2` implementation (`supabase/schema.sql:981-1428`) — understand transactional guarantees inside allocator RPC.
- Supabase documentation for Postgres connection URLs (for potential direct transaction handling via `SUPABASE_DB_URL`).

## Constraints & Risks

- Supabase JS client lacks cross-request transactions; to span `confirmHoldAssignment` + state transition we likely need a pooled Postgres connection (`pg`/`postgres`) using `SUPABASE_DB_URL` or a new RPC wrapper. Must guarantee this is permitted in runtime environment.
- Allocator logic currently lives in Typescript; porting to SQL is impractical, so transaction solution must reuse existing TS code paths without duplicating allocator rules.
- Background jobs and manual confirmation routes reuse `confirmHoldAssignment`; refactor must remain backwards compatible and avoid deadlocks.
- Remote DB migration required for new idempotency storage; need rollback strategy and documentation per `AGENTS.md`.
- Chaos tests may need to simulate mid-transaction failures; ensure test harness can stub transaction client without real DB access.

## Open Questions (owner, due)

- Q: Can we rely on `SUPABASE_DB_URL` (or similar) in production/staging runtime to open direct transactions? (Owner: Backend Lead, before design finalization)
- Q: Should the new booking idempotency column be distinct (e.g., `auto_assign_idempotency_key`) to avoid overloading existing `bookings.idempotency_key`? (Owner: Backend Lead, before migration)
- Q: Preferred tracing tool for transaction spans (existing `recordObservabilityEvent` vs. OpenTelemetry wrappers)? (Owner: Observability, before implementation)

## Recommended Direction (with rationale)

- Create a dedicated Postgres stored procedure (e.g., `confirm_hold_assignment_with_transition`) that wraps `assign_tables_atomic_v2` and `apply_booking_state_transition` in a single transaction and returns the same assignment payload, letting allocator logic remain in TypeScript while the critical commit happens atomically on the server.
- Refactor `confirmHoldAssignment` (or a new `atomicConfirmAndTransition`) to call the new RPC after existing pre-checks, threading idempotency key, required metadata, and history context; retain TypeScript for hold validation and post-commit synchronization while ensuring fallback cleanup triggers if the RPC fails.
- For inline/background auto-assign, encapsulate timeout handling in a `CancellableAutoAssign` utility that leverages `AbortController`; propagate `signal` through `quoteTablesForBooking`/`confirmHoldAssignment` by wiring Supabase queries with `.abortSignal(signal)` and explicit abort guards; update telemetry counters for timeout stages and ensure emails/send flows respect abort.
- Extend booking schema with dedicated auto-assign idempotency metadata (new column + index) and store deterministic key at booking creation; thread key through job payloads/observability; add reconciliation query helper that compares booking status vs assignment presence before/after confirmation to detect split-brain.
- Expand Vitest integration tests to cover: transaction successful commit, simulated failure causing rollback (assignments removed, state unchanged), timeout abort path deferring to background retry, and idempotency guard preventing duplicate work.
