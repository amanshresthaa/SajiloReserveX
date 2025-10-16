# Implementation Plan: Capacity & Availability Engine

**Sprint Goal:** Implement robust, race-safe inventory/availability engine to prevent overbooking  
**Duration:** 2 weeks (10 working days)  
**Team Size:** 1-2 developers  
**Priority:** Critical (P0)

---

## Objective

Prevent restaurant overbookings by enforcing per-slot capacity, table inventory, and pacing rules at write-time during booking transactions, using ACID-compliant database operations.

---

## Success Criteria

- [ ] **Zero overbookings** in production after deployment (measured via `hasOverbooking` flag)
- [ ] Booking API returns explicit availability status before accepting reservations
- [ ] Race conditions prevented via SERIALIZABLE transactions with row-level locking
- [ ] Load tests pass: 100 concurrent booking requests to same slot → max 1 succeeds, rest get 409 Conflict
- [ ] Capacity utilization dashboard shows real-time slot status
- [ ] p95 latency: Booking creation < 500ms, Availability check < 200ms
- [ ] Backward compatible: Existing bookings continue to work without table assignments

---

## Architecture & Components

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  (Guest booking form, Ops dashboard, Availability widget)   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                    │
│  • POST /api/bookings (with capacity enforcement)           │
│  • GET /api/availability (new endpoint)                     │
│  • GET /api/ops/capacity/utilization (existing, enhanced)   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer (server/)                  │
│  • CapacityService (new)                                    │
│  • BookingTransactionService (new)                          │
│  • TableAssignmentService (new, v2)                         │
│  • REUSE: server/ops/capacity.ts utilities                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer (Supabase)                  │
│  EXISTING:                                                  │
│  • bookings, restaurant_capacity_rules,                     │
│    restaurant_service_periods                               │
│  NEW:                                                       │
│  • table_inventory, booking_slots,                          │
│    booking_table_assignments                                │
│  RPC:                                                       │
│  • create_booking_with_capacity_check()                     │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. **CapacityService** (`server/capacity/service.ts`)

**Purpose:** Central capacity calculation and availability checking

**Methods:**

- `checkSlotAvailability(params)` → `AvailabilityResult`
  - Input: `{ restaurantId, date, time, partySize, seatingPreference? }`
  - Output: `{ available: boolean, reason?: string, alternatives?: string[], metadata: { maxCovers, bookedCovers, utilizationPercent } }`
  - Logic: Query capacity rules → Count existing bookings → Apply pacing rules → Return result

- `findAlternativeSlots(params)` → `TimeSlot[]`
  - Input: `{ restaurantId, date, partySize, preferredTime }`
  - Output: Array of available times within ±2 hours
  - Logic: Check ±15min, ±30min, ±60min, ±120min slots

- `calculatePeriodCapacity(periodId, date)` → `PeriodCapacity`
  - Reuse logic from existing `server/ops/capacity.ts`

#### 2. **BookingTransactionService** (`server/capacity/transaction.ts`)

**Purpose:** Race-safe booking creation

**Methods:**

- `createBookingWithCapacityCheck(params)` → `BookingResult`
  - Wraps Supabase RPC call to PostgreSQL function
  - Handles retry logic (3 attempts, exponential backoff)
  - Returns typed errors: `CAPACITY_EXCEEDED`, `BOOKING_CONFLICT`, `OPERATING_HOURS_CLOSED`

- `retryWithBackoff(fn, maxRetries)` → Generic retry wrapper
  - Delays: 100ms, 200ms, 400ms
  - Catches serialization failures and deadlocks

#### 3. **TableInventoryService** (`server/capacity/tables.ts`) [v2]

**Purpose:** Table matching and assignment

**Methods:**

- `findSuitableTables(partySize, seating)` → `Table[]`
  - Algorithm: Exact match first, then next size up, then combinable tables
  - Filters by seating preference (indoor/outdoor/bar)

- `assignTableToBooking(bookingId, tableId)` → `Assignment`
  - Creates `booking_table_assignments` record
  - Updates table status to 'reserved'

---

## Data Flow & API Contracts

### **POST /api/bookings** (Enhanced)

**Request:**

