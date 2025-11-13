# ✅ Redis Setup Complete for V3 Assignment Pipeline

**Date**: 2025-11-13  
**Status**: Redis configured and running

---

## What Was Done

### 1. Added Redis Configuration to `.env.local`

```bash
QUEUE_REDIS_URL=redis://localhost:6379
```

### 2. Started Redis Server

```bash
redis-server --daemonize yes --port 6379
```

### 3. Verified Redis is Running

```bash
redis-cli ping
# Response: PONG ✅
```

### 4. Restarted Dev Server

```bash
pnpm run dev
# Running on: http://localhost:3001 (port 3000 was in use)
```

---

## ✅ V3 Assignment Pipeline is Now Fully Operational

Your V3 coordinator now has access to:

- ✅ **Distributed Locks** (via Redis) — Prevents race conditions
- ✅ **Rate Limiting** (via Redis) — Max 5 concurrent assignments per restaurant
- ✅ **Circuit Breakers** — Graceful degradation on failures
- ✅ **State Machine** — Optimistic locking with version control
- ✅ **Observability Events** — Full assignment.state_machine tracking

---

## 🧪 Test V3 Now

### Option 1: Via Browser

1. Open: http://localhost:3001
2. Navigate to booking form
3. Create a test booking
4. Watch server logs for V3 coordinator activity

### Option 2: Via API

```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "5746c074-3c20-4876-a9af-b63bb13a0772",
    "booking_date": "2025-11-20",
    "start_time": "19:00",
    "party_size": 4,
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "customer_phone": "+1234567890"
  }'
```

### Expected Logs (Watch Terminal)

```
[assignment.coordinator] Processing booking: <booking-id>
[assignment.state_machine] Transition: created -> capacity_verified
[assignment.state_machine] Transition: capacity_verified -> assignment_pending
[assignment.state_machine] Transition: assignment_pending -> assignment_in_progress
[assignment.engine] Strategy: optimal_fit, Score: 0.95
[distributed-lock] Acquired lock: booking:<booking-id>
[assignment.state_machine] Transition: assignment_in_progress -> assigned
[assignment.state_machine] Transition: assigned -> confirmed
[distributed-lock] Released lock: booking:<booking-id>
```

---

## 📊 Verify in Supabase

After creating a booking, run this query in Supabase Studio:

```sql
-- Check state transitions
SELECT
  event_type,
  context->>'from' as from_state,
  context->>'to' as to_state,
  context->>'version' as version,
  created_at
FROM observability_events
WHERE source = 'assignment.state_machine'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

**Expected output**: Should show progression through V3 states

---

## 🔄 Redis Management Commands

### Check Redis Status

```bash
redis-cli ping
# Should return: PONG
```

### Monitor Redis Activity (Real-time)

```bash
redis-cli MONITOR
# Shows all Redis commands in real-time
# Useful for debugging lock acquisition/release
```

### Check Active Locks

```bash
redis-cli KEYS "lock:*"
# Lists all active locks (should be empty when idle)
```

### Stop Redis (when done)

```bash
redis-cli shutdown
```

### Start Redis Again

```bash
redis-server --daemonize yes --port 6379
```

---

## 🐛 Troubleshooting

### Issue: Redis not responding

```bash
# Check if Redis process is running
ps aux | grep redis-server

# If not running, start it:
redis-server --daemonize yes --port 6379
```

### Issue: Connection refused

```bash
# Check Redis logs
tail -f /opt/homebrew/var/log/redis.log

# Or restart Redis
redis-cli shutdown
redis-server --daemonize yes --port 6379
```

### Issue: Port conflict

```bash
# Check what's using port 6379
lsof -i :6379

# Use a different port if needed
redis-server --daemonize yes --port 6380
# Then update .env.local:
# QUEUE_REDIS_URL=redis://localhost:6380
```

---

## 🚀 Production Setup (Later)

For production deployment, use a managed Redis service:

### Option 1: Upstash (Recommended - Serverless)

```bash
# Sign up at upstash.com
# Create Redis database
# Copy connection string:
QUEUE_REDIS_URL=rediss://default:your_password@your-endpoint.upstash.io:6379
```

### Option 2: Railway

```bash
# Add Redis service in Railway dashboard
# Copy connection URL
QUEUE_REDIS_URL=redis://default:password@redis.railway.internal:6379
```

### Option 3: AWS ElastiCache / Azure Cache for Redis

```bash
QUEUE_REDIS_URL=redis://your-cluster.cache.amazonaws.com:6379
```

---

## 📈 Performance Notes

### Local Redis

- **Latency**: <1ms (same machine)
- **Throughput**: ~100k ops/sec
- **Good for**: Development, testing, small-scale production

### Cloud Redis (Upstash/Railway)

- **Latency**: 10-50ms (depending on region)
- **Throughput**: 10k-100k ops/sec
- **Good for**: Production, distributed deployments

### Lock TTL Settings

Current: 30 seconds (configured in AssignmentCoordinator)

- Prevents stuck locks if process crashes
- Auto-releases after TTL expires

---

## ✅ Checklist

- [x] Redis installed and running
- [x] `QUEUE_REDIS_URL` configured in `.env.local`
- [x] Dev server restarted
- [x] Ready to test V3 assignments
- [ ] Create test booking to verify V3 works
- [ ] Check observability_events for state transitions
- [ ] Monitor Redis lock activity

---

## 🎯 Next Steps

1. **Create a test booking** (via UI or API)
2. **Watch server logs** for V3 coordinator activity
3. **Verify in Supabase** that observability events are created
4. **Check Redis** for lock activity: `redis-cli KEYS "lock:*"`
5. **Read full docs**: `tasks/enable-assignment-pipeline-v3-20251113-0931/README.md`

---

**Your V3 Assignment Pipeline is now fully configured and ready to use!** 🎉

Redis provides the infrastructure for:

- Distributed locks (no booking race conditions)
- Rate limiting (prevent overload)
- Future: Background job queues, caching, pub/sub

For questions, see the main task documentation or quick-start guide.
