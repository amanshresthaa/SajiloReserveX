# Quick Start: Managing Service Periods with Drinks Option

## ✅ Setup Complete!

The drinks occasion has been **re-enabled** in the catalog so you can now manage it via the UI.

### Current Status:

```
booking_occasions:
  ✅ lunch  - ACTIVE
  ✅ dinner - ACTIVE
  ✅ drinks - ACTIVE (just re-enabled)

restaurant_service_periods:
  No drinks periods currently configured
```

---

## How to Access the UI

### Step 1: Start the Development Server

```bash
pnpm run dev
```

Wait for:

```
▲ Next.js 16.0.0 (Turbopack)
- Local:        http://localhost:3000
```

### Step 2: Navigate to Restaurant Settings

**URL**: `http://localhost:3000/ops/restaurant-settings`

**Alternative Navigation**:

1. Go to `http://localhost:3000/ops`
2. Click "Restaurant Settings" in the sidebar

### Step 3: Find Service Periods Section

Scroll down to the **"Service Periods"** card:

```
┌──────────────────────────────────────────────┐
│  🍽️ Service Periods                          │
│  Define named service windows for booking    │
│  allocation.                                  │
├──────────────────────────────────────────────┤
│  [Your current service periods listed here]  │
│                                               │
│  [➕ Add service period]  [Reset]  [Save]    │
└──────────────────────────────────────────────┘
```

---

## Managing Service Periods

### View Existing Periods

The UI will show all configured periods with:

- **Name**: User-friendly label (e.g., "Weekday Lunch")
- **Day**: Which day (All days, Monday, Tuesday, etc.)
- **Start**: Opening time (24-hour format)
- **End**: Closing time (24-hour format)
- **Occasion**: Type of service (**Lunch**, **Dinner**, **Drinks**)
- **[🗑️]**: Delete button

### The Occasion Dropdown Now Shows:

```
┌─────────────────────┐
│ Lunch               │
│ Dinner              │
│ Drinks              │ ← NOW AVAILABLE! ✅
└─────────────────────┘
```

### Add a New Service Period

1. Click **"➕ Add service period"**
2. Fill in the fields:
   - **Name**: e.g., "Happy Hour" or "Late Night Cocktails"
   - **Day**: Choose specific day or "All days"
   - **Start**: e.g., `17:00`
   - **End**: e.g., `22:00`
   - **Occasion**: Select **"Drinks"** from dropdown
3. Click **"Save changes"**

### Example Drinks Period Configuration:

```
┌──────────────────────────────────────────────────────┐
│ Name: Happy Hour                                      │
│ Day:  Monday-Friday (create 5 separate periods)       │
│ Start: 17:00                                          │
│ End:   19:00                                          │
│ Occasion: Drinks ✅                                   │
└──────────────────────────────────────────────────────┘
```

Or for late-night service:

```
┌──────────────────────────────────────────────────────┐
│ Name: Late Night Cocktails                            │
│ Day:  Friday, Saturday (create 2 periods)             │
│ Start: 22:00                                          │
│ End:   01:00                                          │
│ Occasion: Drinks ✅                                   │
└──────────────────────────────────────────────────────┘
```

### Delete a Service Period

1. Find the period you want to remove
2. Click the **🗑️** (trash) icon on that row
3. The row disappears immediately
4. Click **"Save changes"** to persist

### Edit a Service Period

1. Click directly in any field to edit
2. Make your changes
3. Click **"Save changes"** when done

---

## Validation Rules

The UI enforces these rules automatically:

✅ **Time Order**: End must be after Start
✅ **No Overlaps**: Periods on the same day can't overlap
✅ **Required Fields**: Name, Start, End, and Occasion must be filled
❌ **Invalid Times**: Will show red error messages

---

## How Changes Affect the Booking Wizard

### After saving service periods with Drinks:

**Time Picker will show**:

```
┌──────────────────────────────────────────┐
│  Pick a time                              │
├──────────────────────────────────────────┤
│  ⭕ 12:00  Lunch                         │
│  ⭕ 17:00  Dinner                        │
│  ⭕ 21:00  Drinks & cocktails  🍸        │ ← Appears!
│            [Drinks only badge]            │
└──────────────────────────────────────────┘
```

