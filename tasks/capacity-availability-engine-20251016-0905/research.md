# Research: Capacity & Availability Engine

**Task:** Implement robust, race-safe inventory/availability engine to prevent overbooking  
**Created:** 2025-10-16 09:05 UTC  
**Sprint Duration:** 2 weeks (6 stories)

---

## Executive Summary

**CRITICAL FINDING:** The codebase **already has capacity management infrastructure** partially implemented. We need to:

1. ✅ **Leverage existing** `restaurant_capacity_rules` table and `server/ops/capacity.ts` service
2. ⚠️ **Add missing pieces**: Table inventory, booking slots, race-safe transactions
3. ⚠️ **Enhance booking creation** to enforce capacity before commit

---

## Existing Patterns & Reuse Opportunities

### ✅ Already Implemented

#### 1. **Capacity Rules Table** (`restaurant_capacity_rules`)

```sql
CREATE TABLE restaurant_capacity_rules (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  service_period_id UUID REFERENCES restaurant_service_periods(id),
  day_of_week SMALLINT,           -- 0-6, nullable
  effective_date DATE,             -- Optional date override
  max_covers INTEGER,              -- Maximum total guests (party sizes)
  max_parties INTEGER,             -- Maximum number of bookings
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT non_negative CHECK (max_covers >= 0 AND max_parties >= 0),
  CONSTRAINT scope CHECK (
    service_period_id IS NOT NULL OR
    day_of_week IS NOT NULL OR
    effective_date IS NOT NULL
  )
);
```

**Key Features:**

- Scoped by service period, day of week, or specific date
- Supports `max_covers` (total guests) and `max_parties` (total bookings)
- Has proper constraints and indexing
- Already has RLS policies for staff access

#### 2. **Capacity Service** (`server/ops/capacity.ts`)

**Location:** `/Users/amankumarshrestha/Downloads/SajiloReserveX/server/ops/capacity.ts`

**Functions:**

- `getServicePeriodsWithCapacity()` - Fetches capacity rules per period
- `calculateCapacityUtilization()` - Calculates current utilization
  - Returns: `bookedCovers`, `bookedParties`, `utilizationPercentage`, `isOverbooked`
  - Detects overbooking state: `hasOverbooking: boolean`

**Algorithm (Current):**

```typescript
// 1. Fetch service periods + capacity rules
const periods = await getServicePeriodsWithCapacity(restaurantId, date);

// 2. Query all bookings for the date
const bookings = await supabase
  .from('bookings')
  .select('id, start_time, party_size, status')
  .eq('restaurant_id', restaurantId)
  .eq('booking_date', date);

// 3. Match each booking to a period (by time range)
const periodId = matchBookingToPeriod(booking, periods);

// 4. Aggregate covers and parties
bookedCovers += booking.partySize;
bookedParties += 1;

// 5. Detect overbooking
const isOverbooked =
  (maxCovers !== null && bookedCovers > maxCovers) ||
  (maxParties !== null && bookedParties > maxParties);
```

**Current Usage:**

- Read-only calculation (no write-time enforcement)
- Used in ops dashboard (not in booking creation)

#### 3. **Service Periods Table** (`restaurant_service_periods`)

```sql
CREATE TABLE restaurant_service_periods (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,              -- "Lunch", "Dinner", "Happy Hour"
  day_of_week SMALLINT,            -- 0-6, nullable
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT time_order CHECK (start_time < end_time)
);
```

#### 4. **Booking Flow** (`src/app/api/bookings/route.ts`)

**Current validation (765 lines):**

- ✅ Operating hours validation (`assertBookingWithinOperatingWindow`)
- ✅ Past time blocking (`assertBookingNotInPast`)
- ✅ Rate limiting (60 req/min per restaurant+IP)
- ✅ Idempotency via `Idempotency-Key` header
- ✅ Loyalty points accrual
- ✅ Confirmation token generation
- ❌ **NO capacity enforcement before commit**

**Current Transaction Pattern:**

