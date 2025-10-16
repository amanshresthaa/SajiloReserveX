# Implementation Checklist: Capacity & Availability Engine

**Sprint:** 2 weeks (10 working days)  
**Started:** 2025-10-16  
**Target Completion:** 2025-10-30

---

## Story 1: Design Capacity Model & Data Schema (Days 1-2)

### Schema Design

- [ ] Create migration `001_create_table_inventory.sql`
  - [ ] Add `table_inventory` table with columns: id, restaurant_id, table_number, capacity, min_party_size, max_party_size, section, seating_type, status, position, notes
  - [ ] Add constraints: valid_capacity, valid_party_range, unique restaurant_id+table_number
  - [ ] Add index: `idx_table_inventory_lookup` on (restaurant_id, status, capacity)
  - [ ] Add RLS policies: staff can manage tables for their restaurants
  - [ ] Add updated_at trigger

- [ ] Create migration `002_create_booking_slots.sql`
  - [ ] Add `booking_slots` table with columns: id, restaurant_id, slot_date, slot_time, service_period_id, available_capacity, reserved_count, version
  - [ ] Add constraints: slot_capacity_valid (reserved_count <= available_capacity)
  - [ ] Add unique constraint: (restaurant_id, slot_date, slot_time)
  - [ ] Add index: `idx_booking_slots_lookup` on (restaurant_id, slot_date, slot_time)
  - [ ] Add RLS policies: staff can read/write slots for their restaurants
  - [ ] Add updated_at trigger

- [ ] Create migration `003_create_booking_table_assignments.sql`
  - [ ] Add `booking_table_assignments` table with columns: id, booking_id, table_id, slot_id, assigned_at, assigned_by, notes
  - [ ] Add unique constraint: (booking_id, table_id)
  - [ ] Add indexes: on booking_id, on table_id+assigned_at
  - [ ] Add foreign key cascades: booking ON DELETE CASCADE, table ON DELETE RESTRICT
  - [ ] Add RLS policies: staff can manage assignments
  - [ ] Add updated_at trigger

- [ ] Create migration `004_add_capacity_check_rpc.sql`
  - [ ] Implement `create_booking_with_capacity_check()` PostgreSQL function
  - [ ] Set transaction isolation to SERIALIZABLE
  - [ ] Add idempotency check (return existing if duplicate)
  - [ ] Add service period lookup
  - [ ] Add capacity rule query with FOR UPDATE lock
  - [ ] Add booking count aggregation
  - [ ] Add capacity validation (covers and parties)
  - [ ] Add booking insertion
  - [ ] Add exception handling for serialization failures
  - [ ] Return JSONB with success/error/booking/capacity

- [ ] Create migration `005_add_rls_policies.sql`
  - [ ] Enable RLS on all new tables
  - [ ] Add service_role bypass policies
  - [ ] Add authenticated staff policies (using user_restaurants())
  - [ ] Add public read policy for availability checks (if needed)

- [ ] Update TypeScript types (`types/supabase.ts`)
  - [ ] Run `pnpm db:types` to regenerate from schema
  - [ ] Verify new table types exist
  - [ ] Add custom types for RPC response

### Documentation

- [ ] Create ERD diagram (Mermaid or draw.io)
  - [ ] Show relationships: restaurants → service_periods → capacity_rules
  - [ ] Show relationships: bookings → table_assignments → table_inventory
  - [ ] Show relationships: bookings → slots

- [ ] Document capacity calculation algorithm
  - [ ] Period matching logic
  - [ ] Cover/party counting
  - [ ] Utilization percentage formula

- [ ] Document migration strategy
  - [ ] Safe rollback plan
  - [ ] Backfill strategy (or decision not to backfill)

### Seed Data

- [ ] Create seed script for test restaurant
  - [ ] Add 10 tables with varied capacities (2, 4, 6, 8 seats)
  - [ ] Add capacity rules for lunch/dinner periods
  - [ ] Add sample bookings to test utilization

---

## Story 2: Build Capacity Service (Days 3-5)

### Service Layer

