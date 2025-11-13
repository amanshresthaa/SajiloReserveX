---
task: enable-assignment-pipeline-v3
timestamp_utc: 2025-11-13T09:31:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: [FEATURE_ASSIGNMENT_PIPELINE_V3, FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW]
related_tickets: []
---

# Implementation Plan: Enable Assignment Pipeline V3

## Objective

Enable the AssignmentCoordinator-based booking assignment flow (V3) to replace the legacy planner loop, using a shadow-first rollout strategy to ensure stability and observability before full production cutover.

## Success Criteria

- [ ] Shadow mode runs successfully in staging for 24+ hours with 0 errors
- [ ] Full enablement in staging shows comparable success rate to legacy (≥95%)
- [ ] Production shadow mode validates observability events match expected patterns
- [ ] Production full rollout completes with 0 P0/P1 incidents
- [ ] Observability dashboard shows:
  - State transitions flow correctly (created → ... → confirmed)
  - Coordinator success rate ≥95%
  - Manual review queue <10% of total bookings
  - No circuit breaker opens for >5 minutes
- [ ] Legacy planner loop safely removed after 7 days stable at 100%

## Architecture & Components

### Existing Components (No Code Changes Needed)

All V3 infrastructure is **already implemented**:

- **AssignmentCoordinator** (`server/assignments/assignment-coordinator.ts`)
  - Orchestrates booking assignment lifecycle
  - Manages locks, state transitions, engine invocation
  - Handles success/retry/manual-review outcomes

- **BookingStateMachine** (`server/assignments/state-machine.ts`)
  - Enforces valid state transitions
  - Optimistic locking via `assignment_state_version`
  - Records history + emits observability events

- **SmartAssignmentEngine** (`server/assignments/assignment-engine.ts`)
  - Strategy registry (optimal fit, adjacency, load balancing)
  - Integrates with existing `quoteTablesForBooking` logic

- **Supporting Infrastructure**
  - `DistributedLockManager`: Redis-backed distributed locks
  - `CircuitBreaker`: Failure threshold + cooldown
  - `RateLimiter`: Max concurrent per restaurant
  - `TableAvailabilityTracker`: Cached table availability snapshots

### Integration Point

`server/jobs/auto-assign.ts` already has the conditional:

```typescript
if (isAssignmentPipelineV3Enabled()) {
  const coordinatorResult = await assignmentCoordinator.processBooking(booking.id, reason);
  await handleCoordinatorResult({ ... });
  return;
}
// Legacy planner loop continues below...
```

**No code changes required** — only environment variable configuration.

## Data Flow & API Contracts

### Current Flow (Legacy)

```
Booking Created
  → autoAssignAndConfirmIfPossible()
    → Loop: attempt = 0..maxRetries
      → quoteTablesForBooking() // inline planner
      → atomicConfirmAndTransition() // if successful
      → recordObservabilityEvent('auto_assign.summary')
    → Send confirmation email
```

### New Flow (V3)

```
Booking Created
  → autoAssignAndConfirmIfPossible()
    → assignmentCoordinator.processBooking()
      ↓
    1. Acquire lock (`booking:{id}`)
    2. Check circuit breaker (skip if open)
    3. Acquire rate limit permit
    4. Transition: created → capacity_verified → assignment_pending
    5. Build assignment context (tables, policy, timeslot)
    6. SmartAssignmentEngine.findOptimalAssignment()
       → Tries multiple strategies (optimal_fit, adjacency, etc.)
       → Returns scored plans
    7. Transition: assignment_in_progress → assigned
    8. atomicConfirmAndTransition() (same as legacy)
    9. Transition: assigned → confirmed
   10. Record attempts in `booking_assignment_attempts`
   11. Release rate limit + lock
      ↓
    handleCoordinatorResult()
      → Send confirmation email (if not already sent)
      → Emit observability events
```

### Observability Events (No Changes Needed)

**Existing Events** (preserved):

- `auto_assign.summary` (from legacy flow)
- `auto_assign.quote` (planner telemetry)
- `booking.confirmed` (status change)

**New Events** (already instrumented):

- `booking.assignment_state_transition` (source: `assignment.state_machine`)
  - Context: `{ from, to, version, metadata }`
- Outbox events: `booking.assignment_state.{state}` (for event bus)

### State Transitions

