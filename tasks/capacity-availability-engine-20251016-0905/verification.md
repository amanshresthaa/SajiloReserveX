# Verification Plan: Capacity & Availability Engine

**Purpose:** Define success criteria and testing approach for validating the capacity engine implementation.

---

## Pre-Implementation Verification (Completed)

### Research Phase ✅

- [x] Identified existing capacity infrastructure (`restaurant_capacity_rules`, `server/ops/capacity.ts`)
- [x] Analyzed current booking flow (no capacity enforcement at write-time)
- [x] Documented gaps (table inventory, booking slots, race-safe transactions)
- [x] Confirmed backward compatibility requirements

### Planning Phase ✅

- [x] Defined success criteria (zero overbookings, race-safe transactions)
- [x] Designed data schema (3 new tables, 1 RPC function)
- [x] Architected service layer (CapacityService, BookingTransactionService)
- [x] Planned API contracts (new /api/availability endpoint, enhanced /api/bookings)

---

## Implementation Verification Checklist

### Story 1: Schema Design ✅ / ❌ / ⏳

**Database Migrations:**

- [ ] Migration files created in correct order (001-005)
- [ ] All tables have proper constraints (CHECK, UNIQUE, FK)
- [ ] Indexes created for performance-critical queries
- [ ] RLS policies enabled and tested
- [ ] RPC function compiles without errors
- [x] TypeScript types regenerated (`pnpm db:types`)

**Verification Steps:**

1. Run migrations on local Supabase: `supabase db push --local`
2. Verify schema in Supabase Studio (local)
3. Test RPC function in SQL editor:
   ```sql
   SELECT create_booking_with_capacity_check(
     p_restaurant_id := '<uuid>',
     p_customer_id := '<uuid>',
     p_booking_date := '2025-10-25',
     p_start_time := '19:00',
     p_end_time := '21:00',
     p_party_size := 4,
     p_booking_type := 'dinner',
     p_customer_name := 'Test User',
     p_customer_email := 'test@example.com',
     p_customer_phone := '+1234567890',
     p_seating_preference := 'any',
     p_notes := NULL,
     p_marketing_opt_in := false,
     p_idempotency_key := 'test-key-001',
     p_details := '{}'::jsonb
   );
   ```
4. Verify response is valid JSONB with `success`, `booking`, `capacity` fields
5. Test capacity exceeded scenario (fill capacity first)
6. Test idempotency (call with same key twice)

**Acceptance Criteria:**

- All migrations run without errors
- Tables visible in Supabase Studio
- RPC function returns expected JSONB structure
- Capacity validation prevents overbooking
- Idempotency works correctly

---

### Story 2: Capacity Service ✅ / ❌ / ⏳

**Service Implementation:**

- [ ] `server/capacity/service.ts` created with all functions
- [ ] `server/capacity/transaction.ts` created with retry logic
- [ ] `server/capacity/tables.ts` created (stub for v2)
- [ ] Unit tests written with >80% coverage
- [ ] All tests pass: `pnpm test server/capacity`

**Verification Steps:**

1. Run unit tests: `pnpm test server/capacity`
2. Verify test coverage: `pnpm test:coverage`
3. Manual test in Node.js REPL:
   ```typescript
   import { checkSlotAvailability } from './server/capacity/service';
   const result = await checkSlotAvailability({
     restaurantId: '<uuid>',
     date: '2025-10-25',
     time: '19:00',
     partySize: 4,
   });
   console.log(result);
   // Should return: { available: true/false, metadata: {...} }
   ```
4. Test edge cases:
   - Restaurant without capacity rules → should allow booking
   - Exactly at capacity → should deny next booking
   - Alternative slots → should return nearby times

**Acceptance Criteria:**

- All unit tests pass
- Coverage > 80% for service layer
- Edge cases handled correctly
- No runtime errors

---

### Story 3: Race-Safe Transactions ✅ / ❌ / ⏳

**Transaction Implementation:**