- [ ] Create `server/capacity/service.ts`
  - [ ] Export type `AvailabilityResult = { available, reason?, alternatives?, metadata }`
  - [ ] Export type `TimeSlot = { time, available, utilizationPercent }`
  - [ ] Implement `checkSlotAvailability(params)` function
    - [ ] Query service periods for date+time
    - [ ] Query capacity rules (use existing logic from ops/capacity.ts)
    - [ ] Count bookings in period
    - [ ] Calculate utilization
    - [ ] Return availability result
  - [ ] Implement `findAlternativeSlots(params)` function
    - [ ] Check ±15min, ±30min, ±60min, ±120min slots
    - [ ] Filter to available slots only
    - [ ] Return max 5 alternatives sorted by proximity
  - [ ] Implement `calculatePeriodCapacity(periodId, date)` function
    - [ ] Reuse logic from `server/ops/capacity.ts`
    - [ ] Return `{ bookedCovers, maxCovers, utilizationPercent }`

- [ ] Create `server/capacity/transaction.ts`
  - [ ] Export type `BookingResult = { success, error?, booking?, capacity?, duplicate? }`
  - [ ] Implement `createBookingWithCapacityCheck(params)` function
    - [ ] Call Supabase RPC `create_booking_with_capacity_check`
    - [ ] Parse JSONB response
    - [ ] Map to TypeScript result type
  - [ ] Implement `retryWithBackoff(fn, maxRetries)` utility
    - [ ] Delays: 100ms, 200ms, 400ms
    - [ ] Catch serialization failures and deadlocks
    - [ ] Re-throw other errors
  - [ ] Wrap RPC call with retry logic
    - [ ] Max 3 attempts
    - [ ] Log retry events

- [ ] Create `server/capacity/tables.ts` (stub for v2)
  - [ ] Export type `Table = { id, tableNumber, capacity, section, status }`
  - [ ] Implement `findSuitableTables(partySize, seating)` (returns empty array in v1)
  - [ ] Implement `assignTableToBooking(bookingId, tableId)` (throws "Not implemented" in v1)

### Unit Tests

- [ ] Create `server/capacity/__tests__/service.test.ts`
  - [ ] Test `checkSlotAvailability` with under-capacity scenario
  - [ ] Test `checkSlotAvailability` with at-capacity scenario
  - [ ] Test `checkSlotAvailability` with no capacity rules (fallback)
  - [ ] Test `findAlternativeSlots` returns nearby times
  - [ ] Test `findAlternativeSlots` returns max 5 alternatives
  - [ ] Mock Supabase client for all tests

- [ ] Create `server/capacity/__tests__/transaction.test.ts`
  - [ ] Test successful booking creation
  - [ ] Test capacity exceeded error
  - [ ] Test idempotency (duplicate returns existing)
  - [ ] Test retry on serialization failure
  - [ ] Test max retries exceeded
  - [ ] Mock RPC call responses

---

## Story 3: Implement Race-Safe Transactions (Days 6-9)

### Database Function Refinement

- [ ] Test RPC function in Supabase SQL editor
  - [ ] Create test restaurant with capacity rules
  - [ ] Call function with valid params → should succeed
  - [ ] Call function with same idempotency key → should return duplicate
  - [ ] Fill capacity and call again → should return CAPACITY_EXCEEDED
  - [ ] Test concurrent calls (open 2 SQL editor tabs) → one should fail

- [ ] Add observability logging to RPC function
  - [ ] Log capacity checks (booked_covers, max_covers)
  - [ ] Log errors (capacity exceeded, serialization failure)
  - [ ] Use `RAISE NOTICE` for debugging (remove in production)

- [ ] Performance optimization
  - [ ] Add index on bookings (restaurant_id, booking_date, start_time, status) if not exists
  - [ ] Use `EXPLAIN ANALYZE` on capacity check query
  - [ ] Ensure query plan uses indexes

### Integration Testing

- [ ] Create `tests/integration/capacity-transaction.test.ts`
  - [ ] Setup: Create test restaurant with capacity rules
  - [ ] Test: Create booking via RPC → verify in database
  - [ ] Test: Attempt overbooking → verify rejection
  - [ ] Test: Concurrent bookings (Promise.all) → verify race handling
  - [ ] Teardown: Clean up test data

- [ ] Add error handling tests
  - [ ] Test invalid restaurant_id → should error
  - [ ] Test invalid booking_type → should error
  - [ ] Test missing required fields → should error

