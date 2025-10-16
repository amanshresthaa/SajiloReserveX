# Capacity & Availability Engine - Task Folder

**Created:** 2025-10-16 09:05 UTC  
**Status:** Planning Complete, Ready for Implementation  
**Sprint Duration:** 2 weeks (10 working days)

---

## 📁 Task Structure

This task folder follows the **AGENTS.md** workflow (Phase 0-6):

```
tasks/capacity-availability-engine-20251016-0905/
├── README.md           # This file - overview and quick reference
├── research.md         # Phase 1: What exists, gaps, constraints, recommendations
├── plan.md             # Phase 2: Detailed implementation blueprint
├── todo.md             # Phase 3: Executable checklist (atomic steps)
└── verification.md     # Phase 4: QA plan, testing strategy, sign-offs
```

---

## 🎯 Sprint Goal

**Implement robust, race-safe inventory/availability engine to prevent overbooking by enforcing per-slot capacity, table assignment, and pacing rules at write-time during booking transactions.**

---

## 📊 Quick Stats

- **Stories:** 6 (Story 1-6)
- **Total Effort:** ~80 hours (2 developers × 40 hours)
- **Priority:** Critical (P0)
- **Risk Level:** Medium (database transactions, concurrency)
- **Dependencies:** Supabase, Upstash Redis

---

## 🔍 Key Findings from Research

### ✅ Already Implemented

1. **`restaurant_capacity_rules` table** - Configuration for max covers/parties per period
2. **`server/ops/capacity.ts`** - Capacity calculation utilities (read-only)
3. **Service periods table** - Lunch/dinner/drinks definitions
4. **Operating hours validation** - Time-based booking constraints

### ⚠️ Missing Components (To Build)

1. **Table inventory** - Physical tables (capacity, section, type)
2. **Booking slots** - Pre-materialized time slots with capacity counters
3. **Table assignments** - Link bookings to specific tables
4. **Race-safe transactions** - SERIALIZABLE isolation + row-level locking
5. **Capacity enforcement** - Check capacity BEFORE booking creation

---

## 📋 Sprint Stories

| Story | Focus                                                | Days  | Priority |
| ----- | ---------------------------------------------------- | ----- | -------- |
| 1     | Data schema design (3 tables, 1 RPC function)        | 1-2   | P0       |
| 2     | CapacityService (availability checks, alternatives)  | 3-5   | P0       |
| 3     | Race-safe booking transaction (SERIALIZABLE + retry) | 6-9   | P0       |
| 4     | API refactoring (POST /bookings, GET /availability)  | 10-11 | P0       |
| 5     | Admin dashboard (table mgmt, capacity config)        | 12-14 | P1       |
| 6     | Testing & monitoring (load tests, metrics)           | 12-14 | P0       |

---

## 🚀 How to Use This Task Folder

### For Developers

1. **Read `research.md` first**
   - Understand existing system
   - Learn what to reuse vs. build new

2. **Review `plan.md`**
   - Understand architecture
   - Review API contracts
   - Check data flow diagrams

3. **Follow `todo.md`**
   - Work through checklist sequentially
   - Check off items as you complete them
   - Document deviations in the "Notes" section

4. **Use `verification.md`**
   - Verify each story before moving to next
   - Run tests as defined
   - Fill in actual metrics

### For Reviewers

1. **Check alignment with plan**
   - Does implementation match `plan.md`?
   - Are all acceptance criteria met?

2. **Verify testing**
   - Are all tests in `verification.md` completed?
   - Do metrics meet targets?

3. **Sign off in `verification.md`**
   - Engineering, Product, Ops approvals

---

## 🔑 Success Criteria (From plan.md)

- [ ] **Zero overbookings** in production (measured via `hasOverbooking` flag)
- [ ] Race conditions prevented via SERIALIZABLE transactions
- [ ] Load tests pass: 100 concurrent requests → max 1 succeeds per slot
- [ ] p95 latency: Booking <500ms, Availability <200ms
- [ ] Backward compatible: Existing bookings work without table assignments

---

## 🗂️ New Database Tables

| Table                       | Purpose                     | Rows (Est.)             |
| --------------------------- | --------------------------- | ----------------------- |
| `table_inventory`           | Physical tables             | ~50 per restaurant      |
| `booking_slots`             | Time slot capacity counters | ~100/day per restaurant |
| `booking_table_assignments` | Link bookings to tables     | 1 per booking (v2)      |

**RPC Function:** `create_booking_with_capacity_check()` - Atomic booking creation with capacity validation

---

## 📡 New API Endpoints

### **GET /api/availability**

Check availability for a specific time or all day slots.

**Query Params:**

