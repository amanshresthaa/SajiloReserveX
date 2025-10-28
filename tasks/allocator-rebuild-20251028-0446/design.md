# Allocator v2 Architecture Outline

## Goals

- Deterministic, idempotent table assignments with clear state transitions.
- Separate planning (candidate generation) from persistence (commit/diff) to isolate concerns.
- Provide actionable errors for operators (conflicts, eligibility issues).
- Support staged rollout with dual-run/shadow comparison.

## Core Components

1. **Planning Engine**
   - Inputs: booking context, tables, constraints, feature flags.
   - Output: ordered list of candidate plans (tables, capacity, metadata, diagnostics).
   - Implementation: reuse `selector.ts` with modular scoring, adjacency validation; expose as pure function.

2. **Assignment Orchestrator**
   - Receives a selected plan and orchestrates validation + persistence.
   - Responsibilities:
     - Fetch latest booking/table/hold state.
     - Re-run lightweight conflict checks (holds, assignments, availability window).
     - Call persistence layer (within transaction) to upsert assignments + allocations + ledger.
     - Emit telemetry events (success, skip, conflict) with enriched context.
   - Must be idempotent via idempotency keys.

3. **Persistence Layer**
   - Option A: Supabase RPC v3 (`assign_tables_v3`) encapsulating all writes (preferred for transactional safety).
   - Option B: Application-managed transaction using Postgres client (requires service account connection pooling).
   - Schema considerations:
     - Potential new tables: `assignment_attempts`, `assignment_conflicts` for audit.
     - Revisit `booking_assignment_idempotency` to track plan hash, actor, status.
     - Merge-group representation: consider explicit `merge_groups` table (if not already present) or JSON metadata on assignments.

4. **API Layer**
   - Manual endpoints (`/manual/*`) to call planner → orchestrator, returning structured responses.
   - Auto endpoints / schedulers to trigger orchestrator, optionally in batch (per date/zone).
   - Provide consistent HTTP error codes (`409` for conflict with details, `422` for validation errors, `503` for dependency issues).

5. **Feature Flag & Config Layer**
   - Introduce `allocator.v2.enabled`, `allocator.v2.shadow`, `allocator.v2.forceLegacy` flags.
   - Planner behaviour toggles (combination planner, adjacency) continue to derive from `lib/env.ts` but orchestrator chooses v1/v2 persistence based on flag.
   - Flags accessible via `server/feature-flags` helper for runtime decisions.

6. **Telemetry & Monitoring**
   - Standard event payload: booking, plan id/hash, actor, outcome, skip reason.
   - Metrics: success rate, conflict rate, merge utilisation, retry count, duration.
   - Logging: structured logs for each assignment attempt (start → end) to support debugging.

## Sequence Overview (Textual)

1. **Manual Confirm**
   1. Client requests confirm with `bookingId`, `holdId`, `idempotencyKey`.
   2. API loads hold, expands plan context, calls planner (if needed for alternates) and orchestrator with chosen tables.
   3. Orchestrator commits in transaction, returns assignments. On conflict, returns explicit code `CONFLICT_EXISTING_ASSIGNMENT` with table/time info.

2. **Auto Assign**
   1. Scheduler iterates bookings lacking assignments.
   2. For each, planner generates ranked plans.
   3. Orchestrator attempts commit; on conflict, captures diagnostics, optionally tries next candidate, emits skip event.

3. **Unassign/Release**
   - Provide API to release assignment safely (call new RPC or reuse `unassign_tables_atomic`), updating audit logs.

```
Manual Confirm (Happy Path)

User -> API        : POST /manual/confirm (bookingId, holdId, key)
API  -> Orchestrator: confirmHold(holdId, bookingId, key)
Orchestrator -> Planner: getPlanFromHold()
Planner -> Orchestrator: Plan tables + diagnostics
Orchestrator -> Repository: commitAssignment(plan, context)
Repository -> Supabase: execute RPC/transaction
Supabase -> Repository: success payload
Repository -> Orchestrator: committed assignments
Orchestrator -> Telemetry: emit assignment.success
Orchestrator -> API: { assignments, mergeGroupId }
API -> User: 200 OK
```

```
Auto Assign (Conflict)

Scheduler -> API        : POST /auto/confirm (bookingId)
API -> Orchestrator     : autoAssign(bookingId)
Orchestrator -> Planner : generatePlans()
Planner -> Orchestrator : [PlanA, PlanB]
Orchestrator -> Repository: commitAssignment(PlanA)
Supabase -> Repository   : unique_violation (table conflict)
Repository -> Orchestrator: error (conflict metadata)
Orchestrator -> Telemetry: emit assignment.conflict
Orchestrator -> Tracker  : record attempt (status=conflict)
Orchestrator -> API      : 409 with conflict details
API -> Scheduler         : log skip reason
```

## API Contracts (Draft)

### Manual Confirm `POST /api/staff/manual/confirm`

Request

