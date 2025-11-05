# Table Assignment Logic - Pitfalls & Risk Analysis

**Date:** 2025-11-05
**Scope:** Manual & Auto Table Assignment (Database + Application Layer)
**Reviewer:** AI Code Analysis

---

## Executive Summary

The table assignment system is complex with logic split across database procedures, application services, and feature flags. This analysis identifies **27 significant pitfalls** across 6 categories:

1. **Database-Level Issues** (7 pitfalls)
2. **Application Logic Bugs** (10 pitfalls)
3. **Race Conditions** (5 pitfalls)
4. **Edge Cases** (8 pitfalls)
5. **Performance Issues** (5 pitfalls)
6. **Configuration Risks** (4 pitfalls)

### Severity Rating
- 🔴 **Critical**: Could cause data corruption or booking conflicts
- 🟡 **High**: Could cause incorrect assignments or user-facing errors
- 🟢 **Medium**: Could cause sub-optimal behavior or degraded experience
- 🔵 **Low**: Potential improvements or minor issues

---

## 1. Database-Level Issues

### 🔴 P1.1: Advisory Lock Scope Too Narrow
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:201-203`

**Issue:**
```sql
v_lock_zone := hashtext(COALESCE(v_zone_id::text, ''));
v_lock_date := COALESCE((v_service_date - DATE '2000-01-01')::int, 0);
PERFORM pg_advisory_xact_lock(v_lock_zone, v_lock_date);
```

The advisory lock is scoped to `(zone, service_date)`, but:
- Lock is acquired AFTER table validation and zone determination
- If a table moves zones between validation and lock acquisition, conflicts could occur
- Multiple bookings can proceed concurrently until they converge on the same zone

**Risk:** Two assignments could race if they start with different zones but end up needing the same table.

**Recommendation:** Consider restaurant-level locking for cross-zone table moves, or add zone stability checks.

---

### 🟡 P1.2: Hold Conflict Check After Lock Acquisition
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:237-252`

**Issue:**
```sql
PERFORM pg_advisory_xact_lock(v_lock_zone, v_lock_date);
-- Later...
SELECT th.id INTO v_hold_conflict FROM public.table_holds th ...
```

Hold conflict checking happens AFTER acquiring the advisory lock, but:
- Hold creation (`createTableHold`) doesn't coordinate with assignment locks
- Two manual assignments could both pass hold checks before either creates holds
- The strict conflict enforcement (table_hold_windows) helps, but isn't enabled by default

**Risk:** Manual assignment race conditions when holds.strictConflicts = false

**Recommendation:** Enable strict conflicts by default or add hold acquisition to the lock scope.

---

### 🟢 P1.3: Idempotency Returns Stale Data
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:205-235`

**Issue:**
When an idempotency key matches, the procedure returns early without revalidating:
```sql
IF FOUND THEN
  -- Check table set matches
  -- Return existing assignments without re-checking conflicts
  RETURN;
END IF;
```

**Risk:** If tables became unavailable or inactive between calls, stale assignments are returned.

**Recommendation:** Add a staleness timestamp or revalidate table availability on idempotent returns.

---

### 🟢 P1.4: Lazy Slot Creation Under Lock
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:254-267`

**Issue:**
```sql
SELECT public.get_or_create_booking_slot(...) INTO v_slot_id;
```

Slot creation happens mid-procedure while holding advisory lock:
- If slot creation is slow, lock is held longer
- Other assignments in the same zone wait unnecessarily
- Slot creation errors abort the entire assignment

**Risk:** Lock contention and reduced throughput during peak times

**Recommendation:** Pre-create slots in a background job or move slot creation outside the lock.

---

### 🟡 P1.5: Per-Table Conflict Checks in Loop
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:308-329`

**Issue:**
```sql
FOREACH v_table_id IN ARRAY v_table_ids LOOP
  SELECT ... INTO v_conflict FROM booking_table_assignments
  WHERE existing.table_id = v_table_id AND ...
```

Each table is checked individually in a loop:
- N queries instead of a single batched query
- Query plan doesn't optimize across tables
- Inefficient for multi-table assignments

**Risk:** Performance degradation for large parties (3+ tables)

**Recommendation:** Rewrite as a single query with `ANY(v_table_ids)` and check all conflicts at once.

---

### 🟢 P1.6: Merge Group Allocation Error Handling
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:269-306`