- `restaurantId` (required)
- `date` (required)
- `partySize` (required)
- `time` (optional)

**Response:**

```json
{
  "available": true,
  "capacity": {
    "maxCovers": 80,
    "bookedCovers": 60,
    "utilizationPercent": 75
  },
  "alternatives": ["18:45", "19:15"] // If unavailable
}
```

### **POST /api/bookings** (Enhanced)

Now includes capacity check before creation.

**New Response (Capacity Exceeded - 409):**

```json
{
  "error": "CAPACITY_EXCEEDED",
  "message": "No capacity for 4 guests at 19:00",
  "alternatives": [...]
}
```

---

## 🧪 Testing Strategy

### Unit Tests

- `server/capacity/__tests__/service.test.ts`
- `server/capacity/__tests__/transaction.test.ts`
- Target: >80% coverage

### Integration Tests

- `tests/integration/capacity-transaction.test.ts`
- `tests/integration/booking-endpoint.test.ts`
- Verify: Database state, API contracts

### Load Tests

- `tests/load/concurrent-bookings.test.ts`
- 100 concurrent requests → verify zero overbookings
- Measure: p95 latency

### E2E Tests (Playwright)

- Guest booking flow with capacity exceeded
- Ops dashboard capacity management
- Alternative time suggestions

---

## 📈 Monitoring & Metrics

**Key Metrics:**

- `booking.overbooking.detected` → Target: 0
- `booking.capacity_exceeded.count` → Track denials
- `booking.creation.latency.p95` → Target: <500ms
- `availability.check.latency.p95` → Target: <200ms

**Alerts:**

- P0: Overbooking detected (page on-call)
- P0: Booking error rate > 5%
- P1: Latency p95 > 1s

---

## 🔄 Deployment Plan

### Phase 1: Shadow Mode (Feature Flag OFF)

- Deploy code + migrations
- Log capacity checks, don't enforce
- Verify no errors

### Phase 2: Gradual Rollout

- Day 1: 10% of restaurants (beta partners)
- Day 2: 50% of restaurants
- Day 3: 100% of restaurants

### Phase 3: Full Enforcement

- Monitor for 30 days
- Track: overbookings (target: 0), latency, support tickets

---

## 🛡️ Rollback Plan

### Immediate Rollback

1. Set feature flag `ENABLE_CAPACITY_ENFORCEMENT = false`
2. Existing booking flow resumes (no capacity check)

### Database Rollback (If needed)

```sql
DROP FUNCTION create_booking_with_capacity_check;
DROP TABLE booking_table_assignments;
DROP TABLE booking_slots;
DROP TABLE table_inventory;
```

**Note:** Only safe if no production data written to new tables.

---

## 🚨 Risks & Mitigations

| Risk                      | Mitigation                                |
| ------------------------- | ----------------------------------------- |
| Database deadlocks        | SERIALIZABLE + retry logic + load testing |
| RPC function bugs         | Extensive unit tests + staging validation |
| Capacity misconfiguration | Validation UI + fallback defaults         |
| Performance degradation   | Index optimization + query profiling      |

---

## 📚 Related Documentation

- **Existing System:** See `documentation/FEATURES_SUMMARY.md` (Epic 1: Booking flow)
- **Current Capacity:** See `server/ops/capacity.ts` (utilization calculations)
- **Database Schema:** See `supabase/migrations/20251006170446_remote_schema.sql`
- **Coding Guidelines:** See `/Users/amankumarshrestha/Downloads/SajiloReserveX/AGENTS.md`

---

## 👥 Team & Ownership

**Primary Developer:** TBD  
**Reviewer:** TBD  
**Product Owner:** TBD  
**Stakeholders:** Operations team, Customer support

---

## ✅ Task Completion Checklist

- [x] Research complete (`research.md`)
- [x] Plan complete (`plan.md`)
- [x] Todo checklist created (`todo.md`)
- [x] Verification plan created (`verification.md`)
- [ ] Story 1: Schema design
- [ ] Story 2: Capacity service
- [ ] Story 3: Race-safe transactions
- [ ] Story 4: API refactoring
- [ ] Story 5: Admin dashboard
- [ ] Story 6: Testing & monitoring
- [ ] Staging deployment
- [ ] Production rollout
- [ ] Post-launch monitoring
- [ ] Sign-offs obtained

---

## 📝 Notes & Updates

### 2025-10-16

- Task folder created
- Research phase completed
- Planning phase completed
- Ready for implementation

### _(Add updates as work progresses)_

---

**Status:** 🟢 Ready for Development  
**Next Action:** Begin Story 1 (Schema Design)  
**Contact:** [Team lead contact here]
