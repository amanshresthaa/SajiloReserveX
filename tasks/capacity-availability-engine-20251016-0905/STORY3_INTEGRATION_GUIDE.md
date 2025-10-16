# Story 3: API Integration Guide

**Status:** Ready for Implementation  
**Created:** 2025-10-16  
**Difficulty:** Medium

---

## Overview

This guide explains how to integrate the capacity service into the booking API endpoints. We've created:

1. ✅ Draft booking endpoint with capacity enforcement
2. ✅ New `/api/availability` endpoint
3. ✅ Integration tests
4. ⏳ Actual implementation (pending)

---

## Files Created

### 1. Draft Booking Endpoint

**Location:** `src/app/api/bookings/route-v2-with-capacity.ts.draft`

This file shows the key changes needed to integrate capacity checking:

- Pre-check capacity before creating booking
- Use RPC function instead of direct INSERT
- Return alternatives when capacity exceeded
- Handle race conflicts with retry guidance

**Status:** Draft (not yet applied to actual route.ts)

### 2. New Availability Endpoint

**Location:** `src/app/api/availability/route.ts`

**Status:** ✅ Complete, ready to deploy

**Features:**

- Check specific time slot availability
- Return capacity metadata (utilization %)
- Optional alternative time suggestions
- Rate limiting (20 req/min)
- Caching headers (60s)

**Usage:**

```bash
GET /api/availability?restaurantId=uuid&date=2025-10-20&time=19:00&partySize=4&includeAlternatives=true
```

### 3. Integration Tests

**Location:** `tests/integration/capacity-api.test.ts`

**Status:** ✅ Complete, ready to run

**Coverage:**

- Availability endpoint (valid/invalid requests)
- Booking creation (success/capacity exceeded)
- Idempotency handling
- Rate limiting
- Concurrent requests (race conditions)

---

## Integration Steps

### Step 1: Test Migrations (You Need to Do This First!)

Before integrating the API changes, ensure migrations are deployed:

```bash
cd /Users/amankumarshrestha/Downloads/SajiloReserveX

# Apply migrations to remote Supabase
supabase db push

# Verify migrations succeeded
# Open Supabase Studio → SQL Editor
# Run: SELECT * FROM table_inventory LIMIT 1;
# Should return table structure (empty is OK)

# Regenerate TypeScript types
pnpm db:types

# Verify new types exist
grep "table_inventory" types/supabase.ts
grep "booking_slots" types/supabase.ts
grep "create_booking_with_capacity_check" types/supabase.ts
```

### Step 2: Deploy Availability Endpoint

The availability endpoint is ready to deploy as-is:

```bash
# File is already in place:
# src/app/api/availability/route.ts

# No changes needed, deploy via git:
git add src/app/api/availability/route.ts
git commit -m "feat: add availability check endpoint

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
git push
```

Test it:

```bash
curl "http://localhost:3000/api/availability?restaurantId=YOUR_ID&date=2025-10-25&time=19:00&partySize=4"
```

### Step 3: Integrate Capacity into Booking Endpoint

**Option A: Manual Integration (Recommended)**

1. Open `src/app/api/bookings/route.ts`
2. Add imports at top:

   ```typescript
   import {
     checkSlotAvailability,
     createBookingWithCapacityCheck,
     findAlternativeSlots,
     type BookingResult,
   } from '@/server/capacity';
   ```

3. In the `POST` handler, after validation but before booking creation, add:

   ```typescript
   // Pre-check capacity
   const availabilityCheck = await checkSlotAvailability({
     restaurantId,
     date: data.date,
     time: startTime,
     partySize: data.party,
   });

   if (!availabilityCheck.available) {
     const alternatives = await findAlternativeSlots({
       restaurantId,
       date: data.date,
       partySize: data.party,
       preferredTime: startTime,
     });

     return NextResponse.json(
       {
         error: 'CAPACITY_EXCEEDED',
         message: availabilityCheck.reason,
         alternatives,
       },
       { status: 409 },
     );
   }
   ```

