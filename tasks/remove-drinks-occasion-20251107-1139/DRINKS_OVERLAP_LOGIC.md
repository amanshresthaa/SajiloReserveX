# Drinks Overlap Logic - Implementation Guide

## Problem Statement

**Drinks service has different operational logic than lunch/dinner:**

- **Lunch/Dinner**: Distinct time windows that shouldn't overlap (e.g., can't have two lunch periods at the same time)
- **Drinks**: Available throughout operating hours, can run from opening to closing, and **should be allowed to overlap** with meal services

## Examples

### ✅ Valid Configuration (Drinks Overlaps with Meals)

```
Monday Service Periods:
├─ All Day Bar      (11:00-23:00) → drinks   ✅ Spans entire day
├─ Lunch Service    (11:30-14:30) → lunch    ✅ Overlaps with drinks (allowed!)
└─ Dinner Service   (17:00-22:00) → dinner   ✅ Overlaps with drinks (allowed!)

Result: Customers can book drinks at any time, meals during specific windows
```

### ✅ Valid Configuration (Happy Hour During Dinner)

```
Friday Service Periods:
├─ Lunch            (11:30-14:30) → lunch
├─ Dinner           (17:00-22:00) → dinner
└─ Happy Hour       (17:00-19:00) → drinks   ✅ Overlaps with dinner (allowed!)

Result: Happy hour specials during early dinner hours
```

### ❌ Invalid Configuration (Same Type Overlaps)

```
Friday Service Periods:
├─ Early Dinner     (17:00-20:00) → dinner
└─ Late Dinner      (19:00-23:00) → dinner   ❌ Overlaps with another dinner period

Result: Validation error - can't have two dinner periods overlapping
```

```
Saturday Service Periods:
├─ Happy Hour       (17:00-19:00) → drinks
└─ Late Night Bar   (18:00-02:00) → drinks   ❌ Overlaps with another drinks period

Result: Validation error - can't have two drinks periods overlapping
```

---

## Updated Validation Rules

### Rule 1: Same Occasion Type = No Overlap ❌

**Lunch cannot overlap with Lunch:**

```
❌ Lunch 1: 11:00-14:00
   Lunch 2: 13:00-15:00 (overlaps!)
```

**Dinner cannot overlap with Dinner:**

```
❌ Dinner 1: 17:00-21:00
   Dinner 2: 19:00-23:00 (overlaps!)
```

**Drinks cannot overlap with Drinks:**

```
❌ Drinks 1: 11:00-20:00
   Drinks 2: 15:00-23:00 (overlaps!)
```

### Rule 2: Drinks CAN Overlap with Lunch/Dinner ✅

**Drinks can overlap with Lunch:**

```
✅ Lunch:  11:30-14:30
   Drinks: 11:00-23:00 (overlaps - allowed!)
```

**Drinks can overlap with Dinner:**

```
✅ Dinner: 17:00-22:00
   Drinks: 17:00-19:00 (overlaps - allowed!)
```

**Multiple periods with drinks overlaps:**

```
✅ Lunch:      11:30-14:30
   Dinner:     17:00-22:00
   All Day Bar: 11:00-23:00 (drinks - overlaps with both!)
```

---

## Implementation Details

### Code Changes

**File:** `src/components/features/restaurant-settings/ServicePeriodsSection.tsx`

**Before (All overlaps blocked):**

```typescript
if (prev.end > current.start) {
  newErrors[prev.index].endTime = 'Overlaps';
  newErrors[current.index].startTime = 'Overlaps';
  valid = false;
}
```

**After (Drinks overlaps allowed):**

```typescript
if (prev.end > current.start) {
  // Allow drinks to overlap with lunch/dinner (and vice versa)
  const isDrinksOverlap =
    (prev.bookingOption === 'drinks' &&
      (current.bookingOption === 'lunch' || current.bookingOption === 'dinner')) ||
    (current.bookingOption === 'drinks' &&
      (prev.bookingOption === 'lunch' || prev.bookingOption === 'dinner'));

  // Only flag as error if it's not a drinks overlap
  if (!isDrinksOverlap) {
    newErrors[prev.index].endTime = 'Overlaps';
    newErrors[current.index].startTime = 'Overlaps';
    valid = false;
  }
}
```