- [ ] RPC function uses SERIALIZABLE isolation
- [ ] FOR UPDATE lock applied to capacity rules
- [ ] Retry logic handles serialization failures
- [ ] Integration tests verify race handling
- [ ] Load tests confirm zero overbookings

**Verification Steps:**

1. Run integration tests: `pnpm test:integration tests/integration/capacity-transaction`
2. Load test with concurrent requests:
   ```bash
   # Using custom script or Artillery
   node tests/load/concurrent-bookings.js
   ```
3. Verify database state after load test:

   ```sql
   SELECT
     SUM(party_size) as total_covers,
     COUNT(*) as total_bookings
   FROM bookings
   WHERE restaurant_id = '<uuid>'
     AND booking_date = '2025-10-25'
     AND status NOT IN ('cancelled', 'no_show');

   -- Compare total_covers to max_covers in capacity rules
   ```

4. Check for overbooking:
   ```sql
   SELECT hasOverbooking
   FROM (SELECT calculate_capacity_utilization('<uuid>', '2025-10-25')) AS result;
   ```

**Load Test Results:**
| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Concurrent requests | 100 | - | - |
| Successful bookings | 10 (for 40-cover capacity) | - | - |
| Failed bookings (409) | 90 | - | - |
| Overbookings detected | 0 | - | ✅ / ❌ |

**Acceptance Criteria:**

- Zero overbookings in database after 100 concurrent requests
- Exactly N bookings succeed (where N = max_covers / party_size)
- All failures return 409 with clear error message
- p95 latency < 500ms

---

### 2025-10-16 Updates

- Ran `supabase gen types typescript --linked > types/supabase.ts` to sync generated types with new capacity schema.
- Attempted targeted `pnpm test:ops` runs for booking APIs; suite currently fails due to missing test-time `BASE_URL` env wiring and an existing `assertBookingNotInPast` expectation that rejects `HH:MM:SS` inputs. Flagging for follow-up.
- Added test harness env stubs for booking/ops specs and aligned past-time validation tests with `HH:MM:SS` inputs. `pnpm test:ops -- src/app/api/bookings/route.test.ts` now passes.

---

### Story 4: API Refactoring ✅ / ❌ / ⏳

**API Endpoints:**

- [ ] POST /api/bookings enhanced with capacity check
- [ ] GET /api/availability endpoint created
- [ ] Error responses return alternatives
- [ ] Integration tests pass
- [ ] Manual API testing successful

**Verification Steps:**

1. Test POST /api/bookings (capacity available):

   ```bash
   curl -X POST http://localhost:3000/api/bookings \
     -H "Content-Type: application/json" \
     -H "Idempotency-Key: $(uuidgen)" \
     -d '{
       "restaurantId": "<uuid>",
       "date": "2025-10-25",
       "time": "19:00",
       "party": 4,
       "bookingType": "dinner",
       "seating": "any",
       "name": "Test User",
       "email": "test@example.com",
       "phone": "+1234567890"
     }'
   ```

   Expected: 201 with booking object + capacity metadata

2. Test POST /api/bookings (capacity exceeded):
   - Fill capacity first with multiple bookings
   - Attempt one more booking
   - Expected: 409 with `error: "CAPACITY_EXCEEDED"`, `alternatives: [...]`

3. Test GET /api/availability:

   ```bash
   curl "http://localhost:3000/api/availability?restaurantId=<uuid>&date=2025-10-25&partySize=4&time=19:00"
   ```

   Expected: 200 with `{ available: true/false, capacity: {...} }`

4. Test GET /api/availability (all day):
   ```bash
   curl "http://localhost:3000/api/availability?restaurantId=<uuid>&date=2025-10-25&partySize=4"
   ```
   Expected: 200 with `{ slots: [...], periods: [...] }`

**Acceptance Criteria:**

- All API endpoints return correct status codes
- Response schemas match documentation
- Alternatives are provided when capacity exceeded
- Rate limiting works (20 req/min for availability)

---

### Story 5: Admin Dashboard ✅ / ❌ / ⏳

**UI Components:**