---

## Story 4: Refactor Booking Endpoint (Days 10-11)

### API Updates

- [ ] Refactor `src/app/api/bookings/route.ts` (POST handler)
  - [ ] Import `createBookingWithCapacityCheck` from `server/capacity/transaction`
  - [ ] Replace current `insertBookingRecord()` call with new transaction service
  - [ ] Handle `CAPACITY_EXCEEDED` error → return 409 with alternatives
  - [ ] Handle `BOOKING_CONFLICT` error → return 409 with retry message
  - [ ] Include capacity metadata in success response
  - [ ] Keep existing validations: operating hours, past time, rate limiting
  - [ ] Preserve idempotency logic (moved to RPC)
  - [ ] Update observability logging

- [ ] Create `src/app/api/availability/route.ts` (new endpoint)
  - [ ] Implement GET handler
  - [ ] Parse query params: restaurantId, date, partySize, time?, seating?
  - [ ] Validate params with Zod schema
  - [ ] If `time` provided: call `checkSlotAvailability` for specific slot
  - [ ] If no `time`: call `checkSlotAvailability` for all operating hour slots
  - [ ] Return JSON with availability data
  - [ ] Add rate limiting (20 req/min per IP)
  - [ ] Add caching headers (Cache-Control: max-age=60)

- [ ] Update `src/app/api/ops/dashboard/capacity/route.ts`
  - [ ] Enhance with new capacity service
  - [ ] Add flag for overbooking detection
  - [ ] Return slot-level details (not just period-level)

### Response Schema

- [ ] Create `types/api.ts` for API response types
  - [ ] Export `BookingWithCapacityResponse`
  - [ ] Export `AvailabilityResponse`
  - [ ] Export `CapacityMetadata`

### API Documentation

- [ ] Update `openapi.yaml` (if exists)
  - [ ] Add `/api/availability` endpoint spec
  - [ ] Update `/api/bookings` POST with new error responses
  - [ ] Add schema for capacity metadata

### Integration Tests

- [ ] Create `tests/integration/booking-endpoint.test.ts`
  - [ ] Test POST /api/bookings with capacity available → 201
  - [ ] Test POST /api/bookings with capacity exceeded → 409 with alternatives
  - [ ] Test POST /api/bookings with race conflict → 409 retry
  - [ ] Test GET /api/availability with specific time → availability data
  - [ ] Test GET /api/availability without time → all slots
  - [ ] Test rate limiting on /api/availability

---

## Story 5: Build Admin Dashboard (Days 12-14)

### Table Inventory Management

- [x] Create `src/app/(ops)/ops/(app)/tables/page.tsx`
  - [x] List all tables for current restaurant
  - [x] Display: table number, capacity, section, seating type, status
  - [x] Add "New Table" button → opens dialog
  - [x] Add "Edit" button per row → opens dialog
  - [x] Add "Delete" button per row (with confirmation)

- [x] Create `src/components/features/tables/TableInventoryClient.tsx`
  - [x] Use TanStack Query for data fetching
  - [x] Show loading/empty/error states
  - [x] Implement search/filter by section
  - [x] Sort by table number or capacity

- [x] Create `src/components/features/tables/TableFormDialog.tsx`
  - [x] Form fields: table_number, capacity, min_party_size, max_party_size, section, seating_type, status
  - [x] Validation: capacity > 0, min <= max, unique table number
  - [x] Submit via POST /api/ops/tables or PATCH /api/ops/tables/[id]

- [x] Create `src/app/api/ops/tables/route.ts`
  - [x] GET: List tables for restaurant
  - [x] POST: Create new table
  - [x] Require staff role

- [x] Create `src/app/api/ops/tables/[id]/route.ts`
  - [x] GET: Get table details
  - [x] PATCH: Update table
  - [x] DELETE: Delete table (only if no future assignments)
  - [x] Require admin role for delete

### Capacity Configuration UI

- [x] Create `src/app/(ops)/ops/(app)/capacity/page.tsx`
  - [x] Show current capacity rules
  - [x] Group by service period
  - [x] Add "Edit Capacity" button per period

