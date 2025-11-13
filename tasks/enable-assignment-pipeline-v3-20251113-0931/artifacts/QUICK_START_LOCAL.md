# 🚀 Quick Start: Enable V3 Locally (3 Steps)

**Want to test Assignment Pipeline V3 on your local machine? Follow these 3 steps:**

---

## Step 1: Update `.env.local`

Open (or create) `.env.local` in your project root and add:

```bash
# Enable Assignment Pipeline V3
FEATURE_ASSIGNMENT_PIPELINE_V3=true
FEATURE_ASSIGNMENT_PIPELINE_V3_SHADOW=false
FEATURE_ASSIGNMENT_PIPELINE_V3_MAX_PARALLEL=3
```

**Note**: If you don't have a `.env.local` file, copy from `.env.example`:

```bash
cp .env.example .env.local
# Then edit .env.local and add the lines above
```

---

## Step 2: Restart Your Dev Server

```bash
# Stop current dev server (Ctrl+C)

# Start fresh
pnpm run dev
```

**Verify flags loaded**: Check the server logs for:

```
[env] FEATURE_ASSIGNMENT_PIPELINE_V3: true
```

---

## Step 3: Create a Test Booking

### Option A: Via UI (if available)

1. Navigate to booking form (e.g., `http://localhost:3000/book`)
2. Fill in details (restaurant, date, time, party size)
3. Submit booking

### Option B: Via API (curl)

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "YOUR_RESTAURANT_ID",
    "booking_date": "2025-11-20",
    "start_time": "19:00",
    "party_size": 4,
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "customer_phone": "+1234567890"
  }'
```

### Option C: Via Supabase Studio

1. Open Supabase Studio → Table Editor → `bookings`
2. Click "Insert" → "Insert row"
3. Fill required fields, set `status = 'pending'`
4. Save

---

## ✅ Verify It's Working

### Check Server Logs

Look for these log lines after creating a booking:

```
[assignment.coordinator] Processing booking: abc-123-def
[assignment.state_machine] Transition: created -> capacity_verified
[assignment.state_machine] Transition: capacity_verified -> assignment_pending
[assignment.state_machine] Transition: assignment_pending -> assignment_in_progress
[assignment.engine] Strategy: optimal_fit, Score: 0.95
[assignment.state_machine] Transition: assignment_in_progress -> assigned
[assignment.state_machine] Transition: assigned -> confirmed
```

**If you see these logs**: ✅ V3 is working!

**If you see legacy planner logs instead**:

- Check that flags are set correctly
- Restart dev server
- Verify `.env.local` is in project root

---

### Check Supabase `observability_events` Table

Run this query in Supabase Studio → SQL Editor:

```sql
SELECT
  event_type,
  context->>'from' as from_state,
  context->>'to' as to_state,
  created_at
FROM observability_events
WHERE source = 'assignment.state_machine'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected output**:

```
event_type                          | from_state          | to_state             | created_at
------------------------------------+---------------------+----------------------+-------------------------
booking.assignment_state_transition | assigned            | confirmed            | 2025-11-13 09:45:23
booking.assignment_state_transition | assignment_in_prog… | assigned             | 2025-11-13 09:45:22
booking.assignment_state_transition | assignment_pending  | assignment_in_prog…  | 2025-11-13 09:45:21
...
```

---

### Check Booking Status

In Supabase Studio → Table Editor → `bookings`:

1. Find your test booking (by email or ID)
2. Check these columns:
   - `status`: Should be `confirmed`
   - `assignment_state`: Should be `confirmed`
   - `assignment_strategy`: Should have a value (e.g., `optimal_fit`)

---

## 🐛 Troubleshooting

### Issue: Logs show "pipeline_disabled"

**Fix**: Verify `.env.local` has `FEATURE_ASSIGNMENT_PIPELINE_V3=true` (not `false`)

---

### Issue: Logs show "lock_contention" or "noop"

**Possible cause**: Another process already handling the booking, or booking already in terminal state

**Fix**: Create a fresh booking; check booking status isn't already `confirmed`

---

### Issue: No coordinator logs at all

**Possible causes**:

1. `.env.local` not loaded (check if file exists in project root)
2. Server not restarted after adding flags
3. Auto-assign feature disabled (`FEATURE_AUTO_ASSIGN_ON_BOOKING=false`)

**Fix**:

```bash
# Verify env file location
ls -la .env.local

# Check auto-assign flag
grep FEATURE_AUTO_ASSIGN_ON_BOOKING .env.local

# Should show:
# FEATURE_AUTO_ASSIGN_ON_BOOKING=true

# Restart server
pnpm run dev
```

---

## 📊 What to Look For

**Success indicators**:

- ✅ Booking reaches `confirmed` status
- ✅ State transitions flow: `created → capacity_verified → assignment_pending → assignment_in_progress → assigned → confirmed`
- ✅ `observability_events` has entries with `source = 'assignment.state_machine'`
- ✅ Confirmation email sent (check logs or test email endpoint)

**Red flags**:

- ❌ Booking stuck in `assignment_pending` or `assignment_in_progress`
- ❌ No observability events created
- ❌ Errors in server logs related to state transitions
- ❌ Booking moved to `manual_review` (may indicate capacity issue)

---

## 🎯 Next Steps

Once you've confirmed V3 works locally:

1. **Read full rollout plan**: See `plan.md` in this task folder
2. **Set up staging shadow mode**: Follow Phase 2 in `todo.md`
3. **Monitor observability events**: Use queries in `environment-config-guide.md`
4. **Proceed through phases**: Shadow → Full Staging → Production Shadow → Production Rollout

---

## 💡 Pro Tips

- **Test edge cases locally**:

  ```bash
  # No capacity (book all tables first, then try another booking)
  # Lock contention (submit 5 bookings simultaneously)
  # Large party (test combination logic)
  ```

- **Use Supabase Studio's SQL Editor** to inspect state transitions in real-time

- **Keep legacy flow available**: If V3 breaks, just set `FEATURE_ASSIGNMENT_PIPELINE_V3=false` and restart

---

## 📚 Reference

- Full task documentation: `/tasks/enable-assignment-pipeline-v3-20251113-0931/`
- Coordinator implementation: `server/assignments/assignment-coordinator.ts`
- Feature flags: `server/feature-flags.ts`
- Observability events: `server/observability.ts`

---

**Questions?** Check `artifacts/environment-config-guide.md` or ask in #engineering