**Issue:**
```sql
EXCEPTION
  WHEN unique_violation OR exclusion_violation THEN
    RAISE EXCEPTION 'allocations_no_overlap' USING ERRCODE = 'P0001', ...
```

Both unique violations and exclusion violations are caught and reported as "allocations_no_overlap":
- Unique violations mean booking already has a merge group (retry issue)
- Exclusion violations mean time window conflicts (actual conflict)
- Error message doesn't distinguish between these

**Risk:** Debugging and client error handling are harder

**Recommendation:** Return different error codes/messages for each violation type.

---

### 🔴 P1.7: No Capacity Validation in Database
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql` (missing check)

**Issue:**
The database procedure **never validates** that the total capacity of assigned tables meets the party size:
- Application layer checks this in selector and manual validation
- But the RPC can be called directly with insufficient capacity
- No database constraint prevents capacity < party_size

**Risk:** Database can accept assignments that don't meet party size if called directly

**Recommendation:** Add a capacity validation check in the procedure after tables are loaded.

---

## 2. Application Logic Issues

### 🟡 P2.1: maxPartySize Handling Inconsistency
**Location:** `server/capacity/selector.ts:214-224`

**Issue:**
```typescript
// FIX: maxPartySize should only apply to single-table assignments, not combinations
const canUseSingle = !(typeof table.maxPartySize === "number"
  && table.maxPartySize > 0 && partySize > table.maxPartySize);