- [x] Create `src/components/features/capacity/CapacityRulesForm.tsx`
  - [x] Form fields: service_period, max_covers, max_parties
  - [x] Validation: non-negative values
  - [x] Submit via PUT /api/owner/restaurants/[id]/capacity

- [x] Create `src/app/api/owner/restaurants/[id]/capacity/route.ts`
  - [x] GET: Fetch capacity rules
  - [x] PUT: Update capacity rules
  - [x] Require admin role

### Real-Time Capacity Monitor

- [x] Enhance `src/app/(ops)/ops/(app)/page.tsx` (existing ops dashboard)
  - [x] Add "Capacity Status" card
  - [x] Show utilization by service period (reuse existing `/api/ops/dashboard/capacity`)
  - [x] Add overbooking alert banner (if hasOverbooking = true)

- [x] Create `src/components/features/capacity/CapacityHeatmap.tsx`
  - [x] Display slots in grid: time × utilization bar
  - [x] Color coding: green < 70%, yellow 70-90%, red > 90%, alert 100%+
  - [x] Click slot to see booking details

### Floor Plan Visualization (Optional - P2)

- [ ] Create `src/components/features/tables/FloorPlanView.tsx` (stub)
  - [ ] SVG canvas with grid
  - [ ] Render tables as rectangles with labels
  - [ ] Drag-and-drop to reposition (updates `position` JSONB)
  - [ ] Defer to v2 if time constrained

---

## Story 6: Testing & Monitoring (Days 12-14, parallel with Story 5)

### Load Testing

- [ ] Create `tests/load/concurrent-bookings.test.ts`
  - [ ] Setup: Restaurant with max_covers = 40
  - [ ] Test: Fire 100 concurrent requests for same slot (party=4 each)
  - [ ] Verify: Exactly 10 succeed (40 covers), 90 fail with 409
  - [ ] Verify: No overbooking in database (total_covers <= 40)
  - [ ] Measure: p95 latency for successful bookings
  - [ ] Run with: `npx artillery run load-test-config.yml` or custom script

- [ ] Create load test configuration
  - [ ] Use Artillery or k6
  - [ ] Scenario 1: Gradual ramp (1 → 50 concurrent users over 2 min)
  - [ ] Scenario 2: Spike test (0 → 100 users instantly)
  - [ ] Target: p95 < 500ms, p99 < 1s

### E2E Tests (Playwright)

- [ ] Create `tests/e2e/booking-capacity.spec.ts`
  - [ ] Test: Guest booking when capacity available → success page
  - [ ] Test: Guest booking when capacity full → error with alternatives
  - [ ] Test: Click alternative time → pre-fills form, submit succeeds
  - [ ] Test: Ops dashboard shows overbooking alert (if over capacity)

- [ ] Create `tests/e2e/ops-capacity.spec.ts`
  - [ ] Test: Ops creates table → appears in table list
  - [ ] Test: Ops edits capacity rule → updates utilization
  - [ ] Test: Ops views capacity heatmap → shows slot colors

### Monitoring Setup

- [ ] Add metrics to `server/observability.ts`
  - [ ] `booking.capacity_check.duration_ms`
  - [ ] `booking.capacity_exceeded.count`
  - [ ] `booking.overbooking.detected`
  - [ ] `booking.transaction.retry.count`
  - [ ] `availability.check.duration_ms`

- [ ] Add logging
  - [ ] Log capacity checks: `{ restaurantId, date, time, available, bookedCovers, maxCovers }`
  - [ ] Log capacity exceeded: `{ restaurantId, date, time, reason }`
  - [ ] Log overbooking detection: `{ restaurantId, date, period, bookedCovers, maxCovers }`

- [ ] Create alert rules (docs/alerts.md or monitoring config)
  - [ ] P0: Overbooking detected (hasOverbooking = true)
  - [ ] P0: Booking error rate > 5%
  - [ ] P1: Booking latency p95 > 1s
  - [ ] P1: Capacity not configured for active restaurant

### Performance Testing

- [ ] Profile database queries
  - [ ] Run `EXPLAIN ANALYZE` on RPC function
  - [ ] Verify indexes are used
  - [ ] Measure query time (target < 100ms)

- [ ] Profile API endpoints
  - [ ] Use browser DevTools Network tab
  - [ ] Measure: POST /api/bookings (target < 500ms p95)
  - [ ] Measure: GET /api/availability (target < 200ms p95)