- [ ] Table inventory page created
- [ ] Capacity configuration page created
- [ ] Ops dashboard shows capacity status
- [ ] All CRUD operations work
- [ ] E2E tests pass

**Verification Steps:**

**Manual QA - Chrome DevTools (Required per AGENTS.md):**

1. **Table Inventory Page** (`/ops/tables`):
   - [ ] Navigate to page → loads without errors
   - [ ] Console: No errors
   - [ ] Network: All API calls succeed (200/201)
   - [ ] DOM: Semantic HTML (table with proper headers)
   - [ ] Accessibility: Tab navigation works, ARIA labels present
   - [ ] Test CRUD:
     - [ ] Click "New Table" → dialog opens
     - [ ] Fill form → submit → new row appears
     - [ ] Click "Edit" → form pre-filled → update → row updates
     - [ ] Click "Delete" → confirmation → row removed
   - [ ] Device emulation:
     - [ ] Mobile (375px): Layout responsive, no horizontal scroll
     - [ ] Tablet (768px): Layout adapts
     - [ ] Desktop (1280px+): All features visible

2. **Capacity Configuration Page** (`/ops/capacity`):
   - [ ] Console: No errors
   - [ ] Network: Capacity rules load successfully
   - [ ] Test edit:
     - [ ] Change max_covers value → save → updates in database
     - [ ] Navigate to ops dashboard → utilization reflects change
   - [ ] Accessibility: Form labels, keyboard navigation

3. **Ops Dashboard** (`/ops`):
   - [ ] "Capacity Status" card visible
   - [ ] Utilization percentages displayed
   - [ ] Overbooking alert appears when over capacity
   - [ ] Lighthouse score:
     - [ ] Performance: 90+
     - [ ] Accessibility: 100
     - [ ] Best Practices: 90+

**E2E Tests (Playwright):**

```bash
pnpm test:e2e tests/e2e/ops-capacity.spec.ts
```

**Acceptance Criteria:**

- All pages load without console errors
- CRUD operations persist to database
- UI is responsive (mobile/tablet/desktop)
- Accessibility checks pass (keyboard nav, screen reader)
- Lighthouse scores meet targets

---

### Story 6: Testing & Monitoring ✅ / ❌ / ⏳

**Test Suite:**

- [ ] Unit tests: >80% coverage
- [ ] Integration tests: All critical paths
- [ ] E2E tests: Guest + ops flows
- [ ] Load tests: 100 concurrent requests
- [ ] Performance benchmarks: <500ms p95

**Verification Steps:**

1. **Run full test suite:**

   ```bash
   pnpm test              # Unit tests
   pnpm test:integration  # Integration tests
   pnpm test:e2e          # E2E tests
   ```

2. **Load testing:**

   ```bash
   # Option 1: Custom script
   node tests/load/concurrent-bookings.js

   # Option 2: Artillery
   npx artillery run tests/load/capacity-load-test.yml
   ```

3. **Performance profiling:**
   - Use browser DevTools Performance tab
   - Record: Create booking flow
   - Analyze: Total time, database query time
   - Target: < 500ms total for booking creation

4. **Monitoring setup:**
   - [ ] Metrics configured in observability service
   - [ ] Alert rules defined
   - [ ] Test alerts trigger correctly

**Test Results Summary:**

| Test Type   | Tests Run | Passed | Failed | Coverage |
| ----------- | --------- | ------ | ------ | -------- |
| Unit        | -         | -      | -      | -%       |
| Integration | -         | -      | -      | N/A      |
| E2E         | -         | -      | -      | N/A      |
| Load        | -         | -      | -      | N/A      |

**Performance Benchmarks:**

| Endpoint              | p50 | p95 | p99 | Target |
| --------------------- | --- | --- | --- | ------ |
| POST /api/bookings    | -   | -   | -   | <500ms |
| GET /api/availability | -   | -   | -   | <200ms |

**Acceptance Criteria:**

- All tests pass (100%)
- Coverage > 80%
- Load tests confirm zero overbookings
- Performance targets met

---

## Production Deployment Verification