```json
{
  "restaurantId": "uuid",
  "date": "2025-10-20",
  "time": "19:00",
  "party": 4,
  "bookingType": "dinner",
  "seating": "indoor",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "notes": "Anniversary",
  "marketingOptIn": false
}
```

**Headers:**

```
Idempotency-Key: <uuid>
Content-Type: application/json
```

**Response (Success - 201):**

```json
{
  "booking": {
    "id": "uuid",
    "reference": "ABC123XYZ9",
    "status": "confirmed",
    "restaurantId": "uuid",
    "date": "2025-10-20",
    "startTime": "19:00",
    "endTime": "21:00",
    "partySize": 4,
    "customerName": "John Doe",
    "loyaltyPointsAwarded": 30,
    "tableAssigned": null // ← v1: null, v2: "T5"
  },
  "confirmationToken": "64-char-hex",
  "capacity": {
    "periodName": "Dinner Service",
    "utilizationPercent": 75,
    "bookedCovers": 60,
    "maxCovers": 80
  }
}
```

**Response (Capacity Exceeded - 409):**

```json
{
  "error": "CAPACITY_EXCEEDED",
  "message": "No capacity available for 4 guests at 19:00 on 2025-10-20",
  "details": {
    "maxCovers": 80,
    "bookedCovers": 80,
    "requestedCovers": 4
  },
  "alternatives": [
    { "time": "18:45", "available": true },
    { "time": "19:15", "available": true },
    { "time": "20:30", "available": true }
  ]
}
```

**Response (Race Conflict - 409):**

```json
{
  "error": "BOOKING_CONFLICT",
  "message": "This slot was just booked by another request. Please try again.",
  "retryAfter": 1
}
```

---

### **GET /api/availability** (New)

**Query Parameters:**

```
restaurantId: UUID (required)
date: YYYY-MM-DD (required)
partySize: integer (required)
time: HH:MM (optional) - if provided, checks specific slot
seating: indoor|outdoor|bar|any (optional)
```

**Response (Specific Time):**

```json
{
  "restaurantId": "uuid",
  "date": "2025-10-20",
  "time": "19:00",
  "partySize": 4,
  "available": true,
  "capacity": {
    "periodName": "Dinner Service",
    "maxCovers": 80,
    "bookedCovers": 60,
    "remainingCovers": 20,
    "utilizationPercent": 75
  }
}
```

**Response (All Day):**

```json
{
  "restaurantId": "uuid",
  "date": "2025-10-20",
  "partySize": 4,
  "slots": [
    { "time": "18:00", "available": true, "utilizationPercent": 50 },
    { "time": "18:15", "available": true, "utilizationPercent": 55 },
    { "time": "18:30", "available": false, "utilizationPercent": 100 }
    // ... more slots
  ],
  "periods": [
    {
      "name": "Dinner Service",
      "startTime": "17:00",
      "endTime": "22:00",
      "maxCovers": 80,
      "bookedCovers": 60
    }
  ]
}
```

---

### **Database RPC: `create_booking_with_capacity_check`**

**Purpose:** Atomic booking creation with capacity enforcement

**Signature:**

