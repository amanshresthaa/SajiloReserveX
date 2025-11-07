# UI Guide: Managing Service Periods

## Quick Navigation

**URL**: `http://localhost:3000/ops/restaurant-settings`

**Component**: `ServicePeriodsSection.tsx`

---

## What You'll See

```
┌──────────────────────────────────────────────────────────┐
│  Restaurant Settings                                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  📋 Restaurant Profile                                    │
│     [Restaurant details, timezone, etc.]                  │
│                                                           │
│  🕐 Operating Hours                                       │
│     [Daily open/close times]                              │
│                                                           │
│  🍽️ Service Periods  ← YOU NEED THIS                     │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Define named service windows for booking allocation │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │                                                      │ │
│  │  Service Period Rows (one per configured window):   │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │ Name   Day   Start  End    Occasion    [🗑️] │   │ │
│  │  ├──────────────────────────────────────────────┤   │ │
│  │  │ Lunch  Mon   11:30  14:30  Lunch       [🗑️] │   │ │
│  │  │ Dinner Mon   17:00  22:00  Dinner      [🗑️] │   │ │
│  │  │ Drinks Fri   22:00  01:00  Drinks      [🗑️] │ ← DELETE THIS!
│  │  └──────────────────────────────────────────────┘   │ │
│  │                                                      │ │
│  │  [➕ Add service period] [Reset] [Save changes]     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Fields Explained

| Field        | Description               | Options                                      |
| ------------ | ------------------------- | -------------------------------------------- |
| **Name**     | User-friendly label       | Text (e.g., "Weekday Lunch", "Happy Hour")   |
| **Day**      | Which day this applies to | All days, Sunday, Monday, ..., Saturday      |
| **Start**    | Time window begins        | 24-hour format (e.g., 11:30)                 |
| **End**      | Time window ends          | 24-hour format (e.g., 14:30)                 |
| **Occasion** | Type of service           | **Lunch**, **Dinner**, ~~Drinks~~ (disabled) |

---

## How the Occasion Dropdown Works

The dropdown is populated from the `booking_occasions` table:

```tsx
// Component code (ServicePeriodsSection.tsx):
const { data, error, isLoading } = useOpsOccasions();

// Occasions query returns:
[
  { key: 'lunch',  label: 'Lunch',  is_active: true  },  ✅ Shows in dropdown
  { key: 'dinner', label: 'Dinner', is_active: true  },  ✅ Shows in dropdown
  { key: 'drinks', label: 'Drinks', is_active: false },  ❌ Hidden (inactive)
]
```

**Current State**:

- Since `drinks` is disabled (`is_active = false`), it won't appear in the dropdown for **new** periods
- But **existing** periods with `booking_option = 'drinks'` will still display the value
- You just can't _create new_ drinks periods

---

## Action Steps

### 1️⃣ Find Drinks Periods

Look for rows where **Occasion** shows **"Drinks"** or **"Drinks & Cocktails"**

### 2️⃣ Choose Your Cleanup Strategy

**Option A: Delete** (Recommended if drinks service no longer offered)

```
Click the 🗑️ (trash) icon → Row disappears → Click "Save changes"
```

**Option B: Remap** (If you want to keep the time window but change the type)

```
Change Occasion dropdown from "Drinks" to "Lunch" or "Dinner" → Click "Save changes"
```

**Example Remapping**:

```
Before:
  Name: "Late Night Cocktails"
  Time: 22:00 - 01:00
  Occasion: Drinks ❌

After:
  Name: "Late Dinner"
  Time: 22:00 - 01:00
  Occasion: Dinner ✅
```

### 3️⃣ Save and Verify

1. Click **"Save changes"** button (bottom right)
2. Wait for success toast: "Service periods updated"
3. Open booking wizard in a new tab
4. Select a date/time that previously showed "Drinks only"
5. Verify badge is gone ✅

---

## Validation Rules (Built-in)

The UI will prevent you from saving if:

- ❌ Name is empty
- ❌ Start or End time is missing/invalid
- ❌ End time is before Start time
- ❌ Two periods on the same day overlap
- ❌ No occasion selected

**You'll see red error messages** under the invalid fields.

---

## Data Flow (How Changes Propagate)

```
User clicks "Save changes"
    ↓
ServicePeriodsSection.tsx calls updateMutation
    ↓
POST /api/owner/restaurants/[id]/service-periods
    ↓
server/restaurants/servicePeriods.ts validates and saves
    ↓
Supabase UPDATE/INSERT/DELETE on restaurant_service_periods
    ↓
React Query invalidates cache
    ↓
Next booking schedule fetch picks up new config
    ↓
server/restaurants/schedule.ts builds slots (no more drinks!)
    ↓
Frontend TimeSlotGrid renders without "Drinks only" badge ✨
```

**Timeline**: Changes take effect immediately on next schedule fetch (within seconds)

---

## Troubleshooting

### "Occasion dropdown is empty"

**Cause**: No active occasions in `booking_occasions` table

**Fix**:

1. Check database: `SELECT * FROM booking_occasions WHERE is_active = true;`
2. Should see `lunch` and `dinner` active
3. If not, run seed script or manually activate them

### "Can't see drinks in dropdown"

**Expected!** Since `drinks` is disabled (`is_active = false`), it won't appear in the dropdown.

But existing periods _with_ `booking_option = 'drinks'` will still display that value.

### "Save button is disabled"

**Causes**:

- No changes made (button only enables when `isDirty = true`)
- Validation errors (fix red error messages first)
- Save in progress (button disabled during mutation)

### "Drinks badge still appears after saving"

**Checks**:

1. Did you actually delete/remap ALL drinks periods?
2. Did the save succeed? (Check for success toast)
3. Hard refresh the wizard page (Cmd/Ctrl + Shift + R)
4. Check network tab: Does `/api/restaurants/[slug]/schedule` still return `"drinks"` in `availableBookingOptions`?

---

## Database Queries (For Reference)

### View Current Service Periods

```sql
SELECT
  r.name as restaurant_name,
  sp.name as period_name,
  sp.day_of_week,
  sp.start_time,
  sp.end_time,
  sp.booking_option
FROM restaurant_service_periods sp
JOIN restaurants r ON sp.restaurant_id = r.id
ORDER BY r.name, sp.day_of_week, sp.start_time;
```

### Find All Drinks Periods

```sql
SELECT
  id,
  restaurant_id,
  name,
  CASE
    WHEN day_of_week IS NULL THEN 'All days'
    WHEN day_of_week = 0 THEN 'Sunday'
    WHEN day_of_week = 1 THEN 'Monday'
    WHEN day_of_week = 2 THEN 'Tuesday'
    WHEN day_of_week = 3 THEN 'Wednesday'
    WHEN day_of_week = 4 THEN 'Thursday'
    WHEN day_of_week = 5 THEN 'Friday'
    WHEN day_of_week = 6 THEN 'Saturday'
  END as day,
  start_time,
  end_time,
  booking_option
FROM restaurant_service_periods
WHERE booking_option = 'drinks';
```

---

## Summary

✅ **The UI already exists** and is production-ready
✅ **No code changes needed** - just configuration cleanup
✅ **Safe and validated** - the UI prevents common mistakes
✅ **Instant propagation** - changes reflect on next schedule fetch

**Your intuition was correct**: This should be managed via UI, not manual DB edits! 🎯
