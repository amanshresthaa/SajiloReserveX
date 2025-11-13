---
task: enable-assignment-pipeline-v3
timestamp_utc: 2025-11-13T09:31:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: [FEATURE_ASSIGNMENT_PIPELINE_V3, FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW]
related_tickets: []
---

# Research: Enable Assignment Pipeline V3

## Requirements

### Functional

- Enable the new AssignmentCoordinator-based booking assignment flow
- Transition from legacy planner loop to state machine-driven architecture
- Maintain backward compatibility during rollout via shadow mode
- Preserve existing observability and telemetry
- Support graceful rollback to legacy flow if issues arise

### Non-functional

- **Observability**: All state transitions emit `assignment.state_machine` events
- **Performance**: Coordinator uses distributed locks, rate limiting, circuit breakers
- **Reliability**: Shadow mode allows validation without risk to production bookings
- **Security**: No changes to auth/authorization; uses existing service role patterns
- **Privacy**: No PII exposure in new observability events
- **i18n**: N/A (backend-only change)

## Existing Patterns & Reuse

### Current Implementation (V3 Already Built)

The Assignment Pipeline V3 infrastructure is **already implemented** in `server/assignments/`:

- **AssignmentCoordinator** (`assignment-coordinator.ts`): Main orchestrator
  - Locks: `DistributedLockManager` with Redis-backed distributed locks
  - State: `BookingStateMachine` with optimistic versioning
  - Engine: `SmartAssignmentEngine` with strategy registry
  - Protection: `CircuitBreaker` + `RateLimiter` for stability
  - States: `Created → Capacity Verified → Assignment Pending → Assignment In Progress → Assigned → Confirmed` (or `Manual Review` on failure)

- **State Machine** (`state-machine.ts`):
  - Enforces valid transitions via `BookingAssignmentState` enum
  - Optimistic locking with `assignment_state_version`
  - Records history in `booking_assignment_state_history`
  - Emits `booking.assignment_state_transition` events

- **Observability Events** (already instrumented):
  - Source: `assignment.state_machine`
  - Event: `booking.assignment_state_transition`
  - Context: `{ from, to, version, metadata }`

### Integration Point

The coordinator is **already wired** into `server/jobs/auto-assign.ts`:

```typescript
if (isAssignmentPipelineV3Enabled()) {
  const coordinatorResult = await assignmentCoordinator.processBooking(booking.id, reason);
  await handleCoordinatorResult({ ... });
  return;
}
// Legacy planner loop follows...
```

### Feature Flag Architecture

Three flags control the rollout (defined in `lib/env.ts` + `config/env.schema.ts`):

1. **FEATURE_ASSIGNMENT_PIPELINE_V3**: Main kill switch (enabled = use coordinator)
2. **FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW**: Shadow mode (run coordinator + legacy, compare)
3. **FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL**: Concurrency limit per restaurant (default: 3)

**Current logic** (`server/feature-flags.ts`):

- `isAssignmentPipelineV3Enabled()`: Returns `enabled` flag value
- `isAssignmentPipelineV3ShadowMode()`: Returns `shadow` flag value
- Coordinator's `processBooking()`: Returns early with `noop` if both flags are false

## External Resources

- [AGENTS.md](/AGENTS.md) — SDLC workflow, task structure, observability requirements
- [Assignment Architecture Plan](/tasks/booking-architecture-20251112-2349/plan.md) — Original V3 design doc
- [Assignment State Machine Docs](/src/lib/booking/state-machine.ts) — Client-side state machine mirroring backend

## Constraints & Risks

### Constraints

- **Remote Supabase Only**: All migrations/queries hit remote (staging → prod), no local DB
- **No Schema Changes**: All tables (`bookings`, `booking_assignment_state_history`, `booking_assignment_attempts`) already exist
- **Existing Observability**: Must preserve current `auto_assign.*` events for legacy flow during transition
- **Email Idempotency**: Must not send duplicate confirmation emails when switching between flows

### Risks