---

## Deployment & Verification

### Staging Deployment

- [ ] Deploy all migrations to staging
  - [ ] Run `supabase db push` to staging
  - [ ] Verify schema changes in Supabase dashboard
  - [ ] Seed test data

- [ ] Deploy application code to staging
  - [ ] Push to staging branch
  - [ ] Verify deployment succeeded
  - [ ] Run smoke tests

- [ ] Run full test suite on staging
  - [ ] `pnpm test` (unit tests)
  - [ ] `pnpm test:integration` (integration tests)
  - [ ] `pnpm test:e2e` (E2E tests)
  - [ ] Load tests (manual)

### Production Deployment

- [ ] Create feature flag `ENABLE_CAPACITY_ENFORCEMENT`
  - [ ] Add to `server/feature-flags.ts`
  - [ ] Default: `false`
  - [ ] Environment variable: `NEXT_PUBLIC_ENABLE_CAPACITY_ENFORCEMENT`

- [ ] Deploy migrations to production
  - [ ] Backup database first
  - [ ] Run migrations during low-traffic window
  - [ ] Verify success

- [ ] Deploy application code
  - [ ] Flag OFF initially (shadow mode)
  - [ ] Monitor capacity calculations in logs
  - [ ] Verify no errors

- [ ] Gradual rollout
  - [ ] Day 1: Enable for 10% of restaurants (beta partners)
  - [ ] Monitor for 4 hours → if stable, proceed
  - [ ] Day 2: Enable for 50% of restaurants
  - [ ] Monitor for 4 hours → if stable, proceed
  - [ ] Day 3: Enable for 100% of restaurants

### Post-Deployment Verification

- [ ] Check metrics dashboard
  - [ ] `booking.capacity_exceeded.count` > 0 (expected)
  - [ ] `booking.overbooking.detected` = 0 (critical)
  - [ ] `booking.creation.latency.p95` < 500ms

- [ ] Manual testing in production
  - [ ] Create booking when under capacity → success
  - [ ] Fill capacity and attempt booking → 409 with alternatives
  - [ ] Check ops dashboard → see updated utilization

- [ ] Customer support check
  - [ ] Monitor support tickets for capacity-related issues
  - [ ] Verify alternative time suggestions are helpful

---

## Documentation & Handoff

### Code Documentation

- [ ] Add JSDoc comments to all public functions
- [ ] Document RPC function parameters
- [ ] Add README to `server/capacity/`

### User Documentation

- [ ] Create ops guide: "How to Configure Capacity Rules"
  - [ ] Step-by-step with screenshots
  - [ ] Best practices (e.g., buffer for walk-ins)
- [ ] Create ops guide: "How to Manage Table Inventory"
  - [ ] Adding/editing tables
  - [ ] Understanding seating types

- [ ] Create troubleshooting guide
  - [ ] "What if I'm overbooked?" → Manual override process
  - [ ] "What if capacity is too restrictive?" → Adjust rules

### Team Training

- [ ] Schedule training session with ops team
  - [ ] Demo capacity dashboard
  - [ ] Demo table inventory management
  - [ ] Q&A

- [ ] Record training video (optional)

---

## Notes & Deviations

### Assumptions

1. **No table auto-assignment in v1:** Ops will assign tables manually post-booking
2. **No backfill:** Historical bookings remain without table assignments
3. **Capacity rules optional:** Restaurants without rules can still accept bookings
4. **Alternatives limited to ±2 hours:** Narrow window to maintain relevance

### Deviations from Plan

- Inlined the table inventory form and capacity rule editor inside their client components instead of separate dialog/form files to reduce indirection for v1.

---

## Batched Questions

### For Product Team

1. Should we allow guests to see "X tables left" on the booking form?
2. What message should appear when all alternatives are also full?

### For Ops Team

1. Do you need table assignment during booking creation, or is post-booking OK?
2. What's the preferred max number of alternative times to show?

### For Engineering Team

1. Should we use a separate read replica for availability checks to reduce load?
2. Do we need real-time websocket updates for capacity changes?

---

**Checklist Status:** Ready for execution  
**Last Updated:** 2025-10-16  
**Owner:** Development Team