```sql
CREATE OR REPLACE FUNCTION create_booking_with_capacity_check(
  p_restaurant_id UUID,
  p_customer_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_party_size INTEGER,
  p_booking_type booking_type,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_seating_preference seating_preference_type,
  p_notes TEXT,
  p_marketing_opt_in BOOLEAN,
  p_idempotency_key TEXT,
  p_details JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_period_id UUID;
  v_max_covers INTEGER;
  v_max_parties INTEGER;
  v_booked_covers INTEGER;
  v_booked_parties INTEGER;
  v_booking_id UUID;
  v_booking_record JSONB;
BEGIN
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  -- 1. Check idempotency
  SELECT id INTO v_booking_id
  FROM bookings
  WHERE restaurant_id = p_restaurant_id
    AND idempotency_key = p_idempotency_key;

  IF FOUND THEN
    -- Return existing booking
    SELECT row_to_json(b.*) INTO v_booking_record
    FROM bookings b WHERE id = v_booking_id;

    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'booking', v_booking_record
    );
  END IF;

  -- 2. Find applicable service period
  SELECT id INTO v_service_period_id
  FROM restaurant_service_periods
  WHERE restaurant_id = p_restaurant_id
    AND (day_of_week IS NULL OR day_of_week = EXTRACT(DOW FROM p_booking_date)::SMALLINT)
    AND p_start_time >= start_time
    AND p_start_time < end_time
  ORDER BY day_of_week DESC NULLS LAST
  LIMIT 1;

  -- 3. Get capacity rules (with row lock)
  SELECT max_covers, max_parties INTO v_max_covers, v_max_parties
  FROM restaurant_capacity_rules
  WHERE restaurant_id = p_restaurant_id
    AND (service_period_id IS NULL OR service_period_id = v_service_period_id)
    AND (day_of_week IS NULL OR day_of_week = EXTRACT(DOW FROM p_booking_date)::SMALLINT)
    AND (effective_date IS NULL OR effective_date <= p_booking_date)
  ORDER BY
    effective_date DESC NULLS LAST,
    day_of_week DESC NULLS LAST,
    service_period_id DESC NULLS LAST
  LIMIT 1
  FOR UPDATE;  -- ← Lock capacity rule row

  -- 4. Count existing bookings in same period
  SELECT
    COALESCE(SUM(party_size), 0),
    COUNT(*)
  INTO v_booked_covers, v_booked_parties
  FROM bookings
  WHERE restaurant_id = p_restaurant_id
    AND booking_date = p_booking_date
    AND start_time >= (SELECT start_time FROM restaurant_service_periods WHERE id = v_service_period_id)
    AND start_time < (SELECT end_time FROM restaurant_service_periods WHERE id = v_service_period_id)
    AND status NOT IN ('cancelled', 'no_show');

  -- 5. Check capacity
  IF (v_max_covers IS NOT NULL AND v_booked_covers + p_party_size > v_max_covers) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'CAPACITY_EXCEEDED',
      'message', 'Maximum covers exceeded',
      'details', jsonb_build_object(
        'maxCovers', v_max_covers,
        'bookedCovers', v_booked_covers,
        'requestedCovers', p_party_size
      )
    );
  END IF;

  IF (v_max_parties IS NOT NULL AND v_booked_parties + 1 > v_max_parties) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'CAPACITY_EXCEEDED',
      'message', 'Maximum bookings exceeded',
      'details', jsonb_build_object(
        'maxParties', v_max_parties,
        'bookedParties', v_booked_parties
      )
    );
  END IF;

  -- 6. Create booking
  INSERT INTO bookings (
    restaurant_id,
    customer_id,
    booking_date,
    start_time,
    end_time,
    party_size,
    booking_type,
    customer_name,
    customer_email,
    customer_phone,
    seating_preference,
    notes,
    marketing_opt_in,
    idempotency_key,
    status,
    details
  ) VALUES (
    p_restaurant_id,
    p_customer_id,
    p_booking_date,
    p_start_time,
    p_end_time,
    p_party_size,
    p_booking_type,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_seating_preference,
    p_notes,
    p_marketing_opt_in,
    p_idempotency_key,
    'confirmed',
    p_details
  ) RETURNING id, row_to_json(bookings.*) INTO v_booking_id, v_booking_record;

  -- 7. Return success
  RETURN jsonb_build_object(
    'success', true,
    'duplicate', false,
    'booking', v_booking_record,
    'capacity', jsonb_build_object(
      'maxCovers', v_max_covers,
      'bookedCovers', v_booked_covers + p_party_size,
      'utilizationPercent', ROUND((v_booked_covers + p_party_size)::NUMERIC / v_max_covers * 100)
    )
  );

EXCEPTION
  WHEN serialization_failure OR deadlock_detected THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'BOOKING_CONFLICT',
      'message', 'Concurrent booking conflict. Please retry.'
    );
END;
$$;
```

---

## UI/UX States

### Booking Form (Guest-Facing)

**Loading:**

- Show spinner on submit button
- Disable all form fields
- Display: "Checking availability..."

**Empty (No Availability):**

- Display: "No tables available for your party size on this date"
- Show alternative dates/times in a suggestion card
- Button: "Check other times"

**Error (Capacity Exceeded):**