// Skip this table entirely only if it also can't contribute to combinations
if (!canUseSingle && !enableCombinations) {
  incrementCounter(diagnostics.skipped, "capacity");
  continue;
}
```

The comment says "FIX", suggesting this was a bug. The logic allows tables with `maxPartySize < partySize` to be used in combinations, but:
- The intent is unclear: should `maxPartySize` apply per-table or per-booking?
- The database procedure doesn't enforce `maxPartySize` at all
- Manual selection in `filterAvailableTables` (tables.ts:912-938) DOES enforce `maxPartySize`

**Risk:** Inconsistent enforcement could allow assignments that violate maxPartySize

**Recommendation:** Document the intended semantics and enforce consistently across all paths.

---

### 🟡 P2.2: Time Pruning Removes Valid Combination Tables
**Location:** `server/capacity/tables.ts:868-908` (`filterTimeAvailableTables`)

**Issue:**
When time pruning is enabled, tables are filtered based on availability bitsets:
```typescript
const availableTables = allTables.filter((table) => {
  const busyEntry = busyForPlanner.get(table.id);
  if (!busyEntry) return true;
  return isWindowFree(busyEntry.bitset, startIso, endIso);
});
```

This happens BEFORE combination enumeration:
- A single table might be unavailable due to partial overlap
- But it could be combined with other tables if the overlaps don't align
- The filter removes it from consideration entirely

**Risk:** Valid multi-table solutions might not be found

**Recommendation:** Either disable time pruning for combinations, or only filter out tables with complete overlap.

---

### 🔵 P2.3: Adjacency Enforcement Multiple Sources of Truth
**Location:** Multiple files

**Issue:**
Adjacency requirements are checked in multiple places with different sources:
1. Feature flag: `isAllocatorAdjacencyRequired()` (default true)
2. Feature flag: `getAllocatorAdjacencyMinPartySize()` (optional threshold)
3. Per-request override: `requireAdjacency` parameter in many functions
4. Database parameter: `p_require_adjacency` in RPC procedure

**Risk:** Mismatches between layers could allow non-adjacent tables or over-restrict

**Recommendation:** Create a single resolution function that all layers call.

---

### 🟢 P2.4: Service Fallback Silently Changes Windows
**Location:** `server/capacity/tables.ts:417-466` (`computeBookingWindowWithFallback`)

**Issue:**
```typescript
if (isAllocatorServiceFailHard()) {
  throw error;
}
const fallbackWindow = computeBookingWindow({
  ...args, policy, serviceHint: fallbackService
});
```

When a service isn't found, the system silently falls back to the first available service:
- Changes the booking window without explicit user confirmation
- `allocator.service.failHard` defaults to FALSE, so fallback is the default behavior
- Warning is logged but not surfaced to users

**Risk:** Bookings assigned to wrong time windows if service determination fails

**Recommendation:** Either default to failHard=true, or require explicit user confirmation for fallback.

---

### 🟡 P2.5: Triple-Checked Hold Conflicts
**Location:** Application (`findHoldConflicts`), Database RPC, and `table_hold_windows` view

**Issue:**
Hold conflicts are checked in THREE places:
1. Application: `findHoldConflicts` in `holds.ts`
2. Database RPC: Query in `assign_tables_atomic_v2` (lines 237-252)
3. Strict mode: Exclusion constraint on `table_hold_windows` (optional)

**Risk:**
- Inconsistencies between layers
- Performance overhead from redundant checks
- Unclear which layer is authoritative

**Recommendation:** Make strict mode the default and remove application-level checks, OR remove DB checks if strict mode is off.

---

### 🟢 P2.6: Scarcity Amplification Too Aggressive
**Location:** `server/capacity/selector.ts:366-374`

**Issue:**
```typescript
const scarcityFactor = Math.min(3, 1 + averageScarcity);
combinationPenalty *= scarcityFactor;
```

Combination penalties are amplified up to 3x based on scarcity:
- Intended to preserve rare tables for high-value bookings
- But might prevent valid assignments when rare tables are the only option
- No escape hatch for "use scarce table anyway" in manual mode

**Risk:** Manual assignments blocked even when staff explicitly chooses scarce tables

**Recommendation:** Disable or reduce scarcity amplification for manual assignments.

---

### 🟢 P2.7: Lookahead Soft Constraint
**Location:** `server/capacity/tables.ts:1080-1166` (`applyLookaheadPenalties`)

**Issue:**
Lookahead finds future bookings and penalizes plans that would block them:
```typescript
planLookahead.penaltyTotal += penaltyWeight;
```

But this is a SOFT constraint:
- Plans are still returned, just with higher scores
- Nothing prevents assignment of a plan that blocks future bookings
- Future booking might fail even though it was "protected"

**Risk:** Future bookings fail despite lookahead protection

**Recommendation:** Add a hard-block option or at least log when penalized plans are chosen.

---

### 🔴 P2.8: Manual Validation Separate from Assignment (TOCTOU)
**Location:** `server/capacity/tables.ts` - `evaluateManualSelection` vs `confirmHoldAssignment`

**Issue:**
Manual assignment flow:
1. `getManualAssignmentContext` - fetch tables/holds/conflicts
2. User reviews and selects tables (client-side)
3. `evaluateManualSelection` - validate selection
4. `createTableHold` or `confirmHoldAssignment` - execute

Between steps 1-4, the following can change:
- Other assignments complete
- Holds expire or are created
- Tables become inactive
- Booking is cancelled

**Risk:** High probability of race conditions during manual assignment

**Recommendation:** Add optimistic locking with version checks, or execute validation+assignment atomically.

---

### 🟡 P2.9: Zone Stability Not Enforced
**Location:** Database validation checks zone membership, but not zone stability

**Issue:**
The procedure validates all tables are in the same zone:
```sql
IF v_zone_id <> v_table.zone_id THEN
  RAISE EXCEPTION 'All tables must belong to the same zone'