### The Badge Logic:

- **"Drinks only"** badge = When lunch AND dinner are disabled for that slot, but drinks is enabled
- Shows on late-night slots or dedicated cocktail hours
- Helps users understand it's bar service only

---

## Testing Your Changes

### 1. Add a Drinks Period via UI

```bash
# Make sure dev server is running
pnpm run dev
```

1. Go to `http://localhost:3000/ops/restaurant-settings`
2. Add a drinks period (e.g., Friday 22:00-01:00)
3. Save

### 2. Verify in Booking Wizard

1. Open `http://localhost:3000/reserve/r/the-queen-elizabeth-pub`
2. Click "Plan your visit"
3. Select Friday
4. Look at time slots around 22:00-01:00
5. Should see **"Drinks & cocktails"** option with badge! ✨

### 3. Check Network Request

Open DevTools → Network tab:

```
Request: GET /api/restaurants/the-queen-elizabeth-pub/schedule?date=2025-11-14

Response should include:
{
  "availableBookingOptions": ["lunch", "dinner", "drinks"],
  "slots": [
    {
      "value": "22:00",
      "bookingOption": "drinks",
      "availability": {
        "services": {
          "drinks": "enabled",
          "lunch": "disabled",
          "dinner": "disabled"
        },
        "labels": {
          "drinksOnly": true,  ← This triggers the badge
          "happyHour": false
        }
      }
    }
  ]
}
```

---

## Common Patterns

### Happy Hour (Drinks during normal hours)

```
Name: Happy Hour
Day:  Monday-Friday
Start: 17:00
End:   19:00
Occasion: Drinks

Result: Overlaps with dinner service
Badge: Shows "Happy hour" + drink icon (not "Drinks only")
```

### Late Night Bar (Drinks after kitchen closes)

```
Name: Late Night Bar
Day:  Friday, Saturday
Start: 22:00
End:   01:00
Occasion: Drinks

Result: Kitchen closed, bar only
Badge: Shows "Drinks only" + "Kitchen closed"
```

### All-Day Drinks (Alongside meals)

```
Configure multiple periods per day:
├─ Lunch Service   (11:30-14:30) → lunch
├─ Drinks Available (11:30-23:00) → drinks  ← Spans all day
└─ Dinner Service  (17:00-22:00) → dinner

Result: Drinks available at all times
Badge: No "Drinks only" (other options available)
```

---

## Data Flow Recap

```
User Action in UI
    ↓
ServicePeriodsSection.tsx
    ↓
POST /api/owner/restaurants/[id]/service-periods
    ↓
server/restaurants/servicePeriods.ts
    ↓
Supabase: restaurant_service_periods table
    ↓
On next schedule fetch:
    ↓
server/restaurants/schedule.ts
    ↓
Builds slots with drinks availability
    ↓
Frontend TimeSlotGrid.tsx
    ↓
Renders "Drinks" option with appropriate badges ✨
```

---

## Rollback (If Needed)

### To disable drinks again:

**Via Database**:

```sql
UPDATE booking_occasions
SET is_active = false
WHERE key = 'drinks';
```

**Via UI**:

1. Delete all service periods with Occasion = "Drinks"
2. Drinks will no longer appear in booking wizard
3. (Optionally disable in catalog via SQL above)

---

## Summary

✅ **Drinks occasion is now ACTIVE** (`is_active = true`)
✅ **Appears in Service Periods dropdown** at `/ops/restaurant-settings`
✅ **No existing drinks periods** (clean slate)
✅ **Ready to configure** via the UI

### Next Steps:

1. Start dev server: `pnpm run dev`
2. Visit: `http://localhost:3000/ops/restaurant-settings`
3. Add drinks service periods as needed
4. Test in booking wizard
5. Enjoy your cocktails! 🍸✨

**No code changes needed - everything works via the existing UI!** 🚨🚨🚨