| Risk                       | Likelihood | Impact | Mitigation                                          |
| -------------------------- | ---------- | ------ | --------------------------------------------------- |
| Coordinator loop/deadlock  | Low        | High   | Circuit breaker + timeout; shadow mode first        |
| Lock contention spike      | Medium     | Medium | Rate limiter (3/restaurant); monitor `lock.wait_ms` |
| State transition race      | Low        | Medium | Optimistic locking with `assignment_state_version`  |
| Missing observability data | Medium     | Low    | Shadow mode validates events before full rollout    |
| Legacy code regression     | Low        | Medium | Keep legacy path intact until V3 stable at 100%     |

## Open Questions

1. **Q**: What is the target environment for initial enablement?
   **A**: Start with **local dev**, then **staging shadow**, then **staging full**, finally **production shadow → full**

2. **Q**: What are the success criteria for each phase?
   **A**: See plan.md; summary: 0 errors, comparable success rate to legacy, no P0/P1 issues

3. **Q**: How long should shadow mode run in each environment?
   **A**: Minimum 24 hours with production-like load; staging should see 100+ bookings

4. **Q**: What triggers rollback?
   **A**: Circuit breaker open for >5 minutes, manual review queue exceeds 10% of bookings, or P0 bug

5. **Q**: When can we delete the legacy planner loop?
   **A**: After V3 runs stable in production at 100% for 7 days with no incidents

## Recommended Direction (with rationale)

### Phase 1: Shadow Mode (Staging)

- Set `FEATURE_ASSIGNMENT_PIPELINE_V3=false` + `FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=true`
- Coordinator runs in **read-only mode** (compares results but doesn't persist)
- Monitor `observability_events` for:
  - `assignment.state_machine` event volume
  - `coordinator.*` success/error rates
  - Comparison with legacy planner outcomes
- **Rationale**: Zero risk; validates instrumentation and logic before live traffic

### Phase 2: Full Enablement (Staging)

- Flip `FEATURE_ASSIGNMENT_PIPELINE_V3=true` + `FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false`
- All new bookings route through coordinator
- Legacy path still exists but inactive (for emergency rollback)
- Monitor for 24-48 hours with production-like load
- **Rationale**: Staging is safe sandbox; catch integration issues before production

### Phase 3: Shadow Mode (Production)

- Repeat Phase 1 in production
- Run for minimum 24 hours (ideally 48-72 hours during peak booking times)
- **Rationale**: Production traffic patterns may differ from staging; shadow mode de-risks

### Phase 4: Gradual Production Rollout

- Start at 10% of restaurants (feature flag per restaurant if needed)
- Monitor for 24 hours
- Increase to 50%, then 100% over 3-5 days
- **Rationale**: Blast radius control; allows rollback without full outage

### Phase 5: Legacy Cleanup (Post-Validation)

- After 7 days stable at 100% in production
- Remove legacy planner loop from `server/jobs/auto-assign.ts`
- Archive deprecated code in git history
- Update documentation
- **Rationale**: Keep legacy code during transition for safety; clean up after confidence established

### Observability Dashboard Queries

Monitor these events in `observability_events` table:

**State Machine Activity**:

```sql
SELECT
  event_type,
  context->>'from' as from_state,
  context->>'to' as to_state,
  COUNT(*) as transition_count,
  DATE_TRUNC('hour', created_at) as hour
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1, 2, 3, 5
ORDER BY 5 DESC, 4 DESC;
```

**Coordinator Success Rate**:

```sql
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE event_type LIKE '%success%') as successes,
  COUNT(*) FILTER (WHERE event_type LIKE '%error%' OR event_type LIKE '%failure%') as errors,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE event_type LIKE '%success%') / NULLIF(COUNT(*), 0), 2) as success_rate_pct
FROM observability_events
WHERE source LIKE 'assignment.%'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1 DESC;
```

**Manual Review Queue Growth**:

```sql
SELECT COUNT(*) as manual_review_count
FROM bookings
WHERE assignment_state = 'manual_review'
  AND created_at > NOW() - INTERVAL '24 hours';
```