- Alert banner: "This time slot is fully booked"
- List alternative times:
  ```
  Available nearby times:
  • 6:45 PM - Book now
  • 7:15 PM - Book now
  • 8:30 PM - Book now
  ```
- Button: "Try another time"

**Error (Race Conflict):**

- Toast notification: "Someone just booked this slot. Retrying..."
- Auto-retry with exponential backoff (user sees retry count)
- After 3 failures: "This time is no longer available. Please choose another time."

**Success:**

- Redirect to `/reserve/[reservationId]`
- Confirmation message with booking reference
- Email sent with confirmation token

---

### Ops Dashboard (Capacity Management)

**Capacity Heatmap:**

```
┌────────────────────────────────────────┐
│  Dinner Service - Oct 20, 2025        │
├────────────────────────────────────────┤
│ 5:00 PM  ████████░░  80%  (32/40)     │
│ 5:15 PM  ██████░░░░  60%  (24/40)     │
│ 5:30 PM  ██████████ 100%  (40/40) ⚠️   │
│ 5:45 PM  ████████░░  80%  (32/40)     │
│ 6:00 PM  ██████████ 100%  (40/40) ⚠️   │
│ ...                                    │
└────────────────────────────────────────┘
```

**Overbooking Alert:**

```
⚠️ OVERBOOKING DETECTED
Dinner Service - 6:00 PM
Booked: 45 covers (Max: 40)
[View Details] [Resolve Now]
```

**Table Inventory Manager:**

```
Tables (Main Floor)
┌─────┬──────────┬─────────┬─────────┐
│  #  │ Capacity │ Type    │ Status  │
├─────┼──────────┼─────────┼─────────┤
│ T1  │ 2        │ Indoor  │ ✓ Free  │
│ T2  │ 4        │ Indoor  │ ⏱ 7:00  │
│ T3  │ 6        │ Window  │ ✓ Free  │
│ T4  │ 8        │ Private │ 🔒 VIP  │
└─────┴──────────┴─────────┴─────────┘
[+ Add Table]
```

---

## Edge Cases

### 1. Concurrent Bookings for Last Slot

**Scenario:** 2 users try to book the last available slot simultaneously

**Handling:**

- Both requests hit `create_booking_with_capacity_check` RPC
- SERIALIZABLE isolation prevents phantom reads
- First transaction locks capacity rule row (FOR UPDATE)
- Second transaction waits or gets deadlock
- First transaction commits → Success
- Second transaction gets serialization failure → Retry or 409 response

**Test:**

```typescript
// Load test: 100 concurrent requests for same slot
// Expected: 1 success, 99 failures with BOOKING_CONFLICT
```

### 2. Capacity Rule Update During Booking

**Scenario:** Admin changes max_covers while bookings are being created

**Handling:**

- Booking transaction locks capacity rule row
- Admin update waits until transaction completes
- No dirty reads due to isolation level

### 3. Booking Outside Service Period

**Scenario:** User tries to book 3:00 PM for "Dinner Service" (5:00-10:00 PM)

**Handling:**

- Service period lookup returns NULL
- Use fallback capacity rule (day_of_week or restaurant-wide)
- If no rule exists, reject with `OPERATING_HOURS_CLOSED`

### 4. Restaurant Without Capacity Rules

**Scenario:** New restaurant hasn't configured capacity yet

**Handling:**

- Query returns NULL for `max_covers` and `max_parties`
- Allow booking to proceed (backward compatible)
- Log warning: "Capacity not configured for restaurant X"
- Show banner in ops dashboard: "Configure capacity rules"

### 5. Partial Capacity Data (Some Periods Configured)

**Scenario:** Lunch has capacity rules, Dinner doesn't

**Handling:**

- Enforce capacity for Lunch bookings
- Allow unrestricted Dinner bookings
- Ops dashboard shows "Not configured" for Dinner

### 6. Backfilling Existing Bookings

**Scenario:** 10,000 historical bookings with no table assignments

**Handling:**

- **Don't backfill** (too expensive)
- New bookings get assignments going forward
- Ops can manually assign tables to upcoming bookings
- Query filters: `WHERE booking_date >= CURRENT_DATE` for active bookings