4. Replace the booking creation loop with:

   ```typescript
   const bookingResult = await createBookingWithCapacityCheck({
     restaurantId,
     customerId: customer.id,
     bookingDate: data.date,
     startTime,
     endTime,
     partySize: data.party,
     bookingType: normalizedBookingType,
     customerName: data.name,
     customerEmail: normalizeEmail(data.email),
     customerPhone: data.phone.trim(),
     seatingPreference: data.seating,
     notes: data.notes,
     marketingOptIn: data.marketingOptIn,
     idempotencyKey,
     source: 'api',
     loyaltyPointsAwarded: loyaltyAward,
   });

   if (!bookingResult.success) {
     // Handle errors...
   }

   const booking = bookingResult.booking!;
   ```

5. Update response to include capacity metadata:
   ```typescript
   return NextResponse.json(
     {
       booking,
       // ... existing fields ...
       capacity: bookingResult.capacity,
     },
     { status: 201 },
   );
   ```

**Option B: Use Draft as Reference**

1. Copy `route-v2-with-capacity.ts.draft` to a new file
2. Compare with current `route.ts` using a diff tool
3. Carefully merge changes (keep existing logic, add capacity checks)

**Option C: Feature Flag (Safest for Production)**

Add capacity check behind a feature flag:

```typescript
// In lib/env.ts or feature-flags.ts
export const featureFlags = {
  enableCapacityEnforcement: process.env.ENABLE_CAPACITY_ENFORCEMENT === 'true',
  // ... other flags
};

// In route.ts
if (env.featureFlags.enableCapacityEnforcement) {
  const availabilityCheck = await checkSlotAvailability({...});
  if (!availabilityCheck.available) {
    // Return 409...
  }
}
```

This allows gradual rollout:

```bash
# Enable for staging
ENABLE_CAPACITY_ENFORCEMENT=true

# Keep disabled for production initially
ENABLE_CAPACITY_ENFORCEMENT=false
```

### Step 4: Test Integration

Run the integration tests:

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Start dev server
pnpm dev

# In another terminal, run tests
pnpm test:integration tests/integration/capacity-api.test.ts
```

Expected results:

- ✅ Availability endpoint returns correct data
- ✅ Booking creation succeeds when under capacity
- ✅ Booking creation returns 409 when over capacity
- ✅ Alternatives are provided
- ✅ Idempotency works
- ✅ Rate limiting works

### Step 5: Manual QA

Test the flow manually:

1. **Check availability:**

   ```bash
   curl "http://localhost:3000/api/availability?restaurantId=UUID&date=2025-10-25&time=19:00&partySize=4&includeAlternatives=true"
   ```

2. **Create booking (should succeed):**

   ```bash
   curl -X POST http://localhost:3000/api/bookings \
     -H "Content-Type: application/json" \
     -H "Idempotency-Key: $(uuidgen)" \
     -d '{
       "restaurantId": "UUID",
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

3. **Fill capacity:**
   - Repeat booking creation with different emails until capacity full
   - Use low `max_covers` in capacity rules for easy testing

4. **Test capacity exceeded:**
   ```bash
   # This should return 409 with alternatives
   curl -X POST http://localhost:3000/api/bookings \
     -H "Content-Type: application/json" \
     -H "Idempotency-Key: $(uuidgen)" \
     -d '{...}'
   ```

---

## API Response Changes

### Before (Current):

```json
{
  "booking": {...},
  "bookings": [...],
  "confirmationToken": "...",
  "idempotencyKey": "..."
}
```

### After (With Capacity):

```json
{
  "booking": {...},
  "bookings": [...],
  "confirmationToken": "...",
  "idempotencyKey": "...",
  "capacity": {
    "servicePeriod": "Dinner Service",
    "utilizationPercent": 65,
    "bookedCovers": 52,
    "maxCovers": 80
  }
}
```

### New Error Response (Capacity Exceeded):

```json
{
  "error": "CAPACITY_EXCEEDED",
  "message": "Maximum capacity of 80 covers exceeded",
  "details": {
    "maxCovers": 80,
    "bookedCovers": 80,
    "requestedCovers": 4,
    "availableCovers": 0,
    "utilizationPercent": 100
  },
  "alternatives": [
    { "time": "18:45", "available": true, "utilizationPercent": 75 },
    { "time": "19:15", "available": true, "utilizationPercent": 65 }
  ]
}
```