### Data Structure Update

Added `bookingOption` to the overlap detection data:

```typescript
const byDay = new Map<
  number | null,
  Array<{
    start: string | null;
    end: string | null;
    index: number;
    bookingOption: string; // ← Added this
  }>
>();
```

---

## Common Use Cases

### Use Case 1: All-Day Bar with Meal Services

**Goal:** Drinks available all day, meals at specific times

```
Configuration:
├─ All Day Bar      (11:00-23:00) → drinks
├─ Lunch            (11:30-14:30) → lunch
└─ Dinner           (17:00-22:00) → dinner

Validation: ✅ PASS
Reason: Drinks overlaps allowed with lunch and dinner
```

**Customer Experience:**

- Can book drinks-only reservation at 10:00 AM
- Can book lunch with drinks at 12:00 PM
- Can book dinner with drinks at 7:00 PM
- Can book drinks-only at 10:00 PM

### Use Case 2: Happy Hour During Dinner

**Goal:** Special drinks pricing during early dinner hours

```
Configuration:
├─ Lunch            (11:30-14:30) → lunch
├─ Dinner           (17:00-22:00) → dinner
└─ Happy Hour       (17:00-19:00) → drinks

Validation: ✅ PASS
Reason: Drinks (Happy Hour) can overlap with dinner
```

**Customer Experience:**

- 5:00 PM slot shows: "Dinner" + "Happy hour" badge
- 5:30 PM slot shows: "Dinner" + "Happy hour" badge
- 7:30 PM slot shows: "Dinner" only (Happy Hour ended)

### Use Case 3: Late Night Bar After Kitchen Closes

**Goal:** Drinks continue after meal service ends

```
Configuration:
├─ Dinner           (17:00-22:00) → dinner
└─ Late Night Bar   (22:00-02:00) → drinks

Validation: ✅ PASS
Reason: No overlap (dinner ends when drinks starts)
```

**Customer Experience:**

- 9:00 PM slot shows: "Dinner"
- 10:00 PM slot shows: "Drinks only" + "Kitchen closed" badges

### Use Case 4: Brunch with Bottomless Mimosas

**Goal:** Brunch meal service with drinks throughout

```
Configuration (Saturday-Sunday):
├─ Brunch           (10:00-15:00) → lunch (using lunch occasion)
└─ Brunch Drinks    (10:00-15:00) → drinks

Validation: ✅ PASS
Reason: Drinks can overlap with lunch (brunch uses lunch occasion)
```

**Customer Experience:**

- All brunch slots show both "Lunch" and drink availability
- Can book brunch with bottomless mimosas

---

## Invalid Configurations (Will Show Errors)

### Example 1: Overlapping Lunch Periods ❌

```
Configuration:
├─ Early Lunch      (11:00-13:30) → lunch
└─ Late Lunch       (12:00-14:30) → lunch

Validation: ❌ FAIL
Error: "Overlaps" on both periods
Fix: Merge into one lunch period or adjust times to not overlap
```

### Example 2: Overlapping Dinner Periods ❌

```
Configuration:
├─ Early Seating    (17:00-20:00) → dinner
└─ Late Seating     (19:00-22:00) → dinner

Validation: ❌ FAIL
Error: "Overlaps" on both periods
Fix: Use one dinner period (17:00-22:00)
```

### Example 3: Overlapping Drinks Periods ❌

```
Configuration:
├─ Happy Hour       (17:00-19:00) → drinks
└─ Evening Cocktails (18:00-23:00) → drinks

Validation: ❌ FAIL
Error: "Overlaps" on both periods
Fix: Merge into one drinks period (17:00-23:00) or adjust times
```

---

## Testing Checklist

### Test 1: Drinks Overlapping Lunch ✅