```typescript
// NOT SERIALIZABLE - Potential race condition!
const { data, error } = await client
  .from('bookings')
  .insert(insertPayload)
  .select(BOOKING_SELECT)
  .single();
```

**Gaps:**

- No capacity check in booking creation flow
- No row-level locking
- No optimistic concurrency control
- No transaction isolation level enforcement

---

### ⚠️ Missing Components

#### 1. **Table Inventory** (Not Implemented)

**Proposed Schema:**

```sql
CREATE TABLE table_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  table_number TEXT NOT NULL,
  capacity INTEGER NOT NULL,               -- Seats (2, 4, 6, 8, etc.)
  min_party_size INTEGER DEFAULT 1,
  max_party_size INTEGER,
  section TEXT,                            -- "Main Floor", "Patio", "Bar"
  seating_type seating_type NOT NULL,      -- Enum: indoor/outdoor/bar/patio/private_room
  status TEXT DEFAULT 'available',         -- 'available', 'reserved', 'out_of_service'
  position JSONB,                          -- {x: number, y: number} for floor plan
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_capacity CHECK (capacity > 0 AND min_party_size > 0),
  CONSTRAINT valid_party_range CHECK (max_party_size IS NULL OR max_party_size >= min_party_size),
  UNIQUE(restaurant_id, table_number)
);

CREATE INDEX idx_table_inventory_lookup ON table_inventory(restaurant_id, status, capacity);
```

**Note:** `seating_type` enum already exists in schema.

#### 2. **Booking Slots** (Not Implemented)

**Proposed Schema:**

```sql
CREATE TABLE booking_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  service_period_id UUID REFERENCES restaurant_service_periods(id),
  available_capacity INTEGER NOT NULL DEFAULT 0,
  reserved_count INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,      -- Optimistic locking
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT slot_capacity_valid CHECK (reserved_count <= available_capacity),
  UNIQUE(restaurant_id, slot_date, slot_time)
);

CREATE INDEX idx_booking_slots_lookup ON booking_slots(restaurant_id, slot_date, slot_time);
```

**Purpose:** Pre-materialized slot inventory for fast capacity checks.

#### 3. **Booking Table Assignments** (Not Implemented)

**Proposed Schema:**

```sql
CREATE TABLE booking_table_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES table_inventory(id),
  slot_id UUID REFERENCES booking_slots(id),
  assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(booking_id, table_id)
);

CREATE INDEX idx_assignments_booking ON booking_table_assignments(booking_id);
CREATE INDEX idx_assignments_table ON booking_table_assignments(table_id, assigned_at);
```

#### 4. **Race-Safe Booking Transaction** (Not Implemented)

**Current:** Simple INSERT with no isolation guarantees  
**Needed:** SERIALIZABLE transaction with row-level locking

---

## External Resources

### Database Patterns

- **PostgreSQL Transactions:** https://www.postgresql.org/docs/current/transaction-iso.html
  - SERIALIZABLE isolation level prevents phantom reads
  - FOR UPDATE NOWAIT for explicit row locking
- **Optimistic Concurrency Control:** Version column pattern
- **Pessimistic Locking:** SELECT FOR UPDATE in transactions

### Restaurant Capacity Management

- **Yelp Reservations:** Table pacing (stagger bookings by time)
- **OpenTable:** Slot-based availability with table assignment post-booking
- **Resy:** Real-time capacity with aggressive caching

---

## Constraints & Risks

### Technical Constraints

1. **Supabase Limitations:**
   - Cannot use stored procedures for complex transaction logic
   - Must use Supabase client transaction API
   - RLS policies add overhead to transaction performance

2. **Database Constraints:**
   - PostgreSQL max connections: ~100 (Supabase free tier)
   - Transaction timeout: 60s default
   - Deadlock risk with high concurrency

3. **Performance Targets:**
   - Booking creation: < 500ms p95
   - Availability check: < 200ms p95
   - Load: 50 concurrent booking requests

### Business Constraints

1. **Backward Compatibility:**
   - Existing bookings have no table assignments
   - Must support partial capacity data (restaurants without inventory)
   - Cannot break current booking flow during migration

