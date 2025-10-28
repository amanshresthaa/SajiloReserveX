# Implementation Plan: Allocator Rebuild

## Objective

We will design and implement a next-generation table assignment allocator that separates planning from persistence, eliminates duplicate assignment deadlocks, and supports both manual and automated flows with explicit state transitions.

## Success Criteria

- [ ] Document current allocator surface area (APIs, RPCs, tables, scheduled jobs, telemetry) and identify gaps.
- [ ] Produce a signed-off architecture/design review covering planning engine, persistence service, idempotency, and observability.
- [ ] Ship the new allocator behind feature flags, validate via shadow traffic/manual QA, then cut over without blocking bookings.

## Architecture & Components

- **Planner Service**
  - Stateless engine to generate ranked table plans (reuse/improve `selector.ts`).
  - Accepts restaurant context, booking window, constraints, and returns candidates with metadata (capacity, adjacency, merge viability).
- **Assignment Orchestrator**
  - New server module responsible for taking a plan, performing conflict checks, and committing assignments.
  - Abstract persistence with a repository interface (Supabase implementation initially) to isolate SQL details.
- **Persistence Layer**
  - Supabase RPC v3 or application-managed transactions.
  - Defines schema changes (e.g., explicit assignment states, merge group table) and handles idempotency, merge allocation, audit logs.
- **Hold & Manual Workflow**
  - Rebuilt endpoints (`/manual/hold|validate|confirm`) interacting with the orchestrator.
  - Provides clearer error taxonomy and recovery guidance.
- **Auto Assignment Pipeline**
  - Updated worker/API to call planner → orchestrator, with retry and conflict resolution strategy.
- **Telemetry & Observability**
  - Consistent event model (selector decisions, assignments, conflicts) for dashboards and alerting.

## Data Flow & API Contracts

1. **Manual confirm**: client sends `{ bookingId, holdId, selectionId/idempotencyKey }` → orchestrator loads hold, validates tables, commits assignment, returns assignment bundle + merge metadata.
2. **Auto assign**: scheduler posts booking id → orchestrator fetches plans, simulates conflicts, commits best candidate, stores audit trail.
3. **Persistence API**: orchestrator issues `AssignmentCommitRequest` with booking id, table ids, window, actor, idempotency key → repository ensures transactional write (plans to implement via Supabase RPC v3 or Node-managed SQL transaction over pooled connection).

Request/response schemas, error codes, and versioning to be specified during design sign-off.

## UI/UX States

- Manual tools must expose new error messages (e.g., conflict, eligibility, adjacency failure) and allow retry after remediation.
- Auto operations should surface skip reasons and next steps in ops dashboards.

## Edge Cases

- Concurrent manual/auto assignments on same booking.
- Merge plans split across zones or involving non-movable tables.
- Idempotent retries after partial failure (network drop, crash) without orphaned allocations.
- Legacy data without merge support / combination planner flag disabled.
- Rollback when mid-transaction conflict occurs.

## Testing Strategy

- **Unit**: planner scoring, orchestrator state machine, repository error handling.
- **Integration**: end-to-end assignment via Supabase (mock + staging) covering merges, conflicts, retries, ledger updates.
- **Regression**: ensure legacy paths (e.g., hold release, manual validate) remain functional during dual-run period.
- **Shadow testing**: compare decisions between legacy allocator and new orchestrator before cutover.
- **Manual QA**: Chrome DevTools MCP for manual flows; Playwright for critical UI.

## Rollout

1. **Phase A**: Discovery & design review sign-off.
2. **Phase B**: Incremental implementation with feature flag `allocator.v2` (dual write / read-only evaluation).
3. **Phase C**: Staging validation, load tests, observability dashboards.
4. **Phase D**: Production rollout guarded by flag → progressive ramp.
5. **Phase E**: Decommission legacy RPCs/endpoints, archive documentation, update runbooks.