### 7. Table Out of Service

**Scenario:** Table breaks, needs to be removed from inventory

**Handling:**

- Update `table_inventory.status = 'out_of_service'`
- Recalculate available capacity
- Existing assignments remain (don't auto-reassign)
- Ops dashboard shows reduced capacity warning

---

## Testing Strategy

### Unit Tests (`server/capacity/__tests__/`)

**CapacityService:**

```typescript
describe('CapacityService.checkSlotAvailability', () => {
  it('returns available=true when under capacity', async () => {
    // Setup: max_covers=40, booked_covers=30, party=4
    const result = await CapacityService.checkSlotAvailability({...});
    expect(result.available).toBe(true);
    expect(result.metadata.utilizationPercent).toBe(85);
  });

  it('returns available=false when at capacity', async () => {
    // Setup: max_covers=40, booked_covers=40, party=2
    const result = await CapacityService.checkSlotAvailability({...});
    expect(result.available).toBe(false);
    expect(result.reason).toBe('Maximum covers exceeded');
  });

  it('returns alternatives when unavailable', async () => {
    // Setup: 7:00 PM full, 6:45 PM and 7:15 PM available
    const result = await CapacityService.checkSlotAvailability({...});
    expect(result.alternatives).toHaveLength(2);
    expect(result.alternatives).toContain('18:45');
  });

  it('handles restaurant without capacity rules', async () => {
    // Setup: No capacity rules in DB
    const result = await CapacityService.checkSlotAvailability({...});
    expect(result.available).toBe(true); // Default to allow
  });
});
```

**BookingTransactionService:**

```typescript
describe('BookingTransactionService.createBookingWithCapacityCheck', () => {
  it('creates booking when capacity available', async () => {
    const result = await service.createBookingWithCapacityCheck({...});
    expect(result.success).toBe(true);
    expect(result.booking.status).toBe('confirmed');
  });

  it('rejects booking when capacity exceeded', async () => {
    // Setup: Fill capacity first
    await createBookingsToCapacity();

    const result = await service.createBookingWithCapacityCheck({...});
    expect(result.success).toBe(false);
    expect(result.error).toBe('CAPACITY_EXCEEDED');
  });

  it('retries on serialization failure', async () => {
    // Mock: First call throws serialization error, second succeeds
    const result = await service.createBookingWithCapacityCheck({...});
    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });
});
```

### Integration Tests (`tests/integration/capacity.test.ts`)

**Booking Endpoint:**

```typescript
describe('POST /api/bookings with capacity enforcement', () => {
  it('accepts booking when under capacity', async () => {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ partySize: 4, ... }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.booking.status).toBe('confirmed');
  });

  it('rejects booking when over capacity', async () => {
    // Fill capacity with bookings
    await Promise.all([
      createBooking({ party: 10 }),
      createBooking({ party: 10 }),
      createBooking({ party: 10 }),
      createBooking({ party: 10 }),
    ]); // Total: 40 covers (max)

    const response = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ partySize: 2, ... }),
    });

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe('CAPACITY_EXCEEDED');
    expect(data.alternatives).toBeInstanceOf(Array);
  });
});
```

### Load Tests (`tests/load/concurrent-bookings.test.ts`)

**Scenario: 100 Concurrent Requests for Same Slot**

```typescript
describe('Race condition handling', () => {
  it('prevents overbooking under heavy load', async () => {
    const restaurantId = 'test-restaurant';
    const date = '2025-10-20';
    const time = '19:00';

    // Setup: max_covers = 40, need 10 bookings of 4 people each

    // Fire 100 concurrent booking requests
    const promises = Array.from({ length: 100 }, (_, i) =>
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Idempotency-Key': `load-test-${i}` },
        body: JSON.stringify({
          restaurantId,
          date,
          time,
          party: 4,
          name: `Guest ${i}`,
          email: `guest${i}@test.com`,
          phone: `+100000000${i}`,
        }),
      }),
    );

    const responses = await Promise.all(promises);
    const successes = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);

    // Exactly 10 should succeed (10 * 4 = 40 covers)
    expect(successes).toHaveLength(10);
    expect(conflicts).toHaveLength(90);

    // Verify no overbooking in database
    const { data: bookings } = await supabase
      .from('bookings')
      .select('party_size')
      .eq('restaurant_id', restaurantId)
      .eq('booking_date', date);

    const totalCovers = bookings.reduce((sum, b) => sum + b.party_size, 0);
    expect(totalCovers).toBeLessThanOrEqual(40);
  });
});
```

### E2E Tests (Playwright)

**Guest Booking Flow:**

```typescript
test('shows alternative times when slot is full', async ({ page }) => {
  // Fill capacity
  await fillCapacityForSlot('19:00');

  // Attempt booking
  await page.goto('/reserve/r/test-restaurant');
  await page.fill('[name="party"]', '4');
  await page.fill('[name="date"]', '2025-10-20');
  await page.fill('[name="time"]', '19:00');
  await page.click('button[type="submit"]');

  // Should see error message
  await expect(page.locator('[role="alert"]')).toContainText('fully booked');

  // Should see alternatives
  await expect(page.locator('[data-testid="alternative-times"]')).toBeVisible();
  await expect(page.locator('text=18:45')).toBeVisible();
  await expect(page.locator('text=19:15')).toBeVisible();
});
```

---

## Rollout Plan

### Phase 1: Development (Days 1-10)

- Implement all 6 stories
- Run unit + integration tests locally
- Deploy to staging environment

### Phase 2: Staging Validation (Days 11-12)

- Load testing with 100 concurrent requests
- Manual QA on ops dashboard
- Verify backward compatibility with existing bookings

### Phase 3: Production Rollout (Days 13-14)

**Feature Flag:** `ENABLE_CAPACITY_ENFORCEMENT`

**Day 13: Shadow Mode (0% enforcement)**

- Deploy code to production
- Feature flag OFF
- Monitor capacity calculations in logs
- Compare against existing bookings (should detect any overbookings)

**Day 14: Gradual Rollout**

- 10% of restaurants (select beta partners)
- Monitor for 4 hours
- If stable: 50%
- If stable: 100%

### Phase 4: Monitoring & Iteration (Ongoing)

- Daily overbooking reports
- Weekly capacity utilization analysis
- Monthly table assignment optimization

---

## Metrics & Monitoring

### Key Metrics

**Success Metrics:**

- `booking.capacity_check.success_rate` → Target: 95%+ availability
- `booking.overbooking.count` → Target: 0
- `booking.capacity_exceeded.count` → Track denials

**Performance Metrics:**

- `booking.creation.latency.p95` → Target: < 500ms
- `availability.check.latency.p95` → Target: < 200ms
- `booking.transaction.retry.count` → Monitor retry rate

**Business Metrics:**

- `capacity.utilization.avg` → Track by period/day
- `booking.alternative_accepted.rate` → % who book alternative time
- `capacity.configuration.coverage` → % restaurants with rules

### Alerts

**P0 Alerts (Page on-call):**

- Overbooking detected (hasOverbooking = true)
- Booking creation error rate > 5%
- Database transaction deadlocks > 10/min

**P1 Alerts (Slack notification):**

- Booking latency p95 > 1s
- Capacity rule not configured for active restaurant
- Table inventory count = 0 for restaurant with bookings

### Dashboards

**Capacity Utilization Dashboard:**

```
┌─────────────────────────────────────────┐
│  Capacity Overview - Oct 20, 2025       │
├─────────────────────────────────────────┤
│  Total Capacity: 320 covers             │
│  Booked: 285 covers (89% utilization)   │
│  Available: 35 covers                   │
│                                         │
│  Periods:                               │
│  • Lunch (11-2):    75% (60/80)        │
│  • Dinner (5-10):   94% (225/240)      │
│                                         │
│  Overbookings: 0 ✓                      │
└─────────────────────────────────────────┘
```

---

## Migration & Backward Compatibility

### Database Migrations

**Order:**

1. `001_create_table_inventory.sql`
2. `002_create_booking_slots.sql`
3. `003_create_booking_table_assignments.sql`
4. `004_add_capacity_check_rpc.sql`
5. `005_add_rls_policies.sql`

**Safety:**

- All new tables are additive (no ALTER on existing tables)
- RPC function is new (no breaking changes)
- Existing booking flow works without capacity enforcement until flag is enabled

### Backfill Strategy

**Option 1: No Backfill (Recommended)**

- New system applies only to future bookings
- Historical data remains as-is
- Ops can manually assign tables to upcoming bookings

**Option 2: Partial Backfill (If needed)**

- Backfill only upcoming bookings (booking_date >= CURRENT_DATE)
- Run as background job (not in migration)
- Estimate: ~1000 upcoming bookings = 1 minute

**Code:**

```sql
-- Optional: Backfill slot data for upcoming bookings
INSERT INTO booking_slots (restaurant_id, slot_date, slot_time, available_capacity, reserved_count)
SELECT
  b.restaurant_id,
  b.booking_date,
  b.start_time,
  COALESCE(cr.max_covers, 999),  -- Default to high number if no rule
  COUNT(*) as reserved_count
FROM bookings b
LEFT JOIN restaurant_capacity_rules cr
  ON cr.restaurant_id = b.restaurant_id
WHERE b.booking_date >= CURRENT_DATE
  AND b.status NOT IN ('cancelled', 'no_show')
GROUP BY b.restaurant_id, b.booking_date, b.start_time, cr.max_covers
ON CONFLICT (restaurant_id, slot_date, slot_time) DO NOTHING;
```

---

## Rollback Plan

### Immediate Rollback (if overbooking detected)

1. Set feature flag `ENABLE_CAPACITY_ENFORCEMENT = false`
2. Revert to previous booking endpoint (without capacity check)
3. Investigate root cause in staging

### Database Rollback (if needed)

```sql
-- Rollback RPC function
DROP FUNCTION IF EXISTS create_booking_with_capacity_check;

-- Rollback tables (if no data)
DROP TABLE IF EXISTS booking_table_assignments;
DROP TABLE IF EXISTS booking_slots;
DROP TABLE IF EXISTS table_inventory;
```

**Note:** Only safe if no production data has been written to new tables.

---

## Dependencies

### External Services

- Supabase (PostgreSQL 15+)
- Upstash Redis (rate limiting)

### Internal Dependencies

- Existing: `server/ops/capacity.ts` (reuse utilities)
- Existing: `server/bookings.ts` (extend with capacity check)
- Existing: `server/restaurants/schedule.ts` (operating hours validation)

### Team Dependencies

- Database: Need schema review for RPC function
- Ops: Training on capacity management UI
- Product: Agreement on alternative time suggestions UX

---

## Risk Assessment

| Risk                          | Impact | Likelihood | Mitigation                                    |
| ----------------------------- | ------ | ---------- | --------------------------------------------- |
| Database deadlocks under load | High   | Medium     | Use SERIALIZABLE + retry logic + load testing |
| RPC function has bugs         | High   | Medium     | Extensive unit tests + staging validation     |
| Capacity rules misconfigured  | Medium | High       | Validation UI + default fallback values       |
| Performance degradation       | Medium | Low        | Index optimization + query profiling          |
| Backward compatibility breaks | High   | Low        | Feature flag + shadow mode deployment         |

---

## Open Questions for Review

1. **Table Assignment:** Should we implement auto-assignment in v1 or defer to v2?
   - **Recommendation:** Defer to v2 (less complexity, lower risk)

2. **Pacing Rules:** Should we enforce max bookings per 15-min slot?
   - **Recommendation:** Yes, add `max_bookings_per_slot` to capacity rules

3. **Overbooking Buffer:** Should we allow intentional overbooking (e.g., 105% capacity)?
   - **Recommendation:** No in v1, add in v2 with explicit `overbooking_percentage` field

4. **Alternative Time Suggestions:** How many alternatives to return?
   - **Recommendation:** Max 5, within ±2 hours, sorted by proximity to requested time

---

## Next Steps

1. ✅ Research complete
2. ✅ Plan complete (this document)
3. **Create `todo.md`** with executable checklist
4. **Begin Story 1:** Schema design + migrations
5. **Daily standups:** Review progress and blockers

---

**Document Status:** Ready for Implementation  
**Estimated Effort:** 80 hours (2 developers × 40 hours each)  
**Target Completion:** 2025-10-30