2. **Data Migration:**
   - ~10,000+ existing bookings (estimate from seed data)
   - Must backfill slot data for historical bookings
   - Cannot require table inventory for all restaurants immediately

### Security Constraints

1. **RLS Policies:**
   - All new tables need row-level security
   - Staff/owner/admin roles must be enforced
   - Guest access to availability (public) vs. table assignments (staff-only)

2. **Rate Limiting:**
   - Existing: 60 req/min per restaurant+IP
   - Capacity checks add query overhead
   - May need separate rate limit for availability endpoint

---

## Open Questions (and Answers)

### Q1: Should we enforce table assignment at booking creation or post-booking?

**A: Start with post-booking (ops manual assignment), then auto-assign in v2.**

**Rationale:**

- Lower risk: Doesn't block booking creation
- Ops team can optimize assignments manually
- Allows time-based pacing without complex algorithm
- Reduces transaction complexity in v1

### Q2: What granularity for booking slots?

**A: Use 15-minute intervals aligned with service periods.**

**Rationale:**

- Matches common restaurant reservation practices
- Allows pacing rules (e.g., max 3 bookings per 15-min slot)
- Easy to aggregate for hour/period views
- Can be pre-generated nightly

### Q3: How to handle existing bookings without table assignments?

**A: Use "unassigned" state; backfill is optional.**

**Rationale:**

- New system is forward-looking
- Historical data doesn't need full fidelity
- Ops can assign tables to upcoming bookings manually
- Avoid expensive backfill operation

### Q4: Should capacity rules override operating hours?

**A: Capacity rules are scoped within operating hours.**

**Rationale:**

- Operating hours are hard limits (restaurant closed)
- Capacity rules are soft limits (can be overridden by ops)
- Validation order: Hours → Capacity → Table availability

### Q5: What happens when capacity is exceeded but tables are available?

**A: Block booking; ops can override via admin panel.**

**Rationale:**

- Prevent accidental overbooking
- Maintain kitchen/service quality
- Allow flexibility for special cases (VIPs, events)

---

## Recommended Direction

### Phase 1: Foundation (Story 1 + 2) - Days 1-5

**Story 1: Schema Design**

1. Create migration for `table_inventory`, `booking_slots`, `booking_table_assignments`
2. Add RLS policies and indexes
3. Seed sample data for test restaurant
4. Document ERD relationships

**Story 2: Capacity Service Enhancement**

1. Extract and refactor existing `calculateCapacityUtilization` logic
2. Create new `CapacityService` class:
   - `checkSlotAvailability(date, time, partySize)` → `{ available, reason, alternatives }`
   - `findSuitableTables(partySize, seating)` → `Table[]`
   - `applyPacingRules(slot)` → `boolean`
3. **Reuse existing** period/capacity queries from `server/ops/capacity.ts`
4. Add unit tests for edge cases

**Key Decision:** Use existing `restaurant_capacity_rules` table; don't duplicate logic.

---

### Phase 2: Race-Safe Transactions (Story 3) - Days 6-9

**Story 3: Transaction Implementation**

1. Create `BookingTransaction` service wrapper
2. Implement Supabase transaction pattern:
   ```typescript
   const { data, error } = await supabase.rpc('create_booking_safe', {
     p_restaurant_id: restaurantId,
     p_date: date,
     p_time: time,
     p_party: partySize,
     // ... other params
   });
   ```
3. Create PostgreSQL function `create_booking_safe`:
   - BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE
   - SELECT ... FROM booking_slots WHERE ... FOR UPDATE NOWAIT
   - Check capacity
   - INSERT booking
   - UPDATE booking_slots SET reserved_count = reserved_count + 1
   - COMMIT
4. Add retry logic (3 attempts with exponential backoff)
5. Handle conflict errors (409 Conflict response)

**Alternative:** Use Supabase client transaction API if RPC is too complex.

---

### Phase 3: API Integration (Story 4) - Days 10-11

**Story 4: Booking Endpoint Refactor**