### Pre-Deployment Checklist

- [ ] All stories completed and verified
- [ ] Staging environment tested successfully
- [ ] Database backup completed
- [ ] Rollback plan documented
- [ ] Feature flag configured (default: OFF)
- [ ] On-call engineer notified

### Deployment Steps

1. [ ] Deploy migrations to production (during low-traffic window)
2. [ ] Verify migrations succeeded in Supabase dashboard
3. [ ] Deploy application code (feature flag OFF)
4. [ ] Smoke test production endpoints
5. [ ] Monitor logs for errors (30 minutes)

### Shadow Mode Verification (Feature Flag OFF)

- [ ] Capacity calculations logged (not enforced)
- [ ] No errors in logs
- [ ] Existing booking flow unaffected
- [ ] Ops dashboard shows capacity data (read-only)

### Gradual Rollout

**Day 1: 10% (Beta Partners)**

- [ ] Enable flag for selected restaurant IDs
- [ ] Monitor metrics for 4 hours:
  - [ ] booking.capacity_exceeded.count > 0 (expected)
  - [ ] booking.overbooking.detected = 0 (critical)
  - [ ] booking.creation.error_rate < 1%
- [ ] Customer support: No critical issues
- [ ] Decision: Proceed to 50% ✅ / Rollback ❌

**Day 2: 50%**

- [ ] Enable flag for 50% of restaurants
- [ ] Monitor metrics for 4 hours
- [ ] Decision: Proceed to 100% ✅ / Rollback ❌

**Day 3: 100%**

- [ ] Enable flag for all restaurants
- [ ] Monitor metrics for 24 hours
- [ ] Final verification: Zero overbookings

---

## Post-Deployment Monitoring

### Week 1: Daily Checks

- [ ] Review overbooking alerts (target: 0)
- [ ] Review error logs (capacity-related)
- [ ] Review support tickets
- [ ] Capacity utilization trends

### Week 2-4: Weekly Checks

- [ ] Performance metrics (p95 latency)
- [ ] Capacity configuration coverage (% restaurants)
- [ ] Alternative time acceptance rate

### Success Metrics (30 Days Post-Launch)

| Metric                          | Target | Actual | Status  |
| ------------------------------- | ------ | ------ | ------- |
| Overbookings                    | 0      | -      | ✅ / ❌ |
| Booking success rate            | >95%   | -      | ✅ / ❌ |
| p95 latency (POST /bookings)    | <500ms | -      | ✅ / ❌ |
| p95 latency (GET /availability) | <200ms | -      | ✅ / ❌ |
| Customer complaints             | <5     | -      | ✅ / ❌ |
| Capacity coverage               | >80%   | -      | ✅ / ❌ |

---

## Known Issues & Limitations

### v1 Limitations (Accepted)

- ⚠️ No automatic table assignment (manual in ops dashboard)
- ⚠️ Historical bookings have no table assignments (no backfill)
- ⚠️ Restaurants without capacity rules have unlimited bookings

### Future Enhancements (v2)

- Auto-assign tables based on party size + seating preference
- Floor plan visualization with drag-and-drop
- Predictive overbooking with ML
- Real-time websocket updates for availability

---

## Sign-Offs

### Engineering

- [ ] Code reviewed and approved
- [ ] All tests pass
- [ ] Performance benchmarks met
- [ ] Security review completed
- **Signed:** **\*\***\_\_\_\_**\*\*** **Date:** **\_\_\_\_**

### Product

- [ ] Features meet requirements
- [ ] UX reviewed and approved
- [ ] Documentation complete
- **Signed:** **\*\***\_\_\_\_**\*\*** **Date:** **\_\_\_\_**

### Operations

- [ ] Trained on capacity management
- [ ] Runbooks reviewed
- [ ] Monitoring configured
- **Signed:** **\*\***\_\_\_\_**\*\*** **Date:** **\_\_\_\_**

---

**Verification Status:** Pending Implementation  
**Last Updated:** 2025-10-16  
**Next Review:** After each story completion