- [ ] Add lunch period: 11:30-14:30
- [ ] Add drinks period: 11:00-23:00
- [ ] Click "Save changes"
- [ ] Expected: Success (no overlap error)

### Test 2: Drinks Overlapping Dinner ✅

- [ ] Add dinner period: 17:00-22:00
- [ ] Add drinks period: 17:00-19:00 (Happy Hour)
- [ ] Click "Save changes"
- [ ] Expected: Success (no overlap error)

### Test 3: Drinks Overlapping Both Meals ✅

- [ ] Add lunch period: 11:30-14:30
- [ ] Add dinner period: 17:00-22:00
- [ ] Add drinks period: 11:00-23:00 (All day)
- [ ] Click "Save changes"
- [ ] Expected: Success (no overlap error)

### Test 4: Lunch Overlapping Lunch ❌

- [ ] Add lunch period 1: 11:00-13:30
- [ ] Add lunch period 2: 12:00-14:30
- [ ] Click "Save changes"
- [ ] Expected: Error "Overlaps" shown

### Test 5: Dinner Overlapping Dinner ❌

- [ ] Add dinner period 1: 17:00-20:00
- [ ] Add dinner period 2: 19:00-22:00
- [ ] Click "Save changes"
- [ ] Expected: Error "Overlaps" shown

### Test 6: Drinks Overlapping Drinks ❌

- [ ] Add drinks period 1: 11:00-20:00
- [ ] Add drinks period 2: 15:00-23:00
- [ ] Click "Save changes"
- [ ] Expected: Error "Overlaps" shown

---

## Backend Behavior

### Schedule Building

The backend (`server/restaurants/schedule.ts`) reads all service periods and builds time slots:

**When drinks overlaps with meals:**

```typescript
// Example: 5:30 PM on Friday
// Periods active: Dinner (17:00-22:00), Happy Hour (17:00-19:00)

Slot {
  value: "17:30",
  bookingOption: "dinner",  // Primary booking type
  availability: {
    services: {
      lunch: "disabled",
      dinner: "enabled",     // Dinner period active
      drinks: "enabled"      // Happy Hour active
    },
    labels: {
      happyHour: true,       // Drinks period during dinner
      drinksOnly: false,     // Not drinks-only (dinner available too)
      dinnerWindow: true
    }
  }
}
```

**Customer sees:**

- Main option: "Dinner"
- Badge: "Happy hour" 🍸
- Can book a dinner reservation with drink specials

### Availability Logic

**3 occasions active simultaneously:**

```
Time: 12:00 PM
Active periods:
├─ Lunch (11:30-14:30)
└─ All Day Bar (11:00-23:00)

Result:
  services: { lunch: "enabled", drinks: "enabled", dinner: "disabled" }
  Primary booking: "lunch"
  Badge: Shows drink availability
```

---

## Migration Guide

### If You Already Have Service Periods

**Before update:**

- Overlapping drinks periods would show validation errors
- Had to create non-overlapping time windows

**After update:**

- Drinks can overlap with lunch/dinner
- Can create all-day bar service
- Happy hours can overlap meal times

**Action required:**

1. Review your existing service periods
2. If you have non-overlapping drinks periods that should span meals:
   - Edit them to extend across the full operating hours
   - Save (will now pass validation)
3. Test in booking wizard to verify correct badges

---

## Summary

✅ **What Changed:**

- Drinks periods can now overlap with lunch/dinner periods
- Validation allows drinks + meal overlaps
- Same-type overlaps still blocked (lunch+lunch, dinner+dinner, drinks+drinks)

✅ **Why This Matters:**

- Reflects real restaurant operations (bar open all day)
- Enables happy hour during dinner service
- Allows flexible drink availability configurations

✅ **No Breaking Changes:**

- Existing valid configurations still work
- Only enables previously blocked configurations
- API/backend unchanged (already supported overlaps)

**This update aligns the UI validation with real-world restaurant operations where drinks service typically runs throughout operating hours!** 🍸✨🚨🚨🚨