1. **Before insertion:**

   ```typescript
   const availability = await CapacityService.checkSlotAvailability({
     restaurantId,
     date,
     time: startTime,
     partySize,
   });

   if (!availability.available) {
     return NextResponse.json(
       {
         error: 'CAPACITY_EXCEEDED',
         message: availability.reason,
         alternatives: availability.alternatives,
       },
       { status: 409 },
     );
   }
   ```

2. Replace simple INSERT with `BookingTransaction.create()`
3. Add new endpoint: `GET /api/availability?restaurantId=X&date=Y&partySize=Z`
4. Update existing `/api/bookings` response with capacity metadata
5. Add observability logging for capacity rejections

---

### Phase 4: Admin Tools (Story 5) - Days 12-14

**Story 5: Ops Dashboard**

1. UI for managing `table_inventory`:
   - List/create/edit/delete tables
   - Floor plan visualization (SVG grid with drag-drop)
2. Real-time capacity monitor:
   - Show slot utilization heatmap (reuse existing `calculateCapacityUtilization`)
   - Flag overbooked slots
3. Override panel:
   - Allow admins to force bookings beyond capacity
   - Log override events in audit trail
4. Export overbooking reports

---

### Phase 5: Testing (Story 6) - Throughout + Days 12-14

**Story 6: Comprehensive Testing**

1. **Unit Tests:**
   - Capacity calculation logic
   - Table matching algorithm
   - Pacing rule enforcement
2. **Integration Tests:**
   - Booking creation with capacity checks
   - Concurrent booking scenarios
3. **Load Tests:**
   - 50 concurrent booking requests to same slot
   - Verify zero overbookings
   - Measure p95 latency (target < 500ms)
4. **Monitoring:**
   - Add metrics: `booking.capacity_exceeded`, `booking.race_conflict`
   - Alert on overbooking detection
   - Dashboard for capacity utilization trends

---

## Implementation Priorities

### Must-Have (P0)

1. ✅ Race-safe booking transaction
2. ✅ Capacity check before booking creation
3. ✅ Overbooking prevention
4. ✅ Basic table inventory schema
5. ✅ Admin UI for capacity configuration

### Should-Have (P1)

1. Automatic table assignment algorithm
2. Floor plan visualization
3. Alternative time suggestions
4. Load testing and performance benchmarks

### Nice-to-Have (P2)

1. Real-time availability websocket updates
2. Machine learning for optimal table assignments
3. Historical capacity analytics
4. Predictive overbooking alerts

---

## Anti-Patterns to Avoid

### ❌ Don't: Check-then-insert pattern

```typescript
// BAD: Race condition!
const available = await checkCapacity();
if (available) {
  await insertBooking(); // ← Another request might have booked in between
}
```

### ✅ Do: Check-and-insert atomically

```typescript
// GOOD: Atomic transaction
await supabase.rpc('create_booking_safe', { ... });
// Function checks capacity inside the same transaction
```

### ❌ Don't: Materialize all possible slots upfront

```typescript
// BAD: Too much data
for (const day in next365Days) {
  for (const time in 15minIntervals) {
    insertSlot(day, time); // → 365 * 96 = 35,040 rows per restaurant!
  }
}
```

### ✅ Do: Lazy slot creation

```typescript
// GOOD: Create slots on-demand
const slot = await getOrCreateSlot(date, time);
```

### ❌ Don't: Assign tables at booking creation (v1)

```typescript
// BAD: Blocks booking creation if no tables available
const table = await findAvailableTable(partySize);
if (!table) throw new Error('No tables');
```

### ✅ Do: Assign tables post-booking (v1)

```typescript
// GOOD: Allow booking, assign later
const booking = await createBooking({ status: 'pending_allocation' });
// Ops staff assigns table manually
```

---

## Next Steps

1. ✅ **Research complete** (this document)
2. **Create `plan.md`** with detailed implementation spec
3. **Create `todo.md`** with executable checklist
4. **Begin Story 1** (schema design + migrations)

---

**Document Status:** Complete  
**Next Action:** Review with team, then proceed to planning phase  
**Estimated Total Effort:** 80 hours (2 developers × 2 weeks)