```
created
  ↓ (auto)
capacity_verified
  ↓ (auto)
assignment_pending
  ↓ (coordinator starts)
assignment_in_progress
  ↓
  ├─→ assigned → confirmed (success)
  ├─→ assignment_pending (retry, <5 attempts)
  └─→ manual_review (exhausted retries)
```

Terminal states: `confirmed`, `manual_review`, `failed`

## UI/UX States

**No UI changes required** for this rollout. Future enhancements:

- Ops dashboard could show new assignment states (`assignment_in_progress`, `manual_review`)
- Manual review queue view (separate task)
- Real-time status updates via WebSocket (future)

## Edge Cases

1. **Booking already confirmed by inline flow**
   - Coordinator returns `{ outcome: "noop", reason: "terminal_state" }`
   - No email sent (handled by `shouldSkipEmailForJob()`)

2. **Lock contention (concurrent assignment attempts)**
   - Coordinator returns `{ outcome: "noop", reason: "lock_contention" }`
   - Job reschedules or relies on next trigger

3. **Circuit breaker open**
   - Coordinator returns `{ outcome: "retry", delayMs: ... }`
   - Job backs off; circuit recovers after cooldown

4. **Rate limit exceeded**
   - Coordinator throws `RateLimitExceededError`
   - Caught and converted to `{ outcome: "retry", delayMs: 2000 }`

5. **State transition race (version mismatch)**
   - Optimistic lock fails; `StateTransitionError` thrown
   - Coordinator aborts; next attempt reloads fresh state

6. **Legacy flow already sent email**
   - `auto_assign_last_result.emailSent` flag checked
   - Coordinator skips email via `inlineEmailAlreadySent` param

## Testing Strategy

### Unit Tests (Already Exist)

- `tests/server/booking/booking-state-machine-provider.test.ts`
- State machine reducer tests
- Transition validation tests

### Integration Tests (Manual QA)

- Create booking → verify coordinator processes it
- Check `observability_events` for state transitions
- Verify `booking_assignment_attempts` records
- Confirm email sent exactly once
- Test lock contention (parallel bookings same restaurant)
- Trigger circuit breaker (force failures)
- Exhaust retries → verify manual review state

### Performance Tests

- Load test with 100+ concurrent bookings
- Measure coordinator latency (target: P95 <3s)
- Monitor lock wait times (target: P95 <100ms)
- Validate rate limiter (max 3 concurrent/restaurant)

### Accessibility

N/A (backend-only change; no UI changes in this task)

## Rollout

### Phase 1: Local Development (Optional Testing)

**Environment**: Developer machine
**Config**:

```bash
FEATURE_ASSIGNMENT_PIPELINE_V3=true
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**Duration**: Ad-hoc testing
**Exit Criteria**: Developer confirms basic flow works

---

### Phase 2: Staging Shadow Mode

**Environment**: Staging
**Config**:

```bash
FEATURE_ASSIGNMENT_PIPELINE_V3=false
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=true
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**Behavior**:

- Legacy flow runs as normal (production path)
- Coordinator runs in parallel (shadow; results logged but not persisted)
- Compare outcomes: legacy vs. coordinator

**Monitoring**:

- [ ] `observability_events` shows `assignment.state_machine` events
- [ ] Coordinator logs show successful plan finding
- [ ] No errors in coordinator execution
- [ ] Shadow results match legacy success rate (±5%)

**Duration**: 24 hours minimum (or 100+ bookings)

**Exit Criteria**:

- [ ] 0 coordinator errors
- [ ] Event volume matches expected booking volume
- [ ] Manual inspection of 10+ sample bookings shows correct state transitions

---

### Phase 3: Staging Full Enablement

**Environment**: Staging
**Config**:

```bash
FEATURE_ASSIGNMENT_PIPELINE_V3=true
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**Behavior**:

- Coordinator is primary path
- Legacy code inactive (but still present for rollback)

**Monitoring**:

- [ ] Booking confirmation success rate ≥95%
- [ ] Manual review queue <10% of bookings
- [ ] Circuit breaker never opens (or recovers quickly)
- [ ] No duplicate emails sent
- [ ] P95 assignment latency <3s

**Duration**: 48 hours minimum

**Exit Criteria**:

- [ ] All success criteria met
- [ ] No P0/P1 bugs
- [ ] Sign-off from QA + engineering lead

---

### Phase 4: Production Shadow Mode

**Environment**: Production
**Config**:

```bash
FEATURE_ASSIGNMENT_PIPELINE_V3=false
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=true
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**Behavior**: Same as Phase 2, but with real production traffic