```

But nothing prevents a table's zone from changing between:
- Manual validation (which checks zone)
- Assignment execution (which checks zone again)

If a table moves zones, the assignment could fail or use wrong zone.

**Risk:** Assignment failures with confusing error messages

**Recommendation:** Add zone change audit logging or prevent zone changes for tables with active assignments.

---

### 🟢 P2.10: Combination Enumeration Timeout Partial Results
**Location:** `server/capacity/selector.ts:19, 726-733`

**Issue:**
```typescript
const DEFAULT_ENUMERATION_TIMEOUT_MS = 1_000;
// Later...
if (performance.now() - startMs >= budgetMs) {
  stopSearch = true;
  timedOut = true;
```

DFS combination search has a 1-second timeout:
- If timeout is hit, partial results are returned
- No indication to user that search was incomplete
- Best combination might not have been found

**Risk:** Sub-optimal assignments when combination space is large

**Recommendation:** Either increase timeout, or return a flag indicating incomplete search.

---

## 3. Race Conditions

### 🔴 P3.1: TOCTOU in Manual Assignment Context
**Location:** `server/capacity/tables.ts` - `getManualAssignmentContext` → user interaction → `confirmHoldAssignment`

**Issue:**
Time-of-Check (TOCTOU) gap:
1. `getManualAssignmentContext` fetches current state
2. Response sent to client
3. User reviews (1-60+ seconds)
4. User clicks confirm
5. `confirmHoldAssignment` executes

Between steps 1 and 5, any number of other operations can occur:
- Other staff assign tables
- Auto-assign completes
- Holds are created/released
- Tables marked inactive

**Risk:** Very high probability of conflicts during peak times

**Recommendation:**
- Add contextVersion hash to response
- Verify context hasn't changed before assignment
- Show diff to user if context changed

---

### 🟡 P3.2: Hold Expiry During Assignment
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:29, 242`

**Issue:**
```sql
v_now timestamptz := timezone('utc', now());  -- Set at start
-- Later...
WHERE th.expires_at > v_now  -- Check against start time
```

`v_now` is captured at procedure start, but the procedure can run for seconds:
- A hold could expire while the procedure is running
- The check uses the stale `v_now` value
- Expired hold won't be detected

**Risk:** Assignments succeed despite hold expiry

**Recommendation:** Use `now()` directly in the query instead of captured `v_now`.

---

### 🟡 P3.3: Auto-Assign Retry Loop Race
**Location:** `server/jobs/auto-assign.ts:80-200`

**Issue:**
```typescript
while (attempt < maxAttempts) {
  const quote = await quoteTablesForBooking(...);
  if (!quote.hold) {
    // No tables available, retry after delay
  }
  await sleep(toSleep);
}
```

Auto-assign retries with delays (default 5s, 10s, 15s):
- Between retries, other bookings could claim tables
- No priority system; all bookings compete equally
- Older bookings don't get preferential treatment on retry

**Risk:** Bookings might never get assigned during high load even with retries

**Recommendation:** Add priority queue based on booking age or implement reservation queue.

---

### 🟡 P3.4: Concurrent Manual Assignment Hold Leak
**Location:** `server/capacity/holds.ts` + manual assignment flow

**Issue:**
When two staff members work on the same booking concurrently:
1. Staff A: getContext → sees no holds → creates Hold 1 on tables [1,2]
2. Staff B: getContext → sees no holds → creates Hold 2 on tables [3,4]
3. Staff A: confirms Hold 1
4. Staff B: confirms Hold 2 → FAILS (booking already has tables)
5. Hold 2 remains in database until expiry

**Risk:** Hold leakage during concurrent edits, table availability incorrectly shown as blocked

**Recommendation:** Add booking-level locking or single-hold-per-booking constraint.

---

### 🟢 P3.5: Table Status Refresh Timing
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:464`

**Issue:**
```sql
PERFORM public.refresh_table_status(v_table_id);
```

Status is refreshed at the end of assignment:
- But other transactions might query the table meanwhile
- Triggers also refresh status asynchronously
- Status could be inconsistent across concurrent reads

**Risk:** UI shows stale table status temporarily

**Recommendation:** Acceptable for UI display; document this as eventual consistency.

---

## 4. Edge Cases

### 🟢 P4.1: Empty or Null Table IDs
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:48-60`

**Issue:**
The procedure checks for empty arrays but not null elements:
```sql
IF p_table_ids IS NULL OR array_length(p_table_ids, 1) = 0 THEN
  RAISE EXCEPTION ...
SELECT array_agg(DISTINCT t.table_id ORDER BY t.table_id) ...
```

What if `p_table_ids = ARRAY[null::uuid, 'valid-uuid']`?
- The `array_agg` would produce `ARRAY['valid-uuid']`
- Silently drops null entries
- Idempotency key validation would fail (array size mismatch)

**Risk:** Confusing error messages if nulls passed

**Recommendation:** Add explicit null check or document this behavior.

---

### 🟡 P4.2: Cross-Midnight Bookings
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:199-203`

**Issue:**
```sql
v_service_date := (v_start_at AT TIME ZONE v_timezone)::date;
v_lock_date := COALESCE((v_service_date - DATE '2000-01-01')::int, 0);
PERFORM pg_advisory_xact_lock(v_lock_zone, v_lock_date);
```

For a booking from 11:30 PM to 1:30 AM:
- Start time is on Day 1
- End time is on Day 2
- Lock is acquired for Day 1 only
- Another booking starting at 12:30 AM (Day 2) gets a different lock
- Both could assign the same table for overlapping times

**Risk:** Cross-midnight bookings can conflict incorrectly

**Recommendation:** Lock both days for cross-midnight bookings, or use start/end date range.

---

### 🟢 P4.3: Timezone Fallback Masks Issues
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:79`

**Issue:**
```sql
v_timezone := COALESCE(NULLIF(v_booking.restaurant_timezone, ''), 'UTC');
```

If restaurant timezone is missing, defaults to UTC:
- Booking times might be interpreted incorrectly
- Service date calculation could be wrong
- User sees different times than intended

**Risk:** Incorrect service date and time window calculations

**Recommendation:** Require timezone in restaurant record, fail assignment if missing.

---

### 🟡 P4.4: Booking Status Race During Auto-Assign
**Location:** `server/jobs/auto-assign.ts:41-56, 190-199`

**Issue:**
```typescript
if (["cancelled", "no_show", "completed"].includes(String(booking.status))) {
  return;
}
// ... much later ...
await supabase.rpc("apply_booking_state_transition", {
  p_status: "confirmed",
```

Between the status check and the transition:
- User could cancel the booking
- Another process could mark it no-show
- Status transition might incorrectly succeed

**Risk:** Cancelled bookings get tables assigned and confirmed

**Recommendation:** Add status check to the `apply_booking_state_transition` procedure.

---

### 🔴 P4.5: No Capacity Validation in Database
**Severity**: Already listed as P1.7, included here for completeness.

---

### 🟢 P4.6: Deleted/Inactive Tables After Validation
**Location:** Between validation and assignment

**Issue:**
Manual flow validates that tables are active:
```typescript
if (table.active IS NOT TRUE) {
  RAISE EXCEPTION 'Table % is inactive'
```

But between validation and assignment:
- Staff could mark a table inactive
- Table could be soft-deleted
- Validation result is stale

**Risk:** Assignment might fail with cryptic error

**Recommendation:** Re-check active status in the assignment procedure (already done), accept this as expected behavior.

---

### 🟢 P4.7: maxOverage Not Enforced at DB Level
**Location:** Application uses `maxOverage`, database doesn't check

**Issue:**
Selector filters tables by `partySize + maxOverage`:
```typescript
const maxAllowedCapacity = partySize + Math.max(maxOverage, 0);
if (capacity > maxAllowedCapacity) {
  incrementCounter(diagnostics.skipped, "overage");
```

But database procedure has no such check:
- Application layer enforces maxOverage
- Direct RPC calls could exceed maxOverage
- Different applications might use different maxOverage values

**Risk:** Inconsistent overage enforcement

**Recommendation:** Either enforce in database or document that maxOverage is application-level policy only.

---

### 🟢 P4.8: Booking Date/Time vs start_at/end_at Inconsistency
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:95-123`

**Issue:**
The procedure accepts both formats:
1. `p_start_at` / `p_end_at` timestamps
2. `booking_date` / `start_time` / `end_time` fields

If a booking has BOTH formats:
- Which takes precedence?
- Procedure prioritizes custom window (p_start_at/p_end_at)
- But bookings table might have both populated inconsistently

**Risk:** Confusion about which time window is used

**Recommendation:** Validate that if both are present, they match, or document the precedence rule clearly.

---

## 5. Performance Issues

### 🟡 P5.1: N+1 Queries for Table Holds
**Location:** `server/capacity/holds.ts`, `server/capacity/tables.ts`

**Issue:**
Table holds are loaded with members in separate queries:
```typescript
const { data: holds } = await supabase
  .from("table_holds")
  .select(`*, table_hold_members(table_id)`)
```

But context loading might fetch holds multiple times:
- Once for conflict checking
- Once for display
- No batching across bookings

**Risk:** Slow response times when many holds exist

**Recommendation:** Implement hold caching with short TTL or batch load holds for multiple bookings.

---

### 🟡 P5.2: DFS Combination Enumeration Timeout
**Location:** `server/capacity/selector.ts:19, 726-733`

**Severity**: Already listed as P2.10 from logic perspective, also a performance issue.

**Issue:**
With kMax=3 and 20+ tables:
- Combination space is C(20,3) = 1,140 combinations
- DFS must explore with adjacency and zone constraints
- 1-second timeout might be hit frequently

**Risk:** Assignments fail or return sub-optimal results during peak load

**Recommendation:**
- Implement incremental deepening (try k=1, then k=2, then k=3)
- Add caching of valid combinations per zone/partySize

---

### 🟡 P5.3: Advisory Lock Contention
**Location:** `supabase/migrations/20251028034500_assign_tables_atomic_v2_alias_fix.sql:201-203`

**Issue:**
```sql
v_lock_zone := hashtext(COALESCE(v_zone_id::text, ''));
PERFORM pg_advisory_xact_lock(v_lock_zone, v_lock_date);
```

All assignments in the same zone on the same date serialize through ONE advisory lock:
- High-traffic zones become bottlenecks
- Lock is held during conflict checks, slot creation, and all inserts
- Large parties (3+ tables) hold lock longer

**Risk:** Throughput degradation during peak hours

**Recommendation:**
- Partition locks by zone AND hour of day
- Or use row-level locking with SKIP LOCKED

---

### 🟢 P5.4: Context Query Returns Large Result Sets
**Location:** `server/capacity/tables.ts` - `loadContextBookings`

**Issue:**
Context query loads ALL bookings for a restaurant on a given date:
```typescript
.eq("restaurant_id", restaurantId)
.eq("booking_date", bookingDate)
```

For busy restaurants:
- Could be 100+ bookings per day
- All loaded into memory for conflict checking
- Most bookings might not overlap with the target window

**Risk:** Memory usage and query time increase with restaurant size

**Recommendation:** Add time window filter to context query using tstzrange overlap.

---

### 🟢 P5.5: Scarcity Calculation Per Request
**Location:** `server/capacity/scarcity.ts:7-108`

**Issue:**
Scarcity scores are calculated on every assignment request:
```typescript
const tableScarcityScores = providedScarcityScores ?? computeTableScarcityScores(tables);
```

Calculation involves:
- Counting tables by capacity
- Computing inverse frequency
- Done for every quote/assignment

5-minute cache exists but with restaurant-level granularity.

**Risk:** CPU overhead during high request rates

**Recommendation:** Pre-compute scarcity in background job, or extend cache TTL to 15+ minutes.

---

## 6. Configuration & Feature Flag Risks

### 🟡 P6.1: Too Many Feature Flags
**Location:** `server/feature-flags.ts` and various locations

**Issue:**
At least 15+ feature flags control assignment behavior:
- `allocator.requireAdjacency` (default: true)
- `allocator.adjacencyMinPartySize` (optional)
- `allocator.kMax` (default: 3, range: 1-5)
- `allocator.service.failHard` (default: false)
- `allocator.mergesEnabled` (default: false in prod)
- `holds.enabled` (default: true)
- `holds.strictConflicts` (default: false)
- `selectorScoring` (default: true)
- `selectorLookahead.enabled` (default: false)
- `combinationPlanner` (default: true)
- `planner.time_pruning.enabled` (default: true)
- `adjacency.queryUndirected` (default: true)
- `allocatorV2.enabled` / `shadow` / `forceLegacy`
- Plus various limits and timeouts

**Risk:**
- Configuration space is 2^15+ = 32,000+ possible combinations
- Interactions between flags not fully tested
- Operators struggle to understand which flags to toggle

**Recommendation:**
- Reduce to 5-7 critical flags
- Bundle related flags into "profiles" (e.g., "conservative", "aggressive")
- Add flag interaction validation

---

### 🟡 P6.2: Environment-Specific Flag Defaults
**Location:** `server/feature-flags.ts`

**Issue:**
Some flags default differently by environment:
```typescript
isAllocatorMergesEnabled: process.env.NODE_ENV !== 'production'
```

**Risk:**
- Behavior differs between dev/staging/prod
- Bugs might only appear in production
- Testing doesn't reflect production behavior

**Recommendation:** Use same defaults across all environments, control via explicit config.

---

### 🟡 P6.3: GUC Session State for Strict Conflicts
**Location:** `server/capacity/holds.ts:130-164`

**Issue:**
```typescript
await client.rpc("set_hold_conflict_enforcement", { enabled });
// Later...
const { data, error } = await client.rpc("is_holds_strict_conflicts_enabled");
if (enabled && !data) {
  console.error("[capacity.hold] strict conflict enforcement not honored by server (GUC off)");
}
```

Strict conflict mode uses PostgreSQL GUC (session parameter):
- Must be set on EVERY database connection
- Can desync between application and database
- Verification is "best-effort" and just logs warnings
- Connection pooling might reuse connections with wrong GUC

**Risk:** Hold conflicts not enforced even when application thinks they are

**Recommendation:**
- Enable strict conflicts by default in database
- Or add GUC check before every hold operation

---

### 🟢 P6.4: Hardcoded Cache TTLs
**Location:** Multiple files

**Issue:**
Cache durations are hardcoded:
- Strategic config: 30 seconds
- Scarcity scores: 5 minutes
- Demand multipliers: 5 minutes

**Risk:** Can't tune cache behavior without code changes

**Recommendation:** Make cache TTLs configurable via environment variables.

---

## Recommendations Summary

### Immediate Actions (Critical Fixes)
1. **P1.7 / P4.5**: Add capacity validation in database procedure
2. **P2.8 / P3.1**: Implement optimistic locking for manual assignments
3. **P4.2**: Fix cross-midnight booking advisory locks
4. **P4.4**: Add booking status validation in state transition procedure
5. **P6.3**: Enable strict hold conflicts by default or ensure GUC consistency

### Short-Term Improvements
1. **P1.2**: Enable strict hold conflicts by default
2. **P1.5**: Rewrite per-table conflict check as batched query
3. **P2.1**: Document and enforce maxPartySize semantics consistently
4. **P3.2**: Use current time in hold expiry checks, not captured v_now
5. **P5.3**: Partition advisory locks by zone + time range

### Medium-Term Refactoring
1. **P6.1**: Reduce feature flags to 5-7 core flags
2. **P5.2**: Implement combination caching or incremental search
3. **P2.4**: Make service fallback explicit or default to failHard
4. **P5.1**: Add hold and scarcity caching layers
5. **P2.3**: Consolidate adjacency requirement resolution

### Long-Term Architecture
1. Consider event-sourcing for assignment history
2. Implement optimistic concurrency control (version stamps)
3. Add distributed locking (Redis) for cross-pod coordination
4. Build assignment simulation/testing framework
5. Create configuration validation and flag interaction tests

---

## Testing Gaps

The following scenarios should be added to integration tests:

1. **Concurrent manual assignments** to the same booking
2. **Cross-midnight bookings** with overlapping times
3. **Hold expiry during assignment** execution
4. **Table zone changes** mid-assignment
5. **Booking status changes** during auto-assign
6. **maxPartySize enforcement** in combinations
7. **Combination enumeration timeout** with large table counts
8. **Advisory lock contention** under load
9. **GUC strict conflicts** desync scenarios
10. **Idempotency with stale data** returns

---

## Metrics to Monitor

Recommended observability metrics:

1. **Assignment conflict rate** by source (hold, booking, capacity)
2. **Advisory lock wait time** by zone and hour
3. **Combination enumeration timeout rate**
4. **Hold leak count** (holds not released)
5. **Manual assignment retry rate**
6. **Service fallback usage rate**
7. **Idempotency cache hit rate**
8. **Cross-midnight booking rate**
9. **Feature flag usage distribution**
10. **Assignment latency** p50/p95/p99 by path (manual/auto)

---

## Conclusion

The table assignment system is feature-rich but has accumulated complexity debt. The 27 identified pitfalls range from critical data integrity issues to performance optimizations. Priority should be given to:

1. **Data integrity fixes** (P1.7, P4.2, P4.4)
2. **Race condition mitigation** (P2.8, P3.1, P3.4)
3. **Performance under load** (P1.5, P5.2, P5.3)
4. **Configuration simplification** (P6.1, P6.2)

Many issues stem from the split between application and database logic, with multiple validation layers that can desync. Consider consolidating more logic into the database or adopting a CQRS pattern with event sourcing for better auditability.