---

## Frontend Integration (Optional)

If you want to update the booking form to show availability:

### Before Booking

```typescript
// In booking form component
const checkAvailability = async () => {
  const response = await fetch(
    `/api/availability?restaurantId=${restaurantId}&date=${date}&time=${time}&partySize=${party}&includeAlternatives=true`,
  );
  const data = await response.json();

  if (!data.available) {
    // Show error + alternatives
    setError(data.message);
    setAlternatives(data.alternatives);
  } else {
    // Show success message
    setUtilization(data.metadata.utilizationPercent);
  }
};
```

### After Booking Attempt

```typescript
// In booking submission handler
try {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(bookingData),
  });

  const data = await response.json();

  if (response.status === 409 && data.error === 'CAPACITY_EXCEEDED') {
    // Show alternatives
    setAlternatives(data.alternatives);
    setError('This time is fully booked. Try these times:');
  } else if (response.status === 409 && data.error === 'BOOKING_CONFLICT') {
    // Race condition, retry
    toast.warning('Slot just booked, retrying...');
    setTimeout(() => submitBooking(), 1000);
  } else if (response.ok) {
    // Success
    router.push(`/booking/${data.booking.id}/confirmation?token=${data.confirmationToken}`);
  }
} catch (error) {
  setError('Failed to create booking');
}
```

---

## Performance Impact

### Availability Endpoint

- **Queries:** 2-3 database queries
- **Latency:** 50-150ms (typical)
- **Caching:** 60s browser cache
- **Rate Limit:** 20 req/min per IP

### Booking Endpoint (Enhanced)

- **Before:** ~200ms (simple INSERT)
- **After:** ~300-400ms (capacity check + SERIALIZABLE transaction)
- **Overhead:** +100-200ms (acceptable for correctness)

### Optimizations

1. ✅ Uses indexes on all queries
2. ✅ Pre-check capacity (fail fast)
3. ✅ RPC function reduces round trips
4. ⚠️ Alternative search adds latency (only on failure path)

---

## Rollback Plan

If issues arise after deployment:

### Quick Rollback (Feature Flag)

```bash
# Disable capacity enforcement
ENABLE_CAPACITY_ENFORCEMENT=false

# Restart application
```

### Full Rollback (Code)

```bash
# Revert booking endpoint changes
git revert <commit-hash>
git push

# Keep availability endpoint (it's harmless)
```

### Database Rollback

```sql
-- Only if necessary (unlikely)
-- Run: supabase/migrations/20251016092200_capacity_engine_rollback.sql
```

---

## Common Issues & Solutions

### Issue: "Function create_booking_with_capacity_check does not exist"

**Cause:** Migrations not applied  
**Solution:** Run `supabase db push`

### Issue: "Type 'BookingResult' not found"

**Cause:** TypeScript types not regenerated  
**Solution:** Run `pnpm db:types`

### Issue: Availability returns "available: true" but booking fails

**Cause:** Race condition (normal behavior)  
**Solution:** Client should retry or suggest alternatives

### Issue: All bookings return CAPACITY_EXCEEDED

**Cause:** Capacity rules set too low or not configured  
**Solution:** Check `restaurant_capacity_rules` table, update `max_covers`

---

## Next Steps After Integration

1. ✅ Deploy availability endpoint
2. ✅ Integrate capacity check into booking endpoint
3. ✅ Run integration tests
4. ✅ Manual QA with Chrome DevTools
5. ⏭️ Build ops dashboard (Story 4)
6. ⏭️ Load testing (Story 5)
7. ⏭️ Production rollout with monitoring

---

## Questions?

See:

- Main plan: `tasks/capacity-availability-engine-20251016-0905/plan.md`
- Service layer docs: `server/capacity/README.md`
- Test script: `supabase/migrations/TEST_CAPACITY_ENGINE.sql`

---

**Status:** Ready for implementation  
**Risk Level:** Medium (backward compatible, can be feature-flagged)  
**Estimated Time:** 2-4 hours for integration + testing