```jsonc
{
  "bookingId": "uuid",
  "holdId": "uuid",
  "idempotencyKey": "string",
  "planSignature": "string", // optional if client replays plan hash
  "requireAdjacency": true,
}
```

Response 200

```jsonc
{
  "bookingId": "uuid",
  "holdId": "uuid",
  "assignments": [
    {
      "tableId": "uuid",
      "startAt": "iso8601",
      "endAt": "iso8601",
      "mergeGroupId": "uuid | null",
      "planSignature": "string",
    },
  ],
  "telemetryId": "uuid",
}
```

Error 409 (conflict)

```jsonc
{
  "code": "CONFLICT_EXISTING_ASSIGNMENT",
  "message": "Table overlap",
  "details": {
    "tableIds": ["uuid"],
    "window": {
      "start": "iso8601",
      "end": "iso8601",
    },
    "blockingBookingId": "uuid",
  },
  "hint": "Release table or choose alternate plan",
}
```

### Auto Assign `POST /api/staff/auto/confirm`

Request: `{ "bookingId": "uuid", "idempotencyKey": "optional", "options": { "maxPlans": 5 } }`

Response:

```jsonc
{
  "bookingId": "uuid",
  "status": "assigned | skipped",
  "assignments": [...],
  "skipReason": null,
  "diagnostics": {
    "plansConsidered": 3,
    "conflicts": [ { "tableId": "uuid", "bookingId": "uuid" } ]
  }
}
```

### Assignment Commit Interface

```ts
type AssignmentCommitRequest = {
  bookingId: string;
  plan: {
    tableIds: string[];
    startAt: string;
    endAt: string;
    metadata?: Record<string, unknown>;
  };
  idempotencyKey: string;
  actorId: string | null;
  source: 'manual' | 'auto';
};
```

Repository returns `{ assignments: Assignment[], mergeGroupId?, attemptId }` or throws domain-specific error (`AssignmentConflictError`, `HoldStaleError`, `RepositoryUnavailableError`).

## Data Model Changes (Draft)

- `booking_table_assignments`
  - Add columns: `status` (pending/committed/failed), `source` (manual/auto), `plan_id`, `attempt_id`.
  - Ensure merge-group tracking is consistent (possibly via `merge_group_id` + `merge_group_size`).
- `booking_assignment_attempts` (new)
  - `id`, `booking_id`, `plan_signature`, `status`, `actor_id`, `created_at`, `details JSONB`.
- `planner_diagnostics` (optional materialised view/log) for analytics.
- `booking_assignment_conflicts` (optional log)
  - `attempt_id`, `table_id`, `blocking_booking_id`, `conflict_type`, `window`.
- Consider consolidating `booking_assignment_idempotency` → `assignment_attempts` with proper indexing.

## Migration Strategy

1. Introduce new tables/columns with defaults, backfill existing data.
2. Create new RPC/transaction functions operating on v2 schema.
3. Implement orchestrator calling v2 path behind flag.
4. Shadow mode: read legacy outputs, compare with v2 results, log diffs.
5. Cutover: flip flag, decommission legacy code, archive old RPC.

### Migration Draft Steps

1. `ALTER TABLE booking_table_assignments ADD COLUMN status text DEFAULT 'committed';`
2. `ALTER TABLE booking_table_assignments ADD COLUMN source text DEFAULT 'legacy';`
3. `CREATE TABLE booking_assignment_attempts (...);`
4. Backfill existing rows with `status='committed', source='legacy', plan_id = NULL`.
5. Create RPC `assign_tables_v3(booking_id uuid, table_ids uuid[], context jsonb)` that:
   - Validates booking/table state
   - Inserts into `booking_assignment_attempts`
   - Upserts `booking_table_assignments`
   - Maintains allocations and merge groups
6. Add triggers or stored procedures to keep `booking_assignment_attempts` in sync.
7. Update service code to write to both v2 and v3 in shadow mode.

## Open Issues

- Decide between RPC vs application-level transactions.
- Define plan signature/hash for idempotency and telemetry correlation.
- Determine support for mixed environments where combination planner disabled.
- Align with reporting/analytics expectations (existing dashboards).

## Feature Flag Strategy

- `allocator.v2.shadow`: run planner + orchestrator in read-only mode, compare results with legacy allocator, emit diff metrics.
- `allocator.v2.commit`: enable new persistence path for a subset of bookings (e.g., restaurant allow list).
- `allocator.v2.forceLegacy`: emergency kill-switch to revert to v1 without redeploying.
- Flags stored in env/config service, accessible via `server/feature-flags` helpers.

## Stakeholder Review Plan

1. Circulate this design doc + proposed SQL to Capacity/OPS/Product (Slack + Notion).
2. Host review meeting to walk through components, sequences, rollout & risk mitigations.
3. Capture sign-offs, required tweaks, and update plan/todo accordingly before Phase 2 implementation.

## Next Steps

- Flesh out sequence diagrams (manual confirm, auto assign, retry).
- Draft migration SQL (tables, constraints, new RPC signature).
- Prepare stakeholder design review.