**Monitoring**: Same queries as Phase 2

**Duration**: 24-48 hours (include peak booking times)

**Exit Criteria**:

- [ ] 0 coordinator errors
- [ ] Shadow results match legacy (±5%)
- [ ] Observability events flowing correctly

---

### Phase 5: Production Gradual Rollout

**Environment**: Production

**5a. 10% Rollout** (Day 1)

```bash
FEATURE_ASSIGNMENT_PIPELINE_V3=true
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

_Note: If per-restaurant gating is needed, implement feature flag override in code_

**Monitoring**:

- Monitor subset of restaurants
- Watch for anomalies in success rate
- Check manual review queue growth

**Duration**: 24 hours

**Exit**: No issues detected

---

**5b. 50% Rollout** (Day 2)

- Expand to 50% of restaurants/bookings
- Continue monitoring

**Duration**: 24 hours

**Exit**: Metrics stable

---

**5c. 100% Rollout** (Day 3)

- Full production traffic through V3
- Legacy code still present (inactive)

**Duration**: 7 days minimum

**Exit**: 7 days with 0 incidents, success rate stable

---

### Phase 6: Legacy Cleanup (Week 2+)

**Action**: Remove legacy planner loop from `server/jobs/auto-assign.ts`

**Steps**:

1. Create new task: `cleanup-legacy-assignment-loop-YYYYMMDD-HHMM`
2. Identify code to remove:
   - Legacy `while (attempt < maxAttempts)` loop
   - `quoteTablesForBooking` inline calls in job context
   - Conditional helpers specific to legacy flow
3. Archive in git history (don't force-push)
4. Update documentation/comments
5. Run full test suite
6. Deploy to staging → production

**Exit**: Legacy code removed; V3 is sole assignment path

## Monitoring & Observability

### Key Metrics Dashboard

**Success Rates**:

- Overall booking confirmation rate (target: ≥95%)
- Coordinator success rate (target: ≥95%)
- Manual review rate (target: <10%)

**Performance**:

- Assignment latency P50/P95/P99 (target: P95 <3s)
- Lock acquisition time P95 (target: <100ms)
- Circuit breaker status (open/closed)

**State Transitions**:

- Bookings per state over time
- Transition error rate (target: <1%)

**Email Delivery**:

- Confirmation emails sent
- Duplicate email rate (target: 0%)

### Alerts (Recommended)

```yaml
- name: coordinator_high_error_rate
  condition: error_rate > 5% over 10min
  severity: P1
  action: Alert on-call; consider rollback

- name: circuit_breaker_open
  condition: circuit_open_duration > 5min
  severity: P2
  action: Investigate; may need config adjustment

- name: manual_review_queue_spike
  condition: manual_review_count > 20% of bookings
  severity: P2
  action: Check for capacity issues or engine bugs

- name: coordinator_latency_high
  condition: p95_latency > 5s over 15min
  severity: P3
  action: Check for lock contention or DB slowness
```

### Rollback Procedure

**Immediate Rollback** (Emergency):

1. Set `FEATURE_ASSIGNMENT_PIPELINE_V3=false` in environment
2. Restart application (or wait for config refresh)
3. Legacy flow takes over immediately
4. File incident report; analyze logs

**Partial Rollback** (Gradual):

- Reduce rollout percentage (e.g., 50% → 10%)
- Monitor for stabilization
- Investigate root cause before re-expanding

### Kill Switch

The feature flag itself is the kill switch:

- `FEATURE_ASSIGNMENT_PIPELINE_V3=false` → V3 disabled
- Coordinator returns `noop`; legacy flow executes
- No code deployment needed

## DB Change Plan

**No database changes required** — all schema already deployed:

- `bookings.assignment_state` (text)
- `bookings.assignment_state_version` (integer)
- `bookings.assignment_strategy` (text)
- `booking_assignment_state_history` (table)
- `booking_assignment_attempts` (table)

## Documentation Updates

- [x] Update `.env.example` with V3 rollout guidance (already present)
- [ ] Add V3 section to `FEATURES_SUMMARY.md`
- [ ] Create observability runbook (separate task)
- [ ] Update API docs if public endpoints added (N/A for now)
