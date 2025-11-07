# Implementation Checklist

## Discovery ✅

- [x] Run Supabase remote queries to capture current `booking_occasions` data (found `drinks` DISABLED)
- [x] Attempt to gather `restaurant_service_periods` rows referencing `drinks` (query failed - wrong column name)
- [x] **KEY FINDING**: Discovered existing Service Periods UI at `/ops/restaurant-settings`

## Recommended Approach: Use the UI ✨

### Why UI > Database Edits:

- ✅ Built-in validation (time order, overlaps, foreign keys)
- ✅ Safe transactional saves
- ✅ Audit trail with timestamps
- ✅ No SQL syntax errors
- ✅ Real-time feedback

### Steps:

- [ ] Navigate to `/ops/restaurant-settings` in browser
- [ ] Scroll to "Service Periods" card
- [ ] Identify all periods with **Occasion = "Drinks"**
- [ ] For each drinks period, choose:
  - [ ] **Option A**: Delete (click trash icon) if drinks no longer offered
  - [ ] **Option B**: Remap to "Lunch" or "Dinner" if keeping the time window
- [ ] Click "Save changes" button
- [ ] Wait for success toast: "Service periods updated"

## Verification ✅

- [ ] Open booking wizard in new tab (`/reserve/r/[slug]`)
- [ ] Select a date (e.g., Friday or Saturday if drinks was late-night)
- [ ] Pick a time that previously showed "Drinks only" badge
- [ ] Confirm badge is GONE and only "Lunch"/"Dinner" labels appear
- [ ] (Optional) Check network tab: `/api/restaurants/[slug]/schedule` response should have empty or no `drinks` in `availableBookingOptions`

## Documentation

- [x] Create SOLUTION_SUMMARY.md (explains why UI is the right approach)
- [x] Create UI_GUIDE.md (step-by-step with screenshots/diagrams)
- [x] Update verification.md with findings

## Alternative: Database Cleanup (Only if UI Inaccessible)

**Use only if the UI is broken or inaccessible**

- [ ] Connect to remote DB: `supabase db remote psql --db-url "$SUPABASE_DB_URL"`
- [ ] Find drinks periods:
  ```sql
  SELECT id, restaurant_id, name, day_of_week, start_time, end_time
  FROM restaurant_service_periods
  WHERE booking_option = 'drinks';
  ```
- [ ] Delete or remap:

  ```sql
  -- Delete approach
  DELETE FROM restaurant_service_periods WHERE booking_option = 'drinks';

  -- OR remap to dinner
  UPDATE restaurant_service_periods
  SET booking_option = 'dinner'
  WHERE booking_option = 'drinks';
  ```

- [ ] Document before/after snapshots in verification.md

## Notes

**Key Insight**: The system is already designed correctly! 🎯

- ✅ `booking_occasions` table acts as a catalog (system-wide occasion types)
- ✅ `restaurant_service_periods` table holds per-restaurant time windows
- ✅ UI at `/ops/restaurant-settings` manages service periods safely
- ✅ Drinks occasion is already disabled (`is_active = false`)
- ⚠️ Just need to clean up old service period configs that still reference `'drinks'`

**No Code Changes Required** - This is purely a data cleanup task via existing UI.

**Root Cause**: "Drinks only" badge appears because:

1. Backend schedule builder reads `restaurant_service_periods`
2. If any period has `booking_option = 'drinks'`, it sets `drinksOnly` flag
3. Frontend displays badge based on that flag
4. Solution: Remove/remap those periods via the Service Periods UI

See `SOLUTION_SUMMARY.md` and `UI_GUIDE.md` for complete details.
